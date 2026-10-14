import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectRecord, AISettings } from '../shared/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS: AISettings = {
  onboardingCompleted: false,
  selectedCli: 'claude-cli',
  claudeCliPath: '/Users/chicademy/.local/bin/claude',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3:latest',
  activeProvider: 'claude-cli',
  profile: {
    name: 'Flight Commander',
    callsign: 'TOWER-1',
    role: 'Lead Architect',
    workstation: 'Localhost Mac',
  },
};

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }
}

export async function getProjects(): Promise<ProjectRecord[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveProjects(projects: ProjectRecord[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
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
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AISettings>): Promise<AISettings> {
  await ensureDataDir();
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
