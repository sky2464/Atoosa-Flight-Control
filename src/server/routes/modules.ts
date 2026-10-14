import { Hono } from 'hono';
import { getModules } from '../modules/registry.ts';
import { getTasks, addTask, updateTask, deleteTask } from '../modules/project-manager/projectManagerService.ts';

const modules = new Hono();

// List all modules & pluggable slots
modules.get('/', (c) => {
  return c.json({ success: true, modules: getModules() });
});

// Modular Project Manager: Task management
modules.get('/tasks', async (c) => {
  const projectId = c.req.query('projectId');
  const tasks = await getTasks(projectId);
  return c.json({ success: true, tasks });
});

modules.post('/tasks', async (c) => {
  const body = await c.req.json();
  if (!body.title) {
    return c.json({ success: false, error: 'Task title is required' }, 400);
  }

  const task = await addTask({
    projectId: body.projectId || 'global',
    title: body.title,
    description: body.description || '',
    status: body.status || 'backlog',
    priority: body.priority || 'medium',
    assignedTo: body.assignedTo || 'unassigned',
  });

  return c.json({ success: true, task });
});

modules.patch('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  const updated = await updateTask(id, updates);
  if (!updated) return c.json({ success: false, error: 'Task not found' }, 404);
  return c.json({ success: true, task: updated });
});

modules.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await deleteTask(id);
  return c.json({ success: deleted });
});

export default modules;
