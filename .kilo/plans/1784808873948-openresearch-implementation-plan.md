# OpenResearch Implementation Plan

## Goal
Build a brutally honest, terminal-based research companion that challenges entrepreneur assumptions, gathers real-world evidence, and delivers gated verdicts via a 5-phase agent pipeline.

## Tech Stack (Decided)
- **Runtime**: Node.js v18+ + TypeScript
- **TUI**: Ink (React for terminal)
- **Markdown**: ink-markdown
- **Database**: better-sqlite3 (single file at ~/.openresearch/data.db)
- **LLM**: Custom adapter using fetch/axios (OpenAI, Anthropic, OpenRouter, LM Studio, Ollama)
- **Search**: Direct Reddit JSON endpoints, X web scraping via public endpoints
- **Keys**: ~/.openresearch/config.json + per-project overrides

## Architecture
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

## Database Schema
- projects: id, name, description, phase, verdict, verdict_reasoning, created_at, updated_at
- conversations: id, project_id, role, content, timestamp
- research_findings: id, project_id, source, source_url, content, relevance_score, created_at
- action_plans: id, project_id, phase, description, tasks (JSON), created_at, updated_at
- canvas_artifacts: id, project_id, type, content (JSON), position_x, position_y, created_at

## User Journey (Terminal)
1. Launch app → create/open project
2. Left: conversation log + input. Right: grid-snapped canvas (research, plans, notes, verdict)
3. Describe idea → Critic agent probes for specificity
4. AI triggers autonomous research (web, Reddit, X) → findings stream to canvas
5. Validator gives clear verdict: "worth pursuing" or "waste of time" with evidence
6. If pursuing: Planner generates step-by-step action plan
7. Canvas is editable: add notes, mark tasks, persist across sessions
8. Full streaming responses; no fake positivity

## Implementation Phases

### Phase 1: Core Infrastructure
- Initialize Node.js project (package.json, tsconfig.json)
- Create SQLite schema and queries
- Build provider-agnostic LLM client with streaming
- Create config loader (~/.openresearch/config.json)
- Build basic CLI entry point (openresearch command)

### Phase 2: Agent Engine
- Implement Critic agent prompts and logic
- Implement Researcher agent (web search, Reddit scraping, X discovery)
- Implement Validator agent with evidence-based verdicts
- Implement Planner agent with phased action plans
- Wire agents together with phase gating (user cannot advance manually)

### Phase 3: TUI Shell
- Build Ink App.tsx root layout
- Create SplitPane (resizable, Tab-switchable)
- Implement ChatLog with streaming support
- Implement Input with history
- Build StatusBar (phase, provider, key hints)
- Create Modal component for settings/project selection

### Phase 4: Research & Persistence
- Implement web search wrapper (fetch-based)
- Implement Reddit public JSON scraping
- Implement X search (public web endpoints)
- Wire research hooks to TUI
- Implement Canvas with grid-snapped artifacts
- Add add-note, mark-complete, edit-plan interactions

### Phase 5: Polish & Packaging
- Add all key bindings (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+, Tab, /, Esc, arrows)
- Implement settings modal (provider, API key, model, base URL)
- Ensure graceful fallback for smaller context models
- Test with OpenAI, Anthropic, OpenRouter, LM Studio, Ollama
- Create npm publish config, bin entry, README
- Add .env.example and development scripts

## Non-Delusional Features (Must Haves)
1. Evidence-based validation: every claim backed by cited source
2. Assumption challenge: AI questions vague answers
3. Real user conversations: Reddit/X prioritized over generic blogs
4. Clear verdict with reasoning: no sugar-coating
5. No fake positivity: no praise without data
6. Gated phases: user cannot manually advance; AI gates progression
7. Provider freedom: switch providers anytime via settings modal

## Key Bindings
- Ctrl+N: New project
- Ctrl+O: Open project
- Ctrl+S: Save
- Ctrl+,: Settings
- Tab: Switch panel focus
- Enter: Submit input
- /: Search canvas
- Esc: Exit modal
- Arrow keys: Navigate

## Risks
- Ink bundle size (~50MB) - acceptable for open-source CLI
- X scraping fragility - public endpoints may break; may need fallback
- LLM streaming in Ink terminals - test across terminals (iTerm2, Alacritty, Windows Terminal)
- Reddit JSON endpoint rate limits - cache aggressively
- Context window management for local/cheap models - dynamic prompt trimming

## Validation
- E2E test: create project → run Critic → run Researcher → get Verdict → create Plan
- All 5 providers connect and stream correctly
- SQLite persists data between sessions
- Canvas artifacts survive app restart
- Settings changes apply immediately without restart
