# PayAid Desktop Agent

System-wide AI assistant built with Electron/Tauri.

## Features

- System-wide context awareness
- Email integration (Gmail/Outlook)
- Calendar integration
- WhatsApp Web integration
- Cross-app workflow suggestions
- Natural language commands

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

- Main process: System integration, context detection
- Renderer: UI built with React/Next.js
- IPC: Communication between processes
