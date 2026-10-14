import { Hono } from 'hono';
import { analyzePreFlight } from '../modules/discovery/discoveryService.ts';
import type { PreFlightInterview } from '../../shared/types.ts';

const discovery = new Hono();

discovery.post('/analyze', async (c) => {
  try {
    const interview: PreFlightInterview = await c.req.json();
    if (!interview.projectName || !interview.projectMission) {
      return c.json({ success: false, error: 'Project name and mission are required' }, 400);
    }

    const recommendation = analyzePreFlight(interview);
    return c.json({ success: true, recommendation });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default discovery;
