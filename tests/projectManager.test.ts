import { describe, it, expect } from 'bun:test';
import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../src/server/modules/project-manager/projectManagerService.ts';

describe('Modular Project Manager Service', () => {
  it('should create, retrieve, update, and delete flight tasks', async () => {
    const task = await addTask({
      projectId: 'test_project_1',
      title: 'Decompose monolith into sub-modules',
      description: 'Breakdown file exceeding 500 lines',
      priority: 'high',
      status: 'backlog',
      assignedTo: 'ai-agent',
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Decompose monolith into sub-modules');
    expect(task.status).toBe('backlog');

    // Update status to in-progress
    const updated = await updateTask(task.id, { status: 'in-progress' });
    expect(updated?.status).toBe('in-progress');

    // Update status to done
    const completed = await updateTask(task.id, { status: 'done' });
    expect(completed?.status).toBe('done');
    expect(completed?.completedAt).toBeDefined();

    // Verify retrieval
    const projectTasks = await getTasks('test_project_1');
    expect(projectTasks.some((t) => t.id === task.id)).toBe(true);

    // Delete task
    const deleted = await deleteTask(task.id);
    expect(deleted).toBe(true);
  });
});
