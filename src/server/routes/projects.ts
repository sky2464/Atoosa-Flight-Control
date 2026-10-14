import { Hono } from 'hono';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getProjects, getProjectById, upsertProject, deleteProject, getTelemetryHistory } from '../db.ts';
import { isTowerAppDir } from '../engine/os/platform.ts';
import { safeSpawn } from '../engine/os/process.ts';
import { softReadProject } from '../modules/scanner/scannerService.ts';
import type { ProjectRecord } from '../../shared/types.ts';

const projects = new Hono();

projects.get('/', async (c) => {
  const list = await getProjects();
  // Filter out any accidentally stored tower self-monitoring records
  const cleanList = list.filter((p) => !isTowerAppDir(p.path));
  return c.json({ success: true, projects: cleanList });
});

projects.get('/:id', async (c) => {
  const project = await getProjectById(c.req.param('id'));
  if (!project) return c.json({ success: false, error: 'Project not found' }, 404);
  return c.json({ success: true, project });
});

projects.get('/:id/history', async (c) => {
  const id = c.req.param('id');
  const project = await getProjectById(id);
  if (!project) return c.json({ success: false, error: 'Project not found' }, 404);
  const limitQuery = c.req.query('limit');
  const limit = limitQuery ? parseInt(limitQuery, 10) : 50;
  const history = await getTelemetryHistory(id, isNaN(limit) ? 50 : limit);
  return c.json({ success: true, history });
});

/**
 * Validates a candidate project path before attaching.
 * Verifies existence, directory type, git presence, and enforces anti-dogfooding.
 */
projects.post('/validate-path', async (c) => {
  try {
    const { path: candidatePath } = await c.req.json();
    if (!candidatePath || typeof candidatePath !== 'string') {
      return c.json({ valid: false, error: 'Path is required' }, 400);
    }

    const resolved = path.resolve(candidatePath.trim());

    if (isTowerAppDir(resolved)) {
      return c.json({
        valid: false,
        isTower: true,
        error: 'Cannot monitor the Control Tower itself. Atoosa Flight Control is an external observer for target projects. Please choose an external folder.',
      }, 400);
    }

    const stat = await fs.stat(resolved).catch(() => null);
    if (!stat) {
      return c.json({ valid: false, exists: false, error: 'Directory does not exist on disk' }, 404);
    }

    if (!stat.isDirectory()) {
      return c.json({ valid: false, error: 'Target path is not a directory' }, 400);
    }

    const gitDir = path.join(resolved, '.git');
    const hasGit = await fs.stat(gitDir).then((s) => s.isDirectory()).catch(() => false);

    return c.json({
      valid: true,
      path: resolved,
      name: path.basename(resolved),
      hasGit,
    });
  } catch (err: any) {
    return c.json({ valid: false, error: err.message }, 500);
  }
});

/**
 * Clones a remote repository locally and automatically attaches it.
 */
projects.post('/clone', async (c) => {
  try {
    const { repoUrl, targetDir } = await c.req.json();
    if (!repoUrl || !targetDir) {
      return c.json({ success: false, error: 'Both repository URL and target folder are required' }, 400);
    }

    const resolvedDir = path.resolve(targetDir.trim());

    if (isTowerAppDir(resolvedDir)) {
      return c.json({ success: false, error: 'Cannot clone into the Control Tower directory itself.' }, 400);
    }

    // Check if target directory exists and is non-empty
    const exists = await fs.stat(resolvedDir).catch(() => null);
    if (exists) {
      const files = await fs.readdir(resolvedDir).catch(() => []);
      if (files.length > 0) {
        return c.json({ success: false, error: `Target folder "${resolvedDir}" already exists and is not empty.` }, 400);
      }
    }

    // Run git clone via safeSpawn
    const cloneResult = await safeSpawn(['git', 'clone', repoUrl.trim(), resolvedDir], { timeoutMs: 60000 });
    if (!cloneResult.success) {
      return c.json({
        success: false,
        error: cloneResult.stderr || 'Git clone failed. Check the URL and your git credentials.',
      }, 400);
    }

    // Perform non-destructive soft-read immediately
    const telemetry = await softReadProject(resolvedDir);
    const name = path.basename(resolvedDir);

    const project = await upsertProject({
      id: `flight_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      path: resolvedDir,
      status: telemetry.flightScore >= 75 ? 'cleared-for-takeoff' : 'in-flight',
      createdAt: new Date().toISOString(),
      telemetry,
    });

    return c.json({
      success: true,
      project,
      message: `Cloned and soft-read successfully into ${resolvedDir}`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

projects.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.name || !body.path) {
    return c.json({ success: false, error: 'Both name and path are required' }, 400);
  }

  const resolved = path.resolve(body.path);
  if (isTowerAppDir(resolved)) {
    return c.json({
      success: false,
      error: 'The Control Tower cannot be registered as an aircraft flight. Please select an external project directory.',
    }, 400);
  }

  const project: ProjectRecord = {
    id: body.id || `flight_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: body.name,
    path: resolved,
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
