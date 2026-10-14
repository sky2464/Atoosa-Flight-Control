import { Hono } from 'hono';
import { emitGovernanceFiles, type GovernanceEmitRequest } from '../modules/governance/governanceService.ts';

const governance = new Hono();

governance.post('/emit', async (c) => {
  try {
    const req: GovernanceEmitRequest = await c.req.json();
    if (!req.targetFolder || !req.files || req.files.length === 0) {
      return c.json({ success: false, error: 'Target folder and files array are required' }, 400);
    }

    const result = await emitGovernanceFiles(req);
    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default governance;
