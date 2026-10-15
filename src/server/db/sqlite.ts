import { Database } from 'bun:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { resolveDataDir, getWorkstationName } from '../engine/os/platform.ts';
import type { ProjectRecord, AISettings } from '../../shared/types.ts';

const dataDir = resolveDataDir();
fs.mkdirSync(dataDir, { recursive: true });

export const DB_PATH = path.join(dataDir, 'flight_control.db');
export const db = new Database(DB_PATH);

// Configure SQLite for high-concurrency and data integrity
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA foreign_keys = ON;');
db.run('PRAGMA synchronous = NORMAL;');

// Initialize Tables
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    selected_cli TEXT NOT NULL DEFAULT 'antigravity',
    claude_cli_path TEXT,
    ollama_endpoint TEXT NOT NULL DEFAULT 'http://localhost:11434',
    ollama_model TEXT NOT NULL DEFAULT 'llama3:latest',
    active_provider TEXT NOT NULL DEFAULT 'antigravity',
    profile_name TEXT NOT NULL DEFAULT 'Flight Commander',
    profile_callsign TEXT NOT NULL DEFAULT 'TOWER-1',
    profile_role TEXT NOT NULL DEFAULT 'Lead Architect',
    profile_workstation TEXT NOT NULL DEFAULT 'Localhost',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_scanned_at TEXT,
    interview_json TEXT,
    recommendation_json TEXT,
    telemetry_json TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS telemetry_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scanned_at TEXT NOT NULL,
    flight_score INTEGER NOT NULL,
    files_over_500_count INTEGER NOT NULL,
    total_files INTEGER NOT NULL,
    total_lines INTEGER NOT NULL,
    raw_json TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_telemetry_project ON telemetry_history(project_id);
  CREATE INDEX IF NOT EXISTS idx_telemetry_scanned_at ON telemetry_history(scanned_at);
`);

/**
 * One-time transparent migration from legacy JSON files into SQLite.
 */
function migrateLegacyJsonFiles() {
  try {
    // 1. Settings migration
    const settingsCount = (db.query('SELECT COUNT(*) as count FROM settings').get() as { count: number }).count;
    const settingsFile = path.join(dataDir, 'settings.json');
    if (settingsCount === 0 && fs.existsSync(settingsFile)) {
      try {
        const raw = fs.readFileSync(settingsFile, 'utf-8');
        const s: Partial<AISettings> = JSON.parse(raw);
        db.run(
          `INSERT INTO settings (
            id, onboarding_completed, selected_cli, claude_cli_path,
            ollama_endpoint, ollama_model, active_provider,
            profile_name, profile_callsign, profile_role, profile_workstation, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'global',
            s.onboardingCompleted ? 1 : 0,
            s.selectedCli || 'antigravity',
            s.claudeCliPath || '',
            s.ollamaEndpoint || 'http://localhost:11434',
            s.ollamaModel || 'llama3:latest',
            s.activeProvider || 'antigravity',
            s.profile?.name || 'Flight Commander',
            s.profile?.callsign || 'TOWER-1',
            s.profile?.role || 'Lead Architect',
            s.profile?.workstation || getWorkstationName(),
            new Date().toISOString(),
          ]
        );
      } catch {}
    }

    // 2. Projects migration
    const projectsCount = (db.query('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
    const projectsFile = path.join(dataDir, 'projects.json');
    if (projectsCount === 0 && fs.existsSync(projectsFile)) {
      try {
        const raw = fs.readFileSync(projectsFile, 'utf-8');
        const list: ProjectRecord[] = JSON.parse(raw);
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO projects (
            id, name, path, status, created_at, last_scanned_at,
            interview_json, recommendation_json, telemetry_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const p of list) {
          if (!p.id || !p.path) continue;
          insertStmt.run(
            p.id,
            p.name,
            p.path,
            p.status,
            p.createdAt,
            p.lastScannedAt || null,
            p.interview ? JSON.stringify(p.interview) : null,
            p.recommendation ? JSON.stringify(p.recommendation) : null,
            p.telemetry ? JSON.stringify(p.telemetry) : null
          );
        }
      } catch {}
    }

    // 3. Tasks migration
    const tasksCount = (db.query('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
    const tasksFile = path.join(dataDir, 'tasks.json');
    if (tasksCount === 0 && fs.existsSync(tasksFile)) {
      try {
        const raw = fs.readFileSync(tasksFile, 'utf-8');
        const tasks: any[] = JSON.parse(raw);
        const insertTask = db.prepare(`
          INSERT OR REPLACE INTO tasks (
            id, project_id, title, description, status, priority, assigned_to, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const t of tasks) {
          if (!t.id || !t.title) continue;
          insertTask.run(
            t.id,
            t.projectId || 'global',
            t.title,
            t.description || '',
            t.status || 'backlog',
            t.priority || 'medium',
            t.assignedTo || 'unassigned',
            t.createdAt || new Date().toISOString(),
            t.completedAt || null
          );
        }
      } catch {}
    }
  } catch (err) {
    console.error('Notice: JSON to SQLite migration skipped:', err);
  }
}

migrateLegacyJsonFiles();
