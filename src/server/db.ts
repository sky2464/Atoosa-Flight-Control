import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectRecord, AISettings } from '../shared/types.ts';
import { resolveDataDir, getWorkstationName } from './engine/os/platform.ts';

export const DATA_DIR = resolveDataDir();
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS: AISettings = {
  onboardingCompleted: false,
  selectedCli: 'claude-cli',
  claudeCliPath: '',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3:latest',
  activeProvider: 'claude-cli',
  profile: {
    name: 'Flight Commander',
    callsign: 'TOWER-1',
    role: 'Lead Architect',
    workstation: getWorkstationName(),
  },
};

/**
 * Ensures the target data directory exists on disk.
 */
export async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

/**
 * Atomically writes data to a JSON file via a temporary file + rename.
 * Prevents partial writes, corrupted files, and race conditions.
 */
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

/**
 * Reads and parses a JSON file safely, returning fallback value if file is missing or unreadable.
 */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getProjects(): Promise<ProjectRecord[]> {
  return readJsonFile<ProjectRecord[]>(PROJECTS_FILE, []);
}

export async function saveProjects(projects: ProjectRecord[]): Promise<void> {
  await writeJsonAtomic(PROJECTS_FILE, projects);
}

export async function getProjectById(id: string): Promise<ProjectRecord | null> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function upsertProject(project: ProjectRecord): Promise<ProjectRecord> {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...projects[index], ...project };
  } else {
    projects.push(project);
  }
  await saveProjects(projects);
  return project;
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length !== projects.length) {
    await saveProjects(filtered);
    return true;
  }
  return false;
}

export async function getSettings(): Promise<AISettings> {
  const saved = await readJsonFile<Partial<AISettings>>(SETTINGS_FILE, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    profile: {
      ...DEFAULT_SETTINGS.profile,
      ...(saved.profile || {}),
      // Update workstation if not explicitly customized
      workstation: saved.profile?.workstation || getWorkstationName(),
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
  await writeJsonAtomic(SETTINGS_FILE, updated);
  return updated;
}
