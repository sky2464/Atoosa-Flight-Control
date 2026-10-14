# 🛫 Atoosa Flight Control

> **Tower to codebase: You are cleared for takeoff.** 🛩️✨  
> An autonomous Air Traffic Control tower for modern software engineering and AI coding agents.

[![Bun](https://img.shields.io/badge/Runtime-Bun_1.3+-FBF0DF?logo=bun&logoColor=black)](https://bun.sh)
[![React 19](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Hono](https://img.shields.io/badge/Backend-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev)
[![Zero Pollution](https://img.shields.io/badge/Repo_Pollution-0%25-brightgreen)](#-why-flight-control)
[![Tests](https://img.shields.io/badge/Tests-7%20passing-success)](tests/)

---

### 📡 Why Flight Control?

Air traffic controllers don't ride inside the jet engines to keep the skies safe. **Neither should your dev tooling.**

**Atoosa Flight Control (AFC)** sits in its own tower, monitoring and governing your software projects from 30,000 feet. It gives you deep architecture discovery, non-destructive telemetry, and AI agent coordination—**without injecting a single node module or runtime dependency into your target repo.**

---

## ⚡ Cockpit Instruments

| Instrument | Flight Role | Why You'll Love It |
| :--- | :--- | :--- |
| 🧭 **Dual Flight Paths** | **Pre-Flight Wizard** (new projects) & **Soft-Read Telemetry** (existing ones) | Zero-guesswork scaffolding + instant repo health metrics |
| 🚨 **500-Line Code Radar** | Active warning system for source files exceeding 500 lines | Kills monolithic bloat & keeps LLM context windows laser-sharp |
| 🛡️ **Zero-Pollution Shield** | Emits clean markdown rulebooks (`AGENT.md`, `ARCHITECTURE.md`) | Keeps your target codebases 100% untouched and pristine |
| 🤖 **Multi-Engine AI Bridge** | Native streaming for Claude Code CLI, Ollama, & Cloud BYOK | Direct pipe to your favorite AI co-pilots with zero lag |
| 🛫 **Runway Kanban** | Built-in task board with AI/human delegation slots | Track what's queued, in-flight, and safely landed |

---

## 🚀 30-Second Takeoff

Got [Bun](https://bun.sh)? You're wheels-up in two commands:

```bash
# 1. Fuel up
bun install

# 2. Launch the Control Tower (http://localhost:3001)
bun start
```

> **🧑‍💻 Flight Mechanic Mode:** Run `bun run dev:all` for hot-reloading Vite (`localhost:5173`) + Hono API (`localhost:3001`).

---

## 🕹️ Pilot CLI (`afc`)

Prefer flying from the terminal? Link the CLI or run it directly:

```bash
# (Optional) Link globally: bun link
afc scan .          # Soft-read metrics, TDD gates, & flight health score
afc radar .         # Ping files breaching the 500-line modular ceiling
afc connect         # Auto-detect local Claude Code CLI or Ollama
afc emit .          # Drop pristine AGENT.md & ARCHITECTURE.md rulebooks
afc tasks list      # Review active runway tasks
```

---

## 🧪 Flight Diagnostics

```bash
bun test            # 7 tests passed across all flight engines in ~30ms ⚡
```

---

<p align="center">
  <sub>Built with ❤️, Bun, and clear air corridors. Safe flying! ✈️</sub>
</p>
