import { Hono } from 'hono';
import path from 'node:path';
import { detectSystemCLIs } from '../modules/system/systemService.ts';
import { getSettings, saveSettings } from '../db.ts';

const system = new Hono();

system.get('/clis', async (c) => {
  try {
    const clis = await detectSystemCLIs();
    return c.json({ success: true, clis });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

system.post('/test-connection', async (c) => {
  try {
    const { cliId, customPath } = await c.req.json();
    const clis = await detectSystemCLIs();
    const found = clis.find((cl) => cl.id === cliId);

    const execPath = customPath || found?.path || (cliId === 'claude-cli' ? 'claude' : 'ollama');

    const proc = Bun.spawn([execPath, '--version'], {
      env: { ...process.env },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      return c.json({
        success: true,
        message: `Connected successfully to ${execPath}`,
        version: stdout.trim() || 'Ready',
        path: execPath,
      });
    } else {
      return c.json({
        success: false,
        error: stderr.trim() || `Process exited with code ${exitCode}`,
      }, 400);
    }
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

system.post('/complete-onboarding', async (c) => {
  try {
    const { selectedCli, claudeCliPath, profile } = await c.req.json();
    const updated = await saveSettings({
      onboardingCompleted: true,
      selectedCli: selectedCli || 'claude-cli',
      activeProvider: (selectedCli as any) || 'claude-cli',
      claudeCliPath: claudeCliPath || undefined,
      profile: profile || undefined,
    });
    return c.json({ success: true, settings: updated });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

system.post('/exec', async (c) => {
  try {
    const { command, args = [] } = await c.req.json();
    const binPath = path.resolve(process.cwd(), 'bin/afc.ts');
    const proc = Bun.spawn(['bun', binPath, command, ...args], {
      env: { ...process.env },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return c.json({
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default system;
