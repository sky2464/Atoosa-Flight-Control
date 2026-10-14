import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { emitGovernanceFiles } from '../src/server/modules/governance/governanceService.ts';

describe('Governance Emitter (Zero-Pollution Target)', () => {
  it('should emit only specified markdown files to the target directory', async () => {
    const tmpDir = path.join(process.cwd(), 'data', 'test_gov_target');
    await fs.mkdir(tmpDir, { recursive: true });

    try {
      const res = await emitGovernanceFiles({
        targetFolder: tmpDir,
        files: [
          { filename: 'AGENT.md', content: '# AGENT RULES\nMax 500 lines.' },
          { filename: 'ARCHITECTURE.md', content: '# ARCHITECTURE' },
        ],
        overwriteExisting: true,
      });

      expect(res.success).toBe(true);
      expect(res.writtenFiles).toContain('AGENT.md');
      expect(res.writtenFiles).toContain('ARCHITECTURE.md');

      // Verify files actually exist on disk
      const agentStat = await fs.stat(path.join(tmpDir, 'AGENT.md'));
      expect(agentStat.isFile()).toBe(true);

      // Verify zero node_modules or flight control files exist in the target
      const targetEntries = await fs.readdir(tmpDir);
      expect(targetEntries).toEqual(['AGENT.md', 'ARCHITECTURE.md']);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
