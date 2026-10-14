#!/usr/bin/env bun
import { softReadProject } from '../src/server/modules/scanner/scannerService.ts';
import { analyzePreFlight } from '../src/server/modules/discovery/discoveryService.ts';
import { emitGovernanceFiles } from '../src/server/modules/governance/governanceService.ts';
import { detectSystemCLIs } from '../src/server/modules/system/systemService.ts';
import { getTasks, addTask, updateTask } from '../src/server/modules/project-manager/projectManagerService.ts';
import { getProjects, upsertProject, getSettings, saveSettings } from '../src/server/db.ts';
import path from 'node:path';

const args = process.argv.slice(2);
const command = args[0] || 'help';

function printBanner() {
  console.log(`
\x1b[38;2;56;189;248m   ____ _     ___ ____ _   _ _____     ____ ___  _   _ _____ ____   ___  _     
  |  _ \\ |   |_ _/ ___| | | |_   _|   / ___/ _ \\| \\ | |_   _|  _ \\ / _ \\| |    
  | |_) | |    | | |  _| |_| | | |    | |  | | | |  \\| | | | | |_) | | | | |    
  |  __/| |___ | | |_| |  _  | | |    | |__| |_| | |\\  | | | |  _ <| |_| | |___ 
  |_|   |_____|___\\____|_| |_| |_|     \\____\\___/|_| \\_| |_| |_| \\_\\\\___/|_____|\x1b[0m
  \x1b[90mAtoosa Flight Control Engine • CLI-First Architecture • v0.1.0\x1b[0m
`);
}

