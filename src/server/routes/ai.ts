import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getSettings, saveSettings } from '../db.ts';
import { streamPromptImprovement, type PromptImprovementRequest } from '../modules/ai-bridge/aiService.ts';

const ai = new Hono();

ai.get('/settings', async (c) => {
  const settings = await getSettings();
  return c.json({ success: true, settings });
});

ai.post('/settings', async (c) => {
  const body = await c.req.json();
  const updated = await saveSettings(body);
  return c.json({ success: true, settings: updated });
});

ai.post('/improve-prompt', async (c) => {
  const body: PromptImprovementRequest = await c.req.json();
  if (!body.userIdea) {
    return c.json({ success: false, error: 'User idea is required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      const generator = streamPromptImprovement(body, c.req.raw.signal);
      for await (const chunk of generator) {
        await stream.writeSSE({
          event: 'token',
          data: chunk,
        });
      }
      await stream.writeSSE({
        event: 'done',
        data: JSON.stringify({ status: 'completed' }),
      });
    } catch (err: any) {
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: err.message }),
      });
    }
  });
});

export default ai;
