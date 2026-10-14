import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileMetric, TelemetrySummary } from '../../../shared/types.ts';
import { toPosixPath, isTowerAppDir } from '../../engine/os/platform.ts';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'target',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  '.idea',
  '.vscode',
  'coverage',
  '.turbo',
  '.cache',
  'tmp',
]);

const CODE_EXTENSIONS: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript (React)',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
};

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.exe', '.dll', '.so', '.dylib',
  '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.db', '.sqlite',
]);

export async function softReadProject(targetPath: string): Promise<TelemetrySummary> {
  const normalizedPath = path.resolve(targetPath);
  
  // Anti-dogfooding guard: The Control Tower governs target codebases, not itself.
  if (isTowerAppDir(normalizedPath)) {
    throw new Error(
      `Cannot scan or monitor the Control Tower itself. Atoosa Flight Control is an external observer for target projects. Please specify an external project directory.`
    );
  }

  // Verify target path exists
  try {
    const stat = await fs.stat(normalizedPath);
    if (!stat.isDirectory()) {
      throw new Error(`Target path "${normalizedPath}" is not a directory.`);
    }
  } catch (err: any) {
    throw new Error(`Cannot access project path "${normalizedPath}": ${err.message}`);
  }

  const allMetrics: FileMetric[] = [];
  const languageStats: Record<string, { files: number; lines: number }> = {};
  let totalFiles = 0;
  let totalLines = 0;
  let testFilesCount = 0;

  async function crawl(dir: string) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.startsWith('.') && entry !== '.cursorrules' && entry !== '.env.example') {
        if (entry === '.git') continue;
        if (IGNORED_DIRS.has(entry)) continue;
      }
      if (IGNORED_DIRS.has(entry)) continue;

      const fullPath = path.join(dir, entry);
      let entryStat;
      try {
        const lstat = await fs.lstat(fullPath);
        if (lstat.isSymbolicLink()) continue; // Skip symlinks to prevent cyclic traversal
        entryStat = await fs.stat(fullPath);
      } catch {
        continue;
      }

      if (entryStat.isDirectory()) {
        await crawl(fullPath);
      } else if (entryStat.isFile()) {
        const ext = path.extname(entry).toLowerCase();
        if (BINARY_EXTENSIONS.has(ext)) continue;

        totalFiles++;
        const relativePath = toPosixPath(path.relative(normalizedPath, fullPath));

        // Check if test file
        const lowerRel = relativePath.toLowerCase();
        const isTest = lowerRel.includes('.test.') ||
          lowerRel.includes('.spec.') ||
          lowerRel.includes('test_') ||
          lowerRel.endsWith('_test.go') ||
          lowerRel.includes('/tests/') ||
          lowerRel.includes('/__tests__/');

        if (isTest) {
          testFilesCount++;
        }

        let lineCount = 0;
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (content.length === 0) {
            lineCount = 0;
          } else {
            // Strip single trailing newline terminator if present to match standard code editors & wc -l
            const normalized = content.replace(/\r\n$/, '').replace(/\n$/, '');
            lineCount = normalized.split(/\r\n|\r|\n/).length;
          }
        } catch {
          // If reading failed (e.g. binary/unreadable), default to 0
          lineCount = 0;
        }

        totalLines += lineCount;

        const lang = CODE_EXTENSIONS[ext] || (ext ? ext.toUpperCase() : 'Other');
        if (!languageStats[lang]) {
          languageStats[lang] = { files: 0, lines: 0 };
        }
        languageStats[lang].files += 1;
        languageStats[lang].lines += lineCount;

        // Warning rules: max 500 lines
        let warningLevel: 'ok' | 'caution' | 'critical' = 'ok';
        if (lineCount > 800) {
          warningLevel = 'critical';
        } else if (lineCount > 500) {
          warningLevel = 'caution';
        }

        allMetrics.push({
          path: fullPath,
          relativePath,
          lineCount,
          byteSize: entryStat.size,
          extension: ext,
          warningLevel,
        });
      }
    }
  }

  await crawl(normalizedPath);

  // Filter files over 500 lines sorted descending
  const filesOver500Lines = allMetrics
    .filter((m) => m.lineCount > 500)
    .sort((a, b) => b.lineCount - a.lineCount);

  // Compute language percentages
  const languageBreakdown: Record<string, { files: number; lines: number; percentage: number }> = {};
  for (const [lang, stats] of Object.entries(languageStats)) {
    languageBreakdown[lang] = {
      files: stats.files,
      lines: stats.lines,
      percentage: totalLines > 0 ? Math.round((stats.lines / totalLines) * 100) : 0,
    };
  }

  // Detect frameworks
  const detectedFrameworks = await detectFrameworks(normalizedPath);

  // Check Git
  const gitInfo = await checkGit(normalizedPath);

  // Check Docker
  const dockerSetup = await checkDocker(normalizedPath);

  // Check Governance files
  const governanceFiles = await checkGovernance(normalizedPath);

  // Test setup info
  const testSetup = {
    detected: testFilesCount > 0,
    testFilesCount,
    framework: detectedFrameworks.find((f) => ['Vitest', 'Jest', 'Pytest', 'Playwright', 'Mocha'].includes(f)),
  };

  // Compute Flight Score (0-100) & warnings
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (filesOver500Lines.length > 0) {
    const penalty = Math.min(30, filesOver500Lines.length * 6);
    score -= penalty;
    warnings.push(`Flight Risk: ${filesOver500Lines.length} code file(s) exceed the 500-line modular limit.`);
    recommendations.push('Refactor large files into focused sub-modules to keep AI context precise and prevent token bloat.');
  }

  if (!testSetup.detected) {
    score -= 20;
    warnings.push('Pre-flight Warning: No test suite or test files detected (TDD gate unfulfilled).');
    recommendations.push('Establish a test framework to enforce Test-Driven Development (TDD).');
  }

  if (!governanceFiles.hasAgentMd && !governanceFiles.hasClaudeMd) {
    score -= 15;
    warnings.push('Governance Missing: No AGENT.md or CLAUDE.md instruction file found.');
    recommendations.push('Install a Flight Control AGENT.md to lock in project rules, 500-line ceilings, and safety boundaries for AI assistants.');
  }

  if (!gitInfo.hasGit) {
    score -= 15;
    warnings.push('Telemetry Warning: Not a Git repository.');
    recommendations.push('Initialize git (git init) to enable safe rollback checkpoints.');
  }

  if (totalFiles === 0) {
    score = 50;
    warnings.push('Runway Empty: Target directory is brand new or contains no readable code files.');
    recommendations.push('Run the Pre-Flight Discovery Wizard to establish architecture and scaffold initial governance.');
  }

  score = Math.max(10, Math.min(100, score));

  let flightHealthStatus: 'optimal' | 'moderate' | 'hazard' = 'optimal';
  if (score < 50) flightHealthStatus = 'hazard';
  else if (score < 75) flightHealthStatus = 'moderate';

  return {
    scannedAt: new Date().toISOString(),
    targetPath: normalizedPath,
    totalFiles,
    totalLines,
    filesOver500Lines,
    languageBreakdown,
    detectedFrameworks,
    hasGit: gitInfo.hasGit,
    gitBranch: gitInfo.branch,
    gitClean: gitInfo.clean,
    testSetup,
    dockerSetup,
    governanceFiles,
    flightScore: score,
    flightHealthStatus,
    warnings,
    recommendations,
  };
}

