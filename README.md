# OpenResearch

Multi-agent research tool with TUI, report generation, and adjustable settings.

## Features

- **Multi-Agent Research**: Parallel research agents gather information simultaneously
- **Report Generation**: Auto-generates Markdown/HTML reports from research findings
- **TUI Interface**: Full-screen terminal UI with real-time agent status
- **Command Palette**: Press `Ctrl+P` to open command palette (Research, Reports, Settings, Quit)
- **Adjustable Settings**: Configure max agents, report format, theme, and more via Settings panel

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev
```

## Controls

- `Ctrl+P` - Open command palette / Settings shortcut
- `Ctrl+C` - Quit
- Type query and press Enter to start research

## Configuration

Settings are stored in `~/.config/openresearch/config.json` and can be adjusted at runtime via the Settings panel.

- `maxAgents`: Maximum parallel agents
- `reportFormat`: `markdown` or `html`
- `defaultOutputDir`: Where reports are saved
- `theme`: `dark` or `light`
- `fontSize`: Terminal font size preference