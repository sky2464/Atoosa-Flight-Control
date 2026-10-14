import { Hono } from 'hono';
import { getProjects, getProjectById, upsertProject, deleteProject } from '../db.ts';
import type { ProjectRecord } from '../../shared/types.ts';

const projects = new Hono();

projects.get('/', async (c) => {
  const list = await getProjects();
  return c.json({ success: true, projects: list });
});

projects.get('/:id', async (c) => {
  const project = await getProjectById(c.req.param('id'));
  if (!project) return c.json({ success: false, error: 'Project not found' }, 404);
  return c.json({ success: true, project });
});

projects.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.name || !body.path) {
    return c.json({ success: false, error: 'Both name and path are required' }, 400);
  }

  const project: ProjectRecord = {
    id: body.id || `flight_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: body.name,
    path: body.path,
    status: body.status || 'pre-flight',
    createdAt: body.createdAt || new Date().toISOString(),
    interview: body.interview,
    recommendation: body.recommendation,
    telemetry: body.telemetry,
  };

  const saved = await upsertProject(project);
  return c.json({ success: true, project: saved });
});

projects.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const removed = await deleteProject(id);
  return c.json({ success: removed });
});

export default projects;
