import type { PreFlightInterview, PreFlightRecommendation } from '../../../shared/types.ts';

export function analyzePreFlight(interview: PreFlightInterview): PreFlightRecommendation {
  const {
    projectName,
    projectMission,
    targetAudience,
    scaleAndTraffic,
    containerPreference,
    preferredLanguages = [],
    securityTier,
    testingStrategy,
    maxLinesPerFile = 500,
  } = interview;

  // 1. Stack Synthesis
  let recommendedFrontend = 'React 19 + Vite + Tailwind CSS';
  let recommendedBackend = 'Bun + Hono / TypeScript';
  let recommendedDatabase = 'PostgreSQL + Drizzle ORM (or SQLite / LibSQL for local)';
  let architecturePattern = 'Modular Hexagonal / Clean Architecture (Domain-Driven)';

  if (preferredLanguages.includes('Python')) {
    recommendedBackend = 'FastAPI + Pydantic v2 + Uvicorn';
    recommendedDatabase = 'PostgreSQL + SQLAlchemy 2.0 / Alembic';
  } else if (preferredLanguages.includes('Go')) {
    recommendedBackend = 'Go (Gin or Chi) + Standard Library';
    recommendedDatabase = 'PostgreSQL + pgx';
  } else if (preferredLanguages.includes('Rust')) {
    recommendedBackend = 'Rust (Axum + Tokio)';
    recommendedDatabase = 'PostgreSQL + SQLx';
  }

  // 2. Docker Evaluation Matrix
  let dockerRec: 'recommended' | 'optional' | 'avoid-for-mvp' = 'optional';
  let dockerReasoning = '';
  const dockerPros: string[] = [
    'Hermetic environment parity between dev and production',
    'Zero "works on my machine" version clashes for databases/tools',
    'Isolated security sandbox preventing local host system contamination',
  ];
  const dockerCons: string[] = [
    'Cold start and memory overhead on local laptops',
    'Increased complexity in debugging and file watcher / HMR synchronization',
    'Slower initial MVP development velocity compared to bare-metal Bun/Node',
  ];

  if (containerPreference === 'docker' || containerPreference === 'docker-compose') {
    dockerRec = 'recommended';
    dockerReasoning = 'You selected Docker; recommended to configure multi-stage Dockerfiles with separate dev (with hot-reload) and prod targets.';
  } else if (scaleAndTraffic === 'high-throughput-enterprise' || securityTier === 'regulated') {
    dockerRec = 'recommended';
    dockerReasoning = 'Enterprise scale and strict compliance require reproducible, containerized deployments with hardened base images.';
  } else if (scaleAndTraffic === 'prototype' || scaleAndTraffic === 'internal-tool') {
    dockerRec = 'avoid-for-mvp';
    dockerReasoning = 'For high velocity prototyping, bare-metal local runtime (Bun/Vite) provides instant hot-reload without container daemon overhead. Containerize post-MVP.';
  } else {
    dockerRec = 'optional';
    dockerReasoning = 'Optional for early stages: use local bare-metal execution during rapid feature iteration, and adopt Docker Compose when introducing multi-service dependencies.';
  }

  // 3. Baked-in Security Controls
  const securityControls: string[] = [
    'Strict Input Validation: All incoming payloads must be parsed via runtime schemas (Zod or Pydantic).',
    'Principle of Least Privilege: Non-root execution, isolated file access boundaries.',
    'Zero Hardcoded Secrets: All credentials strictly in environment variables (.env), validated on boot.',
    'Security Headers & Sanitization: Content-Security-Policy (CSP), CORS restriction, and XSS sanitization.',
  ];

  if (securityTier === 'strict' || securityTier === 'regulated') {
    securityControls.push(
      'Audit Logging: Immutable event stream for sensitive mutations and data access.',
      'Encryption at Rest and in Transit: Mandatory TLS and encrypted sensitive columns.',
      'Automated Vulnerability Gate: Fail build if dependencies have critical CVEs.'
    );
  }

  // 4. Governance & Flight Rules
  const governanceRules: string[] = [
    `Modular Code Limit Gate: No code file shall exceed ${maxLinesPerFile} lines. Any file crossing ${maxLinesPerFile} lines must be split into dedicated sub-modules.`,
    testingStrategy === 'tdd-strict'
      ? 'TDD Strict Mandate: Write failing tests before writing implementation code. No PR without test coverage.'
      : 'Automated Test Gate: Unit and integration tests must accompany all core business logic.',
    'AI Assistant Scope Restriction: AI coding agents must respect bounded context and read module interfaces rather than entire codebases.',
    'Zero Runtime Bleed: Flight Control instructions remain pure governance; no foreign runtime files inside source repo.',
  ];

  // 5. Generated Artifacts
  const agentMd = `# AGENT.md - Autonomous Developer & AI Flight Instructions
# Project: ${projectName}
# Mission: ${projectMission}

## Mandatory Flight Rules
1. **File Size Ceiling**: NEVER create or edit a file so that it exceeds **${maxLinesPerFile} lines of code**. If a file approaches this limit, refactor immediately into modular components.
2. **Architecture Pattern**: ${architecturePattern}
3. **Core Tech Stack**:
   - Frontend: ${recommendedFrontend}
   - Backend: ${recommendedBackend}
   - Database: ${recommendedDatabase}
4. **Testing Protocol**: ${testingStrategy === 'tdd-strict' ? 'TDD Strict Mandate (Write failing test first)' : testingStrategy}
   - Every new feature requires unit/integration tests.
   - Verify all tests pass before considering a task completed.
5. **Security Baseline**:
   - Never commit API keys or credentials.
   - Enforce runtime validation for all API inputs.

## Context Efficiency Rule
- Avoid feeding whole directories into context.
- Read specific sub-modules, types, and interfaces first.
`;

  const architectureMd = `# ARCHITECTURE.md - ${projectName} Blueprint

## 1. System Mission & Goals
${projectMission}

**Target Audience:** ${targetAudience}  
**Scale Target:** ${scaleAndTraffic}  
**Security Tier:** ${securityTier}

## 2. Recommended Technology Stack
- **Frontend**: ${recommendedFrontend}
- **Backend**: ${recommendedBackend}
- **Database / State**: ${recommendedDatabase}
- **Runtime**: Bun / Modern standards
- **Container Strategy**: ${dockerRec.toUpperCase()} (${dockerReasoning})

## 3. Structural Decomposition
\`\`\`
${projectName}/
├── src/
│   ├── modules/       # Isolated feature slices (domain logic, tests, types)
│   ├── shared/        # Cross-cutting utilities, types, and constants
│   └── main           # App entrypoint & bootstrap
├── tests/             # End-to-end and integration test suites
└── docs/              # Architectural decision records (ADRs)
\`\`\`

## 4. Quality & Flight Control Gates
- **Max File Lines**: ${maxLinesPerFile} lines strictly enforced by Flight Control Radar.
- **Dependency Health**: Zero unvetted dependencies.
`;

  const flightRulesMd = `# FLIGHT_RULES.md - Pre-Flight, In-Flight & Post-Flight Checklist

### 🛫 1. Pre-Flight Checklist
- [ ] Requirements fully documented in ARCHITECTURE.md
- [ ] Git repository initialized with clean main branch
- [ ] Environment variables defined in .env.example
- [ ] Test harness operational

### ✈️ 2. In-Flight Protocol
- [ ] Modular boundaries respected (no single file > ${maxLinesPerFile} lines)
- [ ] TDD flow executed (Test written -> Code written -> Test passes)
- [ ] Commits atomic and self-describing

### 🛬 3. Post-Flight Landing Checklist
- [ ] All test suites green
- [ ] Code formatting and linting verified
- [ ] Security checks passed (no exposed secrets)
- [ ] Ready for deployment or next sprint cycle
`;

  return {
    summary: `Pre-flight synthesis completed for "${projectName}". Architecture tuned for ${scaleAndTraffic} with ${securityTier} security controls.`,
    architecturePattern,
    recommendedStack: {
      frontend: recommendedFrontend,
      backend: recommendedBackend,
      database: recommendedDatabase,
      runtime: 'Bun / Node',
      containerization: dockerRec,
    },
    dockerEvaluation: {
      recommendation: dockerRec,
      reasoning: dockerReasoning,
      pros: dockerPros,
      cons: dockerCons,
    },
    securityControls,
    governanceRules,
    generatedFiles: {
      agentMd,
      architectureMd,
      flightRulesMd,
    },
  };
}
