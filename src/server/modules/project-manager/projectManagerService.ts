import path from 'node:path';
import { db } from '../../db/sqlite.ts';
import { DATA_DIR } from '../../db.ts';

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

export const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
export const MILESTONES_FILE = path.join(DATA_DIR, 'milestones.json');

function rowToTask(row: any): FlightTask {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || '',
    status: row.status as FlightTask['status'],
    priority: row.priority as FlightTask['priority'],
    assignedTo: row.assigned_to as FlightTask['assignedTo'],
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  };
}

export async function getTasks(projectId?: string): Promise<FlightTask[]> {
  const rows = projectId
    ? (db.query('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC').all(projectId) as any[])
    : (db.query('SELECT * FROM tasks ORDER BY created_at ASC').all() as any[]);
  return rows.map(rowToTask);
}

export async function saveTasks(tasks: FlightTask[]): Promise<void> {
  const insert = db.prepare(`
    INSERT INTO tasks (
      id, project_id, title, description, status, priority, assigned_to, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      project_id = excluded.project_id,
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      priority = excluded.priority,
      assigned_to = excluded.assigned_to,
      completed_at = excluded.completed_at
  `);

  const tx = db.transaction((list: FlightTask[]) => {
    for (const t of list) {
      insert.run(
        t.id,
        t.projectId,
        t.title,
        t.description || '',
        t.status,
        t.priority,
        t.assignedTo,
        t.createdAt,
        t.completedAt || null
      );
    }
  });

  tx(tasks);
}

export async function addTask(task: Omit<FlightTask, 'id' | 'createdAt'>): Promise<FlightTask> {
  const newTask: FlightTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const insert = db.prepare(`
    INSERT INTO tasks (
      id, project_id, title, description, status, priority, assigned_to, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    newTask.id,
    newTask.projectId,
    newTask.title,
    newTask.description || '',
    newTask.status,
    newTask.priority,
    newTask.assignedTo,
    newTask.createdAt,
    newTask.completedAt || null
  );

  return newTask;
}

export async function updateTask(id: string, updates: Partial<FlightTask>): Promise<FlightTask | null> {
  const existingRow = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!existingRow) return null;

  const current = rowToTask(existingRow);
  const updated: FlightTask = {
    ...current,
    ...updates,
  };

  if (updates.status === 'done' && !updated.completedAt) {
    updated.completedAt = new Date().toISOString();
  }

  const stmt = db.prepare(`
    UPDATE tasks SET
      project_id = ?,
      title = ?,
      description = ?,
      status = ?,
      priority = ?,
      assigned_to = ?,
      completed_at = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.projectId,
    updated.title,
    updated.description || '',
    updated.status,
    updated.priority,
    updated.assignedTo,
    updated.completedAt || null,
    id
  );

  return updated;
}

export async function deleteTask(id: string): Promise<boolean> {
  const res = db.run('DELETE FROM tasks WHERE id = ?', [id]);
  return res.changes > 0;
}
