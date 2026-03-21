# Lyra IDE

Lyra is an open-source, cross-platform IDE with customizable AI agent integration, built with Electron, React, and Monaco Editor. It supports multiple AI providers, an integrated terminal, Git source control, a Markdown previewer with Mermaid diagram support, and an extensions marketplace.

---

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [User Interface Overview](#user-interface-overview)
4. [File Explorer](#file-explorer)
5. [Code Editor](#code-editor)
6. [Integrated Terminal](#integrated-terminal)
7. [AI Chat Panel](#ai-chat-panel)
8. [Git Source Control](#git-source-control)
9. [Extensions Marketplace](#extensions-marketplace)
10. [Settings](#settings)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Project Templates](#project-templates)
13. [Architecture](#architecture)
14. [Troubleshooting](#troubleshooting)

---

## Installation

### Download (macOS)

Download the latest `.dmg` installer from the [GitHub Releases](https://github.com/AniGarg-IIT/lyra-ide/releases) page:

| Chip | Download |
|------|----------|
| Apple Silicon (M1/M2/M3/M4) | [Lyra-0.1.0-arm64.dmg](https://github.com/AniGarg-IIT/lyra-ide/releases/latest/download/Lyra-0.1.0-arm64.dmg) |
| Intel | [Lyra-0.1.0.dmg](https://github.com/AniGarg-IIT/lyra-ide/releases/latest/download/Lyra-0.1.0.dmg) |

> **Note:** The app is not code-signed. On first launch, macOS may block it. Right-click the app and choose **Open**, then click **Open** in the dialog to bypass Gatekeeper.

### Build from Source

#### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **Python 3** with `setuptools` (for building native modules)
- **Git** (for source control features)
- **Xcode Command Line Tools** (macOS): `xcode-select --install`

```bash
# Clone the repository
git clone https://github.com/AniGarg-IIT/lyra-ide.git
cd lyra-ide

# Install dependencies
npm install

# Rebuild native modules for Electron (node-pty)
npx electron-rebuild

# Run in development mode
npm run dev

# Or build and run production
npm run start
```

### Build Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode with hot reload |
| `npm run start` | Build all and launch Electron |
| `npm run build` | Build renderer, preload, and main process |
| `npm run build:renderer` | Build only the renderer (UI) |
| `npm run build:preload` | Build only the preload script |
| `npm run build:main` | Build only the main process |
| `npm run dist` | Build and package as distributable (DMG/NSIS/AppImage) |
| `npm run typecheck` | Run TypeScript type checking |

### Platform Notes

- **macOS**: Primary target platform. Uses `titleBarStyle: 'hiddenInset'` for a native look with traffic light buttons.
- **Windows/Linux**: Supported via Electron. Build with `npm run dist` to generate platform-specific installers.
- Native module `node-pty` requires a C++ compiler. On macOS this comes with Xcode CLI tools. On Windows, install "Desktop development with C++" workload from Visual Studio Build Tools. On Linux, install `build-essential`.

---

## Getting Started

When you first launch Lyra, you'll see the **Welcome Screen** with two options:

1. **New Project** - Create a new project from a template
2. **Open Folder** - Open an existing project directory

You can also use the menu bar: **File > New Project** or **File > Open Folder**.

---

## User Interface Overview

Lyra's layout consists of these main areas:

```
+----------------------------------------------+
|              Title Bar                        |
+----+-----+-------------------+----------------+
| AB | SB  |    Editor Area    |  AI Chat Panel |
|    |     |                   |                |
| A  | F   |  Monaco Editor    |  Agent Select  |
| c  | i   |                   |  Model Select  |
| t  | l   |  (+ Markdown      |  Messages      |
| i  | e   |   Preview for .md)|  Input         |
| v  |     |                   |                |
| i  | E   |-------------------|                |
| t  | x   |  Terminal Panel   |                |
| y  | p   |  (toggle)         |                |
|    | l   |                   |                |
+----+-----+-------------------+----------------+
|              Status Bar                       |
+----------------------------------------------+
```

- **Activity Bar** (left edge): Icons to switch sidebar views - Explorer, Git, Extensions
- **Sidebar**: Shows the active view (file tree, git panel, or extensions)
- **Editor Area**: Monaco-powered code editor with tabs, split Markdown preview
- **Terminal Panel**: Integrated terminal (toggleable)
- **AI Chat Panel**: AI agent chat (toggleable)
- **Status Bar**: File info, terminal/chat toggles, version

---

## File Explorer

The File Explorer shows your project's file tree. Click on files to open them in the editor.

- **Folders** expand/collapse on click, with lazy-loaded children
- **Files** open in a new editor tab on click
- Hidden files (starting with `.`) are filtered out (except `.gitignore`)
- `node_modules` is automatically hidden

When no folder is open, the explorer shows "New Project" and "Open Folder" buttons.

---

## Code Editor

Lyra uses **Monaco Editor** (the same engine as VS Code) with a custom **Catppuccin Mocha** dark theme.

### Features

- Syntax highlighting for all major languages (TypeScript, JavaScript, Python, HTML, CSS, JSON, Go, Rust, etc.)
- IntelliSense / autocomplete with suggestions
- Bracket pair colorization
- Minimap
- Find and replace (Cmd+F / Cmd+H)
- Multi-cursor editing
- Code folding
- Indent guides
- Linked editing for HTML tags
- Format on paste
- Smooth scrolling and cursor animation

### Supported File Types

The editor auto-detects language from file extension:

| Extension | Language |
|-----------|----------|
| .ts, .tsx | TypeScript |
| .js, .jsx | JavaScript |
| .py | Python |
| .html | HTML |
| .css, .scss, .less | CSS |
| .json | JSON |
| .md | Markdown |
| .rs | Rust |
| .go | Go |
| .java | Java |
| .c, .cpp, .h | C/C++ |
| .yaml, .yml | YAML |
| .xml | XML |
| .sh | Shell |
| .sql | SQL |
| And many more... | |

---

## Integrated Terminal

The terminal panel provides a full PTY (pseudo-terminal) experience using `node-pty` and `xterm.js`.

### Features

- Full shell support (zsh, bash, etc.)
- Multiple terminal tabs with "+" to create new ones
- Tab close with "x" button
- 256-color support and true color
- Web links detection (clickable URLs)
- Resizable panel height by dragging the top border
- Terminal auto-inherits the project's working directory
- 5000 lines scrollback buffer

### Usage

- Press **Cmd+`** to toggle the terminal panel
- Click **+** in the tab bar to create a new terminal
- Click **x** to close a terminal tab
- Drag the top border to resize

---

## AI Chat Panel

The AI Chat panel lets you interact with AI models from multiple providers.

### Supported Providers

#### Anthropic (Claude)
- Models: Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5, Claude Sonnet 4.5
- Requires API key from [Anthropic Console](https://console.anthropic.com/settings/keys)

#### OpenAI (GPT)
- Models: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, o1, o1-mini
- Requires API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Supports custom base URL for API-compatible providers

#### Ollama (Local)
- Runs locally, no API key needed
- Default URL: http://localhost:11434
- Requires [Ollama](https://ollama.ai) to be running on your machine
- Configure model name in settings (default: llama3.2)

### Usage

1. Select an AI agent from the dropdown (top of chat panel)
2. Select a model version from the second dropdown
3. Type your message and press **Enter** to send
4. Press **Stop** to cancel a streaming response
5. Press **Clear** to reset the conversation

If no API key is configured, a yellow banner appears with a **Configure** button that opens Settings.

### Sign-in Flow

For Anthropic and OpenAI:
1. Open **Settings > AI Agents**
2. Select the provider
3. Click **Sign in to [Provider]**
4. Your browser opens to the provider's API key page
5. A second tab opens with a Lyra paste page
6. Copy your API key from the provider and paste it in the Lyra page
7. The key is automatically saved

For custom agents, see [Creating Custom AI Agents](docs/creating-agents.md).

---

## Git Source Control

The Git panel provides a visual interface for Git operations.

### Accessing Git

- Click the **Git icon** (branch symbol) in the Activity Bar
- Or press **Cmd+Shift+G**

### Views

#### Changes
- Shows **staged**, **modified**, and **untracked** files
- Click **+** next to a file to stage it
- Click **-** next to a staged file to unstage it
- Click **Stage All** to stage everything
- Type a commit message and click **Commit** or press Enter
- Use **Pull** and **Push** buttons for remote operations
- Click a file name to view its diff

#### Log
- Shows commit history (last 50 commits)
- Displays hash, message, author, and date

#### Branches
- Lists all local branches
- Current branch is highlighted with accent color
- Click a branch name to switch to it
- Type a name and click **Create** to create a new branch

#### Config (Sign In)
- Set your Git **name** and **email**
- Enter a **GitHub Personal Access Token** for pushing to private repositories
- Click **Save** to apply

### Initializing a Repository

If the current folder isn't a Git repository, the panel shows an **Initialize Repository** button.

---

## Extensions Marketplace

Lyra has a built-in extensions system for adding themes, language packs, and plugins.

### Accessing Extensions

- Click the **puzzle piece icon** in the Activity Bar
- Or press **Cmd+Shift+X**

### Browse & Install

1. Switch to the **Browse** tab to see available extensions from the registry
2. Use the search bar to filter extensions
3. Click **Install** to add an extension

### Manage Installed

1. Switch to the **Installed** tab
2. Click **Disable** to disable an extension (keeps it installed)
3. Click **Enable** to re-enable a disabled extension
4. Click **Uninstall** to remove an extension
5. Click an extension's **name** to view its README in a new editor tab

### Extension Types

| Type | Description |
|------|-------------|
| Theme | Color themes for the editor |
| Language Pack | Language support and syntax highlighting |
| Plugin | General-purpose extensions |

### Default Extensions

Lyra ships with the **Markdown Preview** extension (`lyra-markdown-preview`) pre-installed. It provides:
- Live split-view Markdown preview
- Mermaid diagram rendering
- PDF export

Toggle the preview with **Cmd+Shift+M** when a `.md` file is open. You can disable or uninstall it from the Extensions panel like any other extension.

For creating your own extensions, see [Creating Custom Extensions](docs/creating-extensions.md).

---

## Settings

Open Settings with **Cmd+,** or via the menu.

### AI Agents Tab

- Select a provider (Anthropic, OpenAI, Ollama)
- Configure API key, model, max tokens, temperature
- Sign in with browser-based flow for API key setup

### General Tab

- Shows keyboard shortcuts reference
- Additional settings will be added in future updates

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd+S** | Save current file |
| **Cmd+O** | Open file |
| **Cmd+Shift+O** | Open folder |
| **Cmd+Shift+N** | New project |
| **Cmd+`** | Toggle terminal |
| **Cmd+B** | Toggle AI chat panel |
| **Cmd+,** | Open settings |
| **Cmd+Shift+G** | Toggle Git panel |
| **Cmd+Shift+X** | Toggle Extensions panel |
| **Cmd+Shift+M** | Toggle Markdown preview |

### Editor Shortcuts (Monaco)

| Shortcut | Action |
|----------|--------|
| **Cmd+F** | Find |
| **Cmd+H** | Find and replace |
| **Cmd+D** | Add selection to next find match |
| **Cmd+Shift+K** | Delete line |
| **Cmd+/** | Toggle line comment |
| **Cmd+Shift+/** | Toggle block comment |
| **Option+Up/Down** | Move line up/down |
| **Option+Shift+Up/Down** | Copy line up/down |
| **Cmd+Shift+P** | Command palette |
| **Cmd+G** | Go to line |
| **Cmd+P** | Quick open |
| **Tab** | Indent |
| **Shift+Tab** | Outdent |

*Note: On Windows/Linux, replace **Cmd** with **Ctrl**.*

---

## Project Templates

When creating a new project (**Cmd+Shift+N**), you can choose from these templates:

| Template | Contents |
|----------|----------|
| **Blank** | README.md, .gitignore |
| **Node.js** | package.json, src/index.js, README.md, .gitignore |
| **TypeScript** | package.json, tsconfig.json, src/index.ts, README.md, .gitignore |
| **Python** | src/main.py, requirements.txt, README.md, .gitignore |
| **HTML/CSS/JS** | index.html, style.css, script.js, README.md |

---

## Architecture

Lyra is built with a three-process Electron architecture:

### Main Process (`src/main/`)
- Electron app lifecycle and window management
- IPC handlers for all backend operations
- Services: file system, terminal (node-pty), git, auth, extensions
- AI agent registry and streaming
- Settings persistence (`~/.lyra/settings.json`)

### Preload Script (`src/preload/`)
- Bridges main and renderer via `contextBridge`
- Exposes `window.lyra` API with typed methods
- Namespaces: `fs`, `terminal`, `agent`, `settings`, `auth`, `git`, `markdown`, `extensions`

### Renderer Process (`src/renderer/`)
- React 19 UI
- Zustand state management (stores for editor, file tree, chat, git, extensions)
- Monaco Editor for code editing
- xterm.js for terminal emulation
- marked + mermaid for Markdown rendering

### Build System
- **Vite** for bundling all three processes
- Three separate Vite configs: `vite.config.ts` (renderer), `vite.main.config.ts`, `vite.preload.config.ts`
- **electron-builder** for packaging distributions

### Data Storage

| Path | Purpose |
|------|---------|
| `~/.lyra/settings.json` | User settings and agent configs |
| `~/.lyra/agents/` | Custom AI agent plugins |
| `~/.lyra/extensions/` | Installed extensions |
| `~/.lyra/extensions/registry.json` | Extension registry |
| `~/.lyra/extensions/extensions-state.json` | Extension enable/disable state |

---

## Troubleshooting

### "Loading editor..." stuck

This was caused by Monaco Editor loading from CDN. Lyra now bundles Monaco workers locally. If you see this:
- Clear the build: `rm -rf dist/`
- Rebuild: `npm run build`

### Terminal not working

The terminal requires `node-pty`, a native module:
```bash
# Install Python setuptools (needed for node-gyp)
pip3 install setuptools

# Rebuild native modules for your Electron version
npx electron-rebuild
```

### node-pty build fails

- Ensure you have Xcode CLI tools: `xcode-select --install`
- Ensure Python 3 with setuptools: `pip3 install setuptools`
- Use node-pty v1.1.0+ for Electron 33+ compatibility

### AI agent says "API key not configured"

1. Open Settings (**Cmd+,**)
2. Go to the **AI Agents** tab
3. Select the provider (Anthropic/OpenAI)
4. Enter your API key or click **Sign in**
5. Click **Save**

### "Credit balance too low" from Anthropic

Your Anthropic account needs credits. Go to [Plans & Billing](https://console.anthropic.com/settings/plans) to add credits, or switch to a different provider.

### Mermaid diagrams not rendering

- Ensure the code block uses the exact language tag ` ```mermaid `
- Check the browser console for rendering errors
- Ensure the Markdown Preview extension is installed and enabled

### Git operations fail

- Ensure `git` is installed and in your PATH
- For push/pull, ensure remote is configured: `git remote -v`
- For private repos, configure a GitHub token in Git > Config tab

### Extensions not loading

- Extensions must be in `~/.lyra/extensions/<name>/`
- Must have `package.json` with `"lyra-extension": true`
- Restart Lyra after installing extensions manually

### Build errors

```bash
# Clean and rebuild
rm -rf dist/ node_modules/.cache
npm run build

# If native modules fail
npx electron-rebuild
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