async function detectFrameworks(targetDir: string): Promise<string[]> {
  const frameworks: Set<string> = new Set();

  // Check Node package.json
  try {
    const pkgPath = path.join(targetDir, 'package.json');
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

    if (allDeps['react']) frameworks.add('React');
    if (allDeps['next']) frameworks.add('Next.js');
    if (allDeps['vue']) frameworks.add('Vue');
    if (allDeps['vite']) frameworks.add('Vite');
    if (allDeps['hono']) frameworks.add('Hono');
    if (allDeps['express']) frameworks.add('Express');
    if (allDeps['tailwindcss']) frameworks.add('Tailwind CSS');
    if (allDeps['vitest']) frameworks.add('Vitest');
    if (allDeps['jest']) frameworks.add('Jest');
    if (allDeps['playwright'] || allDeps['@playwright/test']) frameworks.add('Playwright');
    if (allDeps['typescript']) frameworks.add('TypeScript');
  } catch {}

  // Check Python
  try {
    const pyproject = path.join(targetDir, 'pyproject.toml');
    const reqs = path.join(targetDir, 'requirements.txt');
    const hasPyproject = await fs.stat(pyproject).then(() => true).catch(() => false);
    const hasReqs = await fs.stat(reqs).then(() => true).catch(() => false);
    if (hasPyproject || hasReqs) {
      frameworks.add('Python');
      let content = '';
      if (hasPyproject) content += await fs.readFile(pyproject, 'utf-8');
      if (hasReqs) content += await fs.readFile(reqs, 'utf-8');
      if (content.includes('fastapi')) frameworks.add('FastAPI');
      if (content.includes('django')) frameworks.add('Django');
      if (content.includes('flask')) frameworks.add('Flask');
      if (content.includes('pytest')) frameworks.add('Pytest');
    }
  } catch {}

  // Check Go
  try {
    const gomod = path.join(targetDir, 'go.mod');
    const hasGo = await fs.stat(gomod).then(() => true).catch(() => false);
    if (hasGo) frameworks.add('Go');
  } catch {}

  // Check Rust
  try {
    const cargo = path.join(targetDir, 'Cargo.toml');
    const hasCargo = await fs.stat(cargo).then(() => true).catch(() => false);
    if (hasCargo) frameworks.add('Rust');
  } catch {}

  return Array.from(frameworks);
}

