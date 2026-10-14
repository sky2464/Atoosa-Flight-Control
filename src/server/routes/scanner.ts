import { Hono } from 'hono';
import { softReadProject } from '../modules/scanner/scannerService.ts';
import { getProjectById, upsertProject } from '../db.ts';

const scanner = new Hono();

scanner.post('/scan', async (c) => {
  try {
    const { path: targetPath, projectId } = await c.req.json();
    if (!targetPath) {
      return c.json({ success: false, error: 'Target directory path is required' }, 400);
    }

    const telemetry = await softReadProject(targetPath);

    // If projectId provided, update project telemetry
    if (projectId) {
      const existing = await getProjectById(projectId);
      if (existing) {
        existing.telemetry = telemetry;
        existing.lastScannedAt = telemetry.scannedAt;
        if (telemetry.flightScore >= 75) {
          existing.status = 'cleared-for-takeoff';
        } else if (telemetry.flightScore < 50) {
          existing.status = 'grounded';
        }
        await upsertProject(existing);
      }
    }

    return c.json({ success: true, telemetry });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default scanner;
