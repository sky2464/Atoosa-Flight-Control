import fs from 'node:fs/promises';
import path from 'node:path';

export interface FlightTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: 'human' | 'ai-agent' | 'unassigned';
  createdAt: string;
  completedAt?: string;
}

export interface FlightMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate?: string;
  completed: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const MILESTONES_FILE = path.join(DATA_DIR, 'milestones.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function getTasks(projectId?: string): Promise<FlightTask[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(TASKS_FILE, 'utf-8');
    const tasks: FlightTask[] = JSON.parse(raw);
    return projectId ? tasks.filter((t) => t.projectId === projectId) : tasks;
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: FlightTask[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export async function addTask(task: Omit<FlightTask, 'id' | 'createdAt'>): Promise<FlightTask> {
  const tasks = await getTasks();
  const newTask: FlightTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<FlightTask>): Promise<FlightTask | null> {
  const tasks = await getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  if (updates.status === 'done' && !tasks[idx].completedAt) {
    tasks[idx].completedAt = new Date().toISOString();
  }
  await saveTasks(tasks);
  return tasks[idx];
}

export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length !== tasks.length) {
    await saveTasks(filtered);
    return true;
  }
  return false;
}
