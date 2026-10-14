# 🛫 Atoosa Flight Control Tower

> **Autonomous Air Traffic Control Tower for Software Engineering & AI-Assisted Development**

Atoosa Flight Control runs as an isolated, standalone local application on macOS, Windows, and Linux. Just like an air traffic control tower monitors aircraft without riding inside the plane's engine, **Flight Control governs software development completely decoupled from target repositories**, guaranteeing zero target repository pollution.

---

## 🚀 Key Features (Modular MVP)

### 1. Dual Flight Paths
* **Path A: New Flight (Pre-Flight Discovery Wizard)**
  * 360° deep requirements interview capturing mission, scale, and domain constraints.
  * Architecture Decision Engine: automated Docker vs. bare-metal evaluation with pros & cons.
  * Real-time streaming AI prompt booster via local CLI or built-in reasoning engine.
  * Clean scaffolding: prompts for a local folder and deploys lean markdown governance files (`AGENT.md`, `ARCHITECTURE.md`, `FLIGHT_RULES.md`).
* **Path B: In-Flight Telemetry (Existing Project Soft Read)**
  * Non-destructive code crawler: scans any local path on your machine.
  * Computes code metrics, language distributions, git status, and framework detection.
  * **Only modifies or copies files into the project upon your explicit approval.**

### 2. The 500-Line Modular Code Gate
* **Strict Warning Radar**: Flags any source code file exceeding 500 lines as a structural hazard.
* Prevents monolithic file sprawl and preserves LLM context window precision for autonomous coding agents.

### 3. TDD & Security Protocol
* Enforces Test-Driven Development (TDD) gates and verifies test suite presence (Vitest, Jest, Pytest, Go test, Cargo test).
* Bakes in runtime validation, least-privilege permissions, and secret isolation guidelines.

### 4. Pluggable Extension Slot Architecture
* **Modular Engine**: Expandable post-MVP without refactoring core systems.
* **Included Modular Slot: Project Manager Tower**:
  * Agile Kanban runway (Backlog, In-Flight, Review, Landed).
  * Task assignment to human developers or AI agents (Claude, Copilot).
* **Prepared Extension Slots**:
  * Security Sentinel (Secret leak & CVE auditing)
  * CS Mathematical & Logic Verification (Formal invariants & state machines)
  * AST Context Graph Map (Symbol dependency mapping to shrink AI context)

### 5. Multi-Engine AI Connectivity
* **Local CLI & Subscriptions**: Native streaming bridge for `claude` (Claude Code CLI) and `ollama` via high-performance `Bun.spawn` with process leak protection.
* **Cloud BYOK**: Optional API keys for Google Gemini, OpenAI, and Anthropic.
* **Built-in Flight Engine**: Instant, zero-latency local fallback.

---

## 🛠️ Tech Stack

* **Runtime & Package Manager**: [Bun 1.3+](https://bun.sh)
* **Backend API**: [Hono](https://hono.dev) (`^4.13.13`) + `@hono/bun`
* **Frontend**: React 19 (`^19.3.1`) + Vite 8
* **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + Lucide React
* **Test Runner**: Native Bun Test (`bun test`)

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure [Bun](https://bun.sh) is installed on your computer:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies
```bash
cd "Atoosa Flight Control"
bun install
```

### 3. Run the Unified Application
To run the production-optimized Flight Control app on port 3001:
```bash
bun start
```
Open your browser at: **`http://localhost:3001`**

### 4. Development Mode (Hot Reload)
To run both backend and Vite dev servers with instant HMR:
```bash
bun run dev:all
```
Open your browser at: **`http://localhost:5173`** (proxied to API on 3001).

### 5. Run Test Suite
```bash
bun test
```
Runs unit tests across the scanner, discovery engine, governance emitter, and project manager in under 30ms.

---

## 📁 Repository Structure

```
Atoosa Flight Control/
├── src/
│   ├── shared/
│   │   └── types.ts                 # Shared TypeScript models
│   ├── server/
│   │   ├── index.ts                 # Hono server & SPA fallback
│   │   ├── db.ts                    # Local JSON data store
│   │   ├── routes/                  # API routes (projects, scanner, discovery, governance, ai, modules)
│   │   └── modules/
│   │       ├── scanner/             # Soft-read engine & 500-line radar
│   │       ├── discovery/           # Pre-flight interview & prompt hardener
│   │       ├── governance/          # Safe zero-pollution rulebook emitter
│   │       ├── ai-bridge/           # Bun.spawn streaming bridge for Claude & Ollama
│   │       ├── project-manager/     # Pluggable task & sprint manager
│   │       └── registry.ts          # Extensible module registry
│   └── client/
│       ├── main.tsx                 # React 19 entrypoint
│       ├── App.tsx                  # Root control tower app
│       ├── index.css                # Tailwind v4 theme
│       ├── components/
│       │   ├── Navigation.tsx       # Flight status & navigation
│       │   ├── FlightDeck.tsx       # Command center & project registry
│       │   ├── PreFlightWizard.tsx  # 4-Step discovery & scaffolding wizard
│       │   ├── TelemetryRadar.tsx   # 500-Line code radar & metrics
│       │   ├── GovernanceSuite.tsx  # AGENT.md & ARCHITECTURE.md manager
│       │   ├── ProjectManagerSlot.tsx # Modular Kanban & task tracker
│       │   ├── ModulesTower.tsx     # Pluggable extension viewer
│       │   └── SettingsModal.tsx    # AI Engine configuration
│       └── lib/
│           └── api.ts               # Typed client
├── tests/                           # Fast Bun unit tests
└── data/                            # Local tower database (projects, settings, tasks)
```

---

## 🔒 Zero-Pollution Target Guarantee

When you attach an existing project or scaffold a new one:
1. Flight Control **NEVER** copies its own runtime, `node_modules`, or database into your target directory.
2. Only standard, clean markdown rulebooks (`AGENT.md`, `ARCHITECTURE.md`, `FLIGHT_RULES.md`) are written to the target folder **only upon your explicit click**.
3. Target `.gitignore` remains completely unaffected.