async function checkGit(targetDir: string): Promise<{ hasGit: boolean; branch?: string; clean?: boolean }> {
  try {
    const gitDir = path.join(targetDir, '.git');
    const stat = await fs.stat(gitDir);
    if (!stat.isDirectory()) return { hasGit: false };

    // Read current branch from .git/HEAD
    const headContent = await fs.readFile(path.join(gitDir, 'HEAD'), 'utf-8');
    let branch = 'unknown';
    if (headContent.startsWith('ref: refs/heads/')) {
      branch = headContent.replace('ref: refs/heads/', '').trim();
    }

    return { hasGit: true, branch, clean: true };
  } catch {
    return { hasGit: false };
  }
}

async function checkDocker(targetDir: string): Promise<{ detected: boolean; hasDockerfile: boolean; hasCompose: boolean }> {
  let hasDockerfile = false;
  let hasCompose = false;

  try {
    await fs.stat(path.join(targetDir, 'Dockerfile'));
    hasDockerfile = true;
  } catch {}

  try {
    const compose1 = await fs.stat(path.join(targetDir, 'docker-compose.yml')).then(() => true).catch(() => false);
    const compose2 = await fs.stat(path.join(targetDir, 'compose.yaml')).then(() => true).catch(() => false);
    hasCompose = compose1 || compose2;
  } catch {}

  return {
    detected: hasDockerfile || hasCompose,
    hasDockerfile,
    hasCompose,
  };
}

async function checkGovernance(targetDir: string) {
  const check = async (filename: string) => {
    try {
      await fs.stat(path.join(targetDir, filename));
      return true;
    } catch {
      return false;
    }
  };

  return {
    hasAgentMd: await check('AGENT.md'),
    hasClaudeMd: await check('CLAUDE.md'),
    hasCursorRules: await check('.cursorrules'),
    hasArchitectureMd: await check('ARCHITECTURE.md'),
    hasFlightRules: await check('FLIGHT_RULES.md'),
  };
}
