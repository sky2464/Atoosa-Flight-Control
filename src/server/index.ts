import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/bun';

import projects from './routes/projects.ts';
import scanner from './routes/scanner.ts';
import discovery from './routes/discovery.ts';
import governance from './routes/governance.ts';
import ai from './routes/ai.ts';
import modules from './routes/modules.ts';
import system from './routes/system.ts';

const app = new Hono();

// Enable CORS for frontend during development
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API Routes
app.get('/api/health', (c) => c.json({
  status: 'operational',
  service: 'Atoosa Flight Control Tower',
  version: '1.0.0-mvp',
  timestamp: new Date().toISOString(),
}));

app.route('/api/projects', projects);
app.route('/api/scanner', scanner);
app.route('/api/discovery', discovery);
app.route('/api/governance', governance);
app.route('/api/ai', ai);
app.route('/api/modules', modules);
app.route('/api/system', system);

// In production, serve static files from dist/ with SPA fallback
try {
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
} catch {
  // dist directory might not exist during dev
}

const PORT = Number(Bun.env.PORT) || 3001;

console.log(`🛫 Atoosa Flight Control Tower active at http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
