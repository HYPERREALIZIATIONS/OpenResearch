# OpenResearch: Implementation Plan

## Goal
Build a terminal-based, non-delusional critical-thinking partner for entrepreneurs/creators. Brutally honest assumption-challenger that runs a 5-phase research pipeline and delivers gated verdicts.

## Locked Decisions
- **Runtime**: Node.js 18+, TypeScript
- **TUI**: Ink (React for terminal) + `ink-markdown` + `blessed` only if canvas needs low-level grid (prefer Ink)
- **Database**: `better-sqlite3` single file at `~/.openresearch/data.db`
- **LLM**: Custom provider-agnostic adapter (no Vercel AI SDK dependency)
- **Search**: Tavily primary (REST), SerpAPI fallback; Reddit via JSON endpoints; X via public endpoint scraping
- **Config**: `~/.openresearch/config.json` + per-project overrides in TUI
- **Canvas**: Separate `canvas_artifacts` table with `x, y` grid coords (supports persistence across sessions)
- **Phasing**: Strictly gated serial. Each phase writes a typed artifact to SQLite before advancing.
- **Failure**: Configurable max retry per phase (default 3), then user override. UI surfaces risk explicitly.

## Architecture & File Tree
```
/openresearch
  /src
    /agents
      critic.ts
      researcher.ts
      validator.ts
      planner.ts
    /llm
      client.ts
      providers/
        openai.ts
        anthropic.ts
        openrouter.ts
        lmstudio.ts
        ollama.ts
    /tui
      App.tsx
      components/
        SplitPane.tsx
        ChatLog.tsx
        Canvas.tsx
        Input.tsx
        StatusBar.tsx
        Modal.tsx
      hooks/
        useProjects.ts
        useAI.ts
        useSearch.ts
    /db
      schema.ts
      queries.ts
    /config
      config.ts
    /search
      web.ts
      reddit.ts
      x.ts
    index.tsx
  package.json
  tsconfig.json
  .env.example
```

## Database Schema
- `projects`: id, name, description, phase, verdict, verdict_reasoning, created_at, updated_at
- `conversations`: id, project_id, role, content, timestamp
- `research_findings`: id, project_id, source, source_url, content, relevance_score, created_at
- `action_plans`: id, project_id, phase, description, tasks (JSON), created_at, updated_at
- `canvas_artifacts`: id, project_id, type, content (JSON), position_x, position_y, created_at

## Pipeline: 5 Gated Phases
1. **Discovery** — Critic agent probes user to define target customer, problem, existing solutions, evidence of demand, competition, market size. Output: `research_brief` (typed artifact).
2. **Research** — Researcher orchestrates Tavily/SerpAPI, Reddit JSON, X scraping. Output: `research_findings` rows in DB.
3. **Analysis** — Researcher (same agent) cross-synthesizes findings into structured report. Output: `research_report` artifact.
4. **Verdict** — Critic runs harsh final assessment; Validator evaluates evidence weight. Output: `verdict` + `verdict_reasoning` on project row.
5. **Planning** — Planner generates step-by-step action plan. Output: `action_plan` artifact + tasks JSON.

**Handoff**: Each phase must explicitly emit an artifact and transition project `phase` before the next agent runs. TUI enables the "next phase" action only after artifact presence.

## Agent Contracts
- All agents receive: `projectId`, `conversationHistory[]`, and prior-phase artifacts.
- All agents return: `{ artifact: any, nextPhase?: string, haltReason?: string }`.
- Critic is invoked twice: start of Discovery and start of Verdict.

## TUI Spec
- Layout: Left chat log + input, right canvas. Resize via keyboard.
- Key bindings:
  - `Ctrl+N`: new project
  - `Ctrl+O`: open project
  - `Ctrl+S`: save
  - `Tab`: switch focus between panels
  - `Enter`: submit input
  - `/`: search canvas
  - `Esc`: close modal
  - Arrow keys: navigate canvas

## Configuration
- `~/.openresearch/config.json`
  - `llm.provider`: "openai" | "anthropic" | "openrouter" | "lmstudio" | "ollama"
  - `llm.apiKey`, `llm.model`, `llm.baseUrl` (optional for OpenRouter/LM Studio/Ollama)
  - `search.tavilyApiKey`, `search.serpApiKey`
  - `reddit.clientId`, `reddit.clientSecret`, `reddit.userAgent`
  - `x.bearerToken` (or scrape mode flag)

## Execution Order
1. Scaffold project structure and `package.json` with deps.
2. Implement DB schema + queries.
3. Implement config loader.
4. Implement LLM client + providers (OpenAI first, then Anthropic, OpenRouter, LM Studio, Ollama).
5. Implement search adapters (Tavily, SerpAPI, Reddit, X).
6. Implement agents (Critic, Researcher, Validator, Planner).
7. Implement TUI (SplitPane, ChatLog, Canvas, Input, StatusBar, Modal) + hooks.
8. Wire pipeline orchestration + phase gating.
9. Add key bindings and canvas interactivity.
10. Validate with sample project end-to-end.

## Risks
- Reddit/X scraping fragility — prefer official APIs where possible; surface auth errors in TUI.
- Terminal markdown rendering limits — `ink-markdown` handles basic tables; complex citations may need truncation.
- SQLite concurrency — single-file with `better-sqlite3` is process-safe; no server.
