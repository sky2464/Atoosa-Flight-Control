import fs from 'node:fs/promises';
import path from 'node:path';
import { db, DB_PATH } from './db/sqlite.ts';
import { resolveDataDir, getWorkstationName } from './engine/os/platform.ts';
import type { ProjectRecord, AISettings, TelemetrySummary } from '../shared/types.ts';

export const DATA_DIR = resolveDataDir();
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS: AISettings = {
  onboardingCompleted: false,
  selectedCli: 'antigravity',
  claudeCliPath: '',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3:latest',
  activeProvider: 'antigravity',
  profile: {
    name: 'Flight Commander',
    callsign: 'TOWER-1',
    role: 'Lead Architect',
    workstation: getWorkstationName(),
  },
};

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function writeJsonAtomic<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  const dir = path.dirname(filePath);
  const tmpFile = path.join(
    dir,
    `.${path.basename(filePath)}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
  );
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpFile, filePath);
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToProject(row: any): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    status: row.status as any,
    createdAt: row.created_at,
    lastScannedAt: row.last_scanned_at || undefined,
    interview: row.interview_json ? JSON.parse(row.interview_json) : undefined,
    recommendation: row.recommendation_json ? JSON.parse(row.recommendation_json) : undefined,
    telemetry: row.telemetry_json ? JSON.parse(row.telemetry_json) : undefined,
  };
}

export async function getProjects(): Promise<ProjectRecord[]> {
  const rows = db.query('SELECT * FROM projects ORDER BY created_at DESC').all() as any[];
  return rows.map(rowToProject);
}

export async function saveProjects(projects: ProjectRecord[]): Promise<void> {
  const insert = db.prepare(`
    INSERT INTO projects (
      id, name, path, status, created_at, last_scanned_at,
      interview_json, recommendation_json, telemetry_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      path = excluded.path,
      status = excluded.status,
      last_scanned_at = excluded.last_scanned_at,
      interview_json = excluded.interview_json,
      recommendation_json = excluded.recommendation_json,
      telemetry_json = excluded.telemetry_json
  `);

  const tx = db.transaction((list: ProjectRecord[]) => {
    for (const p of list) {
      insert.run(
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
  });

  tx(projects);
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const row = db.query('SELECT * FROM projects WHERE id = ?').get(id) as any;
  return row ? rowToProject(row) : null;
}

export async function upsertProject(project: ProjectRecord): Promise<ProjectRecord> {
  const stmt = db.prepare(`
    INSERT INTO projects (
      id, name, path, status, created_at, last_scanned_at,
      interview_json, recommendation_json, telemetry_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      path = excluded.path,
      status = excluded.status,
      last_scanned_at = excluded.last_scanned_at,
      interview_json = excluded.interview_json,
      recommendation_json = excluded.recommendation_json,
      telemetry_json = excluded.telemetry_json
  `);

  stmt.run(
    project.id,
    project.name,
    project.path,
    project.status,
    project.createdAt,
    project.lastScannedAt || null,
    project.interview ? JSON.stringify(project.interview) : null,
    project.recommendation ? JSON.stringify(project.recommendation) : null,
    project.telemetry ? JSON.stringify(project.telemetry) : null
  );

  // If telemetry is attached, record history snapshot
  if (project.telemetry) {
    await recordTelemetryHistory(project.id, project.telemetry);
  }

  return project;
}

export async function deleteProject(id: string): Promise<boolean> {
  const res = db.run('DELETE FROM projects WHERE id = ?', [id]);
  return res.changes > 0;
}

export async function getSettings(): Promise<AISettings> {
  const row = db.query('SELECT * FROM settings WHERE id = "global"').get() as any;
  if (!row) {
    // Seed default settings row
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO settings (
        id, onboarding_completed, selected_cli, claude_cli_path,
        ollama_endpoint, ollama_model, active_provider,
        profile_name, profile_callsign, profile_role, profile_workstation, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'global',
        DEFAULT_SETTINGS.onboardingCompleted ? 1 : 0,
        DEFAULT_SETTINGS.selectedCli,
        DEFAULT_SETTINGS.claudeCliPath || '',
        DEFAULT_SETTINGS.ollamaEndpoint,
        DEFAULT_SETTINGS.ollamaModel,
        DEFAULT_SETTINGS.activeProvider,
        DEFAULT_SETTINGS.profile.name,
        DEFAULT_SETTINGS.profile.callsign,
        DEFAULT_SETTINGS.profile.role,
        DEFAULT_SETTINGS.profile.workstation,
        now,
      ]
    );
    return DEFAULT_SETTINGS;
  }

  return {
    onboardingCompleted: Boolean(row.onboarding_completed),
    selectedCli: row.selected_cli,
    claudeCliPath: row.claude_cli_path || '',
    ollamaEndpoint: row.ollama_endpoint,
    ollamaModel: row.ollama_model,
    activeProvider: row.active_provider as any,
    profile: {
      name: row.profile_name,
      callsign: row.profile_callsign,
      role: row.profile_role,
      workstation: row.profile_workstation || getWorkstationName(),
    },
  };
}

export async function saveSettings(settings: Partial<AISettings>): Promise<AISettings> {
  const current = await getSettings();
  const updated: AISettings = {
    ...current,
    ...settings,
    profile: {
      ...current.profile,
      ...(settings.profile || {}),
    },
  };

  const now = new Date().toISOString();
  db.run(
    `INSERT INTO settings (
      id, onboarding_completed, selected_cli, claude_cli_path,
      ollama_endpoint, ollama_model, active_provider,
      profile_name, profile_callsign, profile_role, profile_workstation, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      onboarding_completed = excluded.onboarding_completed,
      selected_cli = excluded.selected_cli,
      claude_cli_path = excluded.claude_cli_path,
      ollama_endpoint = excluded.ollama_endpoint,
      ollama_model = excluded.ollama_model,
      active_provider = excluded.active_provider,
      profile_name = excluded.profile_name,
      profile_callsign = excluded.profile_callsign,
      profile_role = excluded.profile_role,
      profile_workstation = excluded.profile_workstation,
      updated_at = excluded.updated_at`,
    [
      'global',
      updated.onboardingCompleted ? 1 : 0,
      updated.selectedCli,
      updated.claudeCliPath || '',
      updated.ollamaEndpoint,
      updated.ollamaModel,
      updated.activeProvider,
      updated.profile.name,
      updated.profile.callsign,
      updated.profile.role,
      updated.profile.workstation,
      now,
    ]
  );

  return updated;
}

/**
 * Records a telemetry snapshot in SQLite for historical tracking.
 */
export async function recordTelemetryHistory(projectId: string, telemetry: TelemetrySummary): Promise<void> {
  try {
    const historyId = `th_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO telemetry_history (
        id, project_id, scanned_at, flight_score,
        files_over_500_count, total_files, total_lines, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      historyId,
      projectId,
      telemetry.scannedAt || new Date().toISOString(),
      telemetry.flightScore,
      telemetry.filesOver500Lines?.length || 0,
      telemetry.totalFiles,
      telemetry.totalLines,
      JSON.stringify(telemetry)
    );
  } catch (err) {
    console.error('Failed to log telemetry history snapshot:', err);
  }
}

/**
 * Retrieves telemetry history snapshots for a project.
 */
export async function getTelemetryHistory(projectId: string, limit = 50): Promise<any[]> {
  const rows = db.query(
    'SELECT id, project_id, scanned_at, flight_score, files_over_500_count, total_files, total_lines FROM telemetry_history WHERE project_id = ? ORDER BY scanned_at DESC LIMIT ?'
  ).all(projectId, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    scannedAt: r.scanned_at,
    flightScore: r.flight_score,
    filesOver500Count: r.files_over_500_count,
    totalFiles: r.total_files,
    totalLines: r.total_lines,
  }));
}