async function run() {
  switch (command) {
    case 'scan': {
      const targetDir = path.resolve(args[1] || process.cwd());
      console.log(`\n\x1b[36m🛫 [AFC Engine] Soft-reading runway:\x1b[0m ${targetDir}\n`);
      const telemetry = await softReadProject(targetDir);

      console.log(`\x1b[1m=== FLIGHT TELEMETRY REPORT ===\x1b[0m`);
      console.log(`Flight Health Index: \x1b[${telemetry.flightScore >= 75 ? '32m' : '33m'}${telemetry.flightScore}/100 (${telemetry.flightHealthStatus.toUpperCase()})\x1b[0m`);
      console.log(`Scanned Codebase:    ${telemetry.totalFiles} files (${telemetry.totalLines.toLocaleString()} total lines)`);
      console.log(`Git Environment:     ${telemetry.hasGit ? `Branch: ${telemetry.gitBranch || 'active'}` : 'Not a git repo'}`);
      console.log(`TDD Test Gate:       ${telemetry.testSetup.detected ? `PASS (${telemetry.testSetup.testFilesCount} test suites)` : '\x1b[33mFAIL (No tests found)\x1b[0m'}`);
      console.log(`Frameworks Detected: ${telemetry.detectedFrameworks.join(', ') || 'None'}`);

      console.log(`\n\x1b[1m=== 500-LINE CODE CEILING RADAR ===\x1b[0m`);
      if (telemetry.filesOver500Lines.length === 0) {
        console.log(`\x1b[32m✔ All files strictly adhere to the 500-line modular ceiling.\x1b[0m`);
      } else {
        console.log(`\x1b[33m⚠ ${telemetry.filesOver500Lines.length} file(s) exceed 500 lines (Refactoring required):\x1b[0m`);
        for (const file of telemetry.filesOver500Lines) {
          console.log(`  - \x1b[31m${file.relativePath}\x1b[0m: \x1b[1m${file.lineCount} lines\x1b[0m (${(file.byteSize / 1024).toFixed(1)} KB) [${file.warningLevel.toUpperCase()}]`);
        }
      }

      console.log(`\n\x1b[1m=== GOVERNANCE CHECKLIST ===\x1b[0m`);
      console.log(`AGENT.md:        ${telemetry.governanceFiles.hasAgentMd ? '\x1b[32mInstalled\x1b[0m' : '\x1b[33mMissing\x1b[0m'}`);
      console.log(`ARCHITECTURE.md: ${telemetry.governanceFiles.hasArchitectureMd ? '\x1b[32mInstalled\x1b[0m' : '\x1b[33mMissing\x1b[0m'}`);
      console.log(`FLIGHT_RULES.md: ${telemetry.governanceFiles.hasFlightRules ? '\x1b[32mInstalled\x1b[0m' : '\x1b[33mMissing\x1b[0m'}`);

      // Auto-save to registry
      const name = path.basename(targetDir);
      await upsertProject({
        id: `flight_${Buffer.from(targetDir).toString('hex').slice(0, 10)}`,
        name,
        path: targetDir,
        status: telemetry.flightScore >= 75 ? 'cleared-for-takeoff' : 'in-flight',
        createdAt: new Date().toISOString(),
        lastScannedAt: telemetry.scannedAt,
        telemetry,
      });
      break;
    }

    case 'radar': {
      const targetDir = path.resolve(args[1] || process.cwd());
      const telemetry = await softReadProject(targetDir);
      console.log(`\n\x1b[35m📡 [AFC Radar] 500-Line Gate Inspection: ${path.basename(targetDir)}\x1b[0m`);
      if (telemetry.filesOver500Lines.length === 0) {
        console.log(`\x1b[32m✔ RADAR CLEAR: No files over 500 lines.\x1b[0m`);
      } else {
        console.table(
          telemetry.filesOver500Lines.map((f) => ({
            File: f.relativePath,
            Lines: f.lineCount,
            Size: `${(f.byteSize / 1024).toFixed(1)} KB`,
            Severity: f.warningLevel,
          }))
        );
      }
      break;
    }

    case 'connect': {
      console.log(`\n\x1b[36m🔍 Probing local terminal environment for AI engines...\x1b[0m\n`);
      const clis = await detectSystemCLIs();
      for (const cli of clis) {
        if (cli.available) {
          console.log(`  \x1b[32m✔ ${cli.name}\x1b[0m: Found (${cli.version}) at \x1b[90m${cli.path}\x1b[0m`);
        } else {
          console.log(`  \x1b[90m✖ ${cli.name}: Not detected\x1b[0m`);
        }
      }

      const claude = clis.find((c) => c.id === 'claude-cli' && c.available);
      if (claude) {
        await saveSettings({
          onboardingCompleted: true,
          selectedCli: 'claude-cli',
          activeProvider: 'claude-cli',
          claudeCliPath: claude.path,
        });
        console.log(`\n\x1b[32m✔ Successfully linked Flight Control to local Claude Code CLI (${claude.version})!\x1b[0m`);
      }
      break;
    }

    case 'emit': {
      const targetDir = path.resolve(args[1] || process.cwd());
      const projectName = path.basename(targetDir);
      console.log(`\n\x1b[36m📜 Emitting clean governance rulebooks to: ${targetDir}\x1b[0m`);

      const rec = analyzePreFlight({
        projectName,
        targetFolder: targetDir,
        projectMission: `Target project ${projectName}`,
        targetAudience: 'Software Engineering Team',
        scaleAndTraffic: 'production-standard',
        containerPreference: 'undecided',
        preferredLanguages: ['TypeScript'],
        securityTier: 'strict',
        testingStrategy: 'tdd-strict',
        maxLinesPerFile: 500,
      });

      const res = await emitGovernanceFiles({
        targetFolder: targetDir,
        files: [
          { filename: 'AGENT.md', content: rec.generatedFiles.agentMd },
          { filename: 'ARCHITECTURE.md', content: rec.generatedFiles.architectureMd },
          { filename: 'FLIGHT_RULES.md', content: rec.generatedFiles.flightRulesMd },
        ],
        overwriteExisting: true,
      });

      console.log(`\x1b[32m✔ Emitted:\x1b[0m ${res.writtenFiles.join(', ')}`);
      console.log(`\x1b[90m(Zero foreign dependencies or node_modules written to target directory)\x1b[0m`);
      break;
    }

    case 'tasks': {
      const sub = args[1] || 'list';
      if (sub === 'list') {
        const tasks = await getTasks();
        console.log(`\n\x1b[1m=== FLIGHT RUNWAY TASKS (${tasks.length}) ===\x1b[0m`);
        if (tasks.length === 0) {
          console.log(`No active flight tasks. Add one with: afc tasks add "Task title"`);
        } else {
          console.table(
            tasks.map((t) => ({
              ID: t.id,
              Title: t.title,
              Status: t.status,
              Priority: t.priority,
              Assigned: t.assignedTo,
            }))
          );
        }
      } else if (sub === 'add') {
        const title = args.slice(2).join(' ');
        if (!title) {
          console.log(`Usage: afc tasks add "Task title"`);
          return;
        }
        const created = await addTask({
          projectId: 'global',
          title,
          description: 'Created via CLI',
          status: 'backlog',
          priority: 'medium',
          assignedTo: 'ai-agent',
        });
        console.log(`\x1b[32m✔ Created task [${created.id}]: "${created.title}"\x1b[0m`);
      }
      break;
    }

    case 'serve': {
      const port = Number(args[1]) || 3001;
      process.env.PORT = String(port);
      console.log(`\n🛫 Starting Flight Control Tower Web UI Translator on port ${port}...`);
      await import('../src/server/index.ts');
      break;
    }

    case 'help':
    default: {
      printBanner();
      console.log(`Commands:
  \x1b[36mafc scan [path]\x1b[0m         Soft-read codebase metrics, 500-line gate, and TDD health
  \x1b[36mafc radar [path]\x1b[0m        Inspect files exceeding 500-line modular limit
  \x1b[36mafc connect\x1b[0m             Detect and connect to local Claude Code or Ollama
  \x1b[36mafc emit [path]\x1b[0m         Safely scaffold AGENT.md, ARCHITECTURE.md into project
  \x1b[36mafc tasks [list|add]\x1b[0m    Manage modular flight tasks from CLI
  \x1b[36mafc serve [port]\x1b[0m        Launch local web dashboard translator (default: 3001)
  \x1b[36mafc help\x1b[0m                Show this help screen
`);
      break;
    }
  }
}

run().catch((err) => {
  console.error(`\x1b[31m[AFC Error]:\x1b[0m`, err.message);
  process.exit(1);
});
