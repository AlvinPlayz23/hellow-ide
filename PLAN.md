# Hellow IDE — Development Plan

A JetBrains-inspired code editor built with Electron, React, TypeScript, and a custom code editor engine.

---

## Stack

| Layer       | Tech                                     |
|-------------|------------------------------------------|
| Shell       | Electron                                 |
| Build       | Vite + TypeScript                        |
| Package Mgr | pnpm                                     |
| UI          | React                                    |
| Styling     | Tailwind CSS + shadcn/ui components      |
| Editor      | Custom (no Monaco/CodeMirror)            |
| State       | React context + refs                     |
| IPC         | Electron preload bridge                  |
| File System | Node fs via main process only            |

---

## UI Components — shadcn + Custom

### What shadcn provides

| Component        | Use Case                                  |
|------------------|-------------------------------------------|
| `Tabs`           | Editor tab bar                            |
| `ScrollArea`     | File explorer, panels, overflow           |
| `Button`         | Toolbar actions                           |
| `DropdownMenu`   | File menu, context menus                  |
| `Separator`      | Panel dividers                            |
| `Tooltip`        | Shortcut hints on hover                   |
| `ResizablePanel` | Sidebar and bottom panel resizing         |
| `Dialog`         | Open folder modal, settings               |
| `ContextMenu`    | Right-click menus on files/editor         |
| `Input`          | Search bars, file name inputs             |
| `Badge`          | Dirty indicator, language label           |
| `Skeleton`       | Loading states                            |

### What we build custom

| Component         | Why                                    |
|-------------------|----------------------------------------|
| `Editor`          | Custom text engine, cursor, selection  |
| `EditorGutter`    | Line numbers, fold markers, decorations|
| `FileTree`        | Recursive tree with custom icons       |
| `EditorTabs`      | Reorderable, closable, dirty indicator |
| `BottomPanel`     | Terminal/problems/output tabs          |
| `RightStripe`     | JetBrains-style tool window strip      |
| `CommandPalette`  | Ctrl+Shift+P quick actions (phase 2)   |

### Tailwind Theme Override — JetBrains Darcula

shadcn defaults are too soft for a JetBrains feel. Override via `tailwind.config.ts`:

```ts
const config = {
  theme: {
    extend: {
      colors: {
        background: "#1e1f22",
        foreground: "#a9b7c6",
        border: "#393b40",
        primary: { DEFAULT: "#4a9eda", foreground: "#fff" },
        muted: { DEFAULT: "#2b2d30", foreground: "#808080" },
        accent: { DEFAULT: "#214283", foreground: "#fff" },
        panel: "#18191b",
      },
      borderRadius: { DEFAULT: "2px" },
      fontSize: { xs: ["11px", "16px"] },
      spacing: { gutter: "60px" },
    },
  },
}
```

This keeps the shadcn component API but forces a sharp, dense, JetBrains look.

---

## Architecture

### Main Process (`src/main/`)

- Window management (BrowserWindow)
- Native menus (File, Edit, View, Help)
- IPC handlers:
  - `open-folder` → dialog.showOpenDialog → directory path
  - `read-directory` → recursive tree read
  - `read-file` → read file contents
  - `write-file` → save file contents
  - `get-recent-workspaces` → stored in electron-store or JSON
- Auto-update placeholder

### Preload (`src/preload/`)

Exposes `window.ide` API via contextBridge:

```ts
window.ide.openFolder() → Promise<string | null>
window.ide.readDir(path) → Promise<DirEntry[]>
window.ide.readFile(path) → Promise<string>
window.ide.writeFile(path, content) → Promise<void>
window.ide.getRecentWorkspaces() → Promise<string[]>
window.ide.addRecentWorkspace(path) → Promise<void>
```

### Renderer (`src/renderer/`)

React app with JetBrains-dark layout.

---

## UI Layout

```
┌──────────────────────────────────────────────────┐
│  Toolbar  [ Project Name ]  [actions]            │
├────────┬─────────────────────────────┬───────────┤
│        │  [tab] [tab] [tab]          │           │
│ Explorer│────────────────────────────│  Right    │
│        │                             │  Stripe   │
│  file  │     EDITOR                  │  (placeholder) │
│  tree  │                             │           │
│        │                             │           │
├────────┴─────────────────────────────┴───────────┤
│  [ Terminal ] [ Problems ] [ Output ]            │
│  ─────────────────────────────────               │
│  bottom panel content                            │
└──────────────────────────────────────────────────┘
```

- Sidebar width: resizable, default 260px
- Bottom panel height: resizable, default 200px
- Right stripe: 40px placeholder for future tool windows
- Theme: JetBrains Darcula-inspired dark palette

---

## Custom Editor Engine

### Data Model

```ts
interface Document {
  path: string;
  lines: string[];
  dirty: boolean;
  language: string;
}

interface Cursor {
  line: number;
  col: number;
}

interface Selection {
  anchor: Cursor;
  head: Cursor;
}

interface EditorState {
  documents: Document[];
  activeDocIndex: number;
  cursor: Cursor;
  selection: Selection | null;
  scrollTop: number;
}
```

### Rendering Strategy

- Render visible lines only (virtual scroll)
- Each line is a `<div>` with:
  - Line number in gutter
  - Token spans for syntax highlighting (later)
- Caret rendered as absolute-positioned `<div>` overlay
- Selection rendered as semi-transparent highlight spans
- Use a hidden `<textarea>` for keyboard capture only
- All text changes go through the data model, not DOM contenteditable

### MVP Features

**Phase 1 — Core**
- Open file from explorer → load into editor
- Display lines with line numbers
- Place caret on click
- Move caret with arrow keys
- Insert/delete characters
- Backspace/delete
- Enter for new lines
- Tab insertion (2 spaces)
- Ctrl+Z undo / Ctrl+Y redo

**Phase 2 — Polish**
- Multi-line selection
- Copy/paste
- Find/replace
- Word wrap toggle
- Minimap placeholder
- Current line highlight
- Bracket auto-close (basic)
- Indentation guides

**Phase 3 — Advanced**
- Syntax highlighting (tokenizer per language or `vscode-textmate` for grammars)
- Multi-cursor
- Column selection
- Code folding
- Line decorations / gutter actions
- Hover tooltip placeholder

**Phase 4 — LSP & AI Integration**
- Language Server Protocol client (`vscode-languageserver-protocol`)
- JSON-RPC transport for spawning language servers
- Diagnostics (errors/warnings) in gutter and editor
- Completions, hover, go-to-definition
- AI code completion via API client + streaming
- AI inline suggestions

---

## File Explorer

- Open folder via native dialog
- Display tree with folder expand/collapse
- File icons based on extension
- Click file → open in editor tab
- Track open tabs and active tab
- Dirty indicator (dot) on unsaved tabs
- Double-click to reveal in system explorer (stretch goal)

---

## Tab System

- Tabs bar above editor
- Click to switch active document
- Close button per tab
- Drag reorder (phase 2)
- Scrollable overflow for many tabs
- New tab = untitled document (phase 2)

---

## Keyboard Shortcuts (MVP)

| Action           | Shortcut        |
|------------------|-----------------|
| Save             | Ctrl+S          |
| Open Folder      | Ctrl+O          |
| Close Tab        | Ctrl+W          |
| Undo             | Ctrl+Z          |
| Redo             | Ctrl+Y          |
| Select All       | Ctrl+A          |
| Copy             | Ctrl+C          |
| Cut              | Ctrl+X          |
| Paste            | Ctrl+V          |
| Toggle Sidebar   | Ctrl+B          |
| Toggle Panel     | Ctrl+J          |

---

## Theme — JetBrains Darcula Inspired

```css
--bg-primary: #1e1f22;
--bg-secondary: #2b2d30;
--bg-tertiary: #18191b;
--text-primary: #a9b7c6;
--text-secondary: #808080;
--accent: #4a9eda;
--accent-hover: #5fb4f0;
--border: #393b40;
--selection: #214283;
--line-highlight: #2d2f33;
--gutter-bg: #1e1f22;
--gutter-text: #6b7280;
```

---

## Project Structure

pnpm workspaces monorepo:

```
hellow-ide/
├── PLAN.md
├── pnpm-workspace.yaml            # defines packages/*
├── package.json                   # root package.json
├── tsconfig.json                  # root tsconfig
├── packages/
│   ├── electron/                  # Electron main + preload
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main/
│   │       │   ├── index.ts
│   │       │   ├── ipc.ts
│   │       │   └── menu.ts
│   │       └── preload/
│   │           └── index.ts
│   ├── app/                       # React renderer (Vite)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── components.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── ui/            # shadcn components
│   │       │   ├── Layout.tsx
│   │       │   ├── Toolbar.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   ├── FileExplorer.tsx
│   │       │   ├── EditorTabs.tsx
│   │       │   ├── Editor.tsx
│   │       │   ├── EditorLine.tsx
│   │       │   ├── EditorGutter.tsx
│   │       │   ├── BottomPanel.tsx
│   │       │   └── RightStripe.tsx
│   │       ├── hooks/
│   │       │   ├── useEditor.ts
│   │       │   ├── useFileSystem.ts
│   │       │   └── useKeybindings.ts
│   │       ├── store/
│   │       │   └── context.ts
│   │       ├── styles/
│   │       │   └── globals.css
│   │       └── types/
│   │           └── index.ts
│   ├── editor/                    # Custom editor engine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── model.ts
│   │       ├── cursor.ts
│   │       ├── selection.ts
│   │       ├── history.ts
│   │       ├── keymap.ts
│   │       └── tokenizer.ts
│   ├── lsp/                       # LSP client (future)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   └── agent/                     # AI integration (future)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
```

---

## Build Scripts

Root `package.json`:

```json
{
  "scripts": {
    "dev": "pnpm --filter @hellow/electron dev",
    "build": "pnpm --filter @hellow/electron build",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint"
  }
}
```

`packages/electron/package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter @hellow/app dev\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "pnpm --filter @hellow/app build && electron-builder",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Implementation Order

1. Project scaffolding (pnpm init, tsconfig, vite config)
2. Set up pnpm workspaces for monorepo structure
3. Install Tailwind CSS + shadcn/ui + lucide-react
4. Electron main process + window
5. Preload bridge
6. React layout shell with Tailwind + JetBrains Darcula theme
7. Sidebar with file explorer (shadcn ScrollArea + custom tree)
8. Tab bar (shadcn Tabs + custom editor tabs)
9. Editor core (custom text buffer, cursor, keyboard input)
10. File open/save integration
11. Bottom panel placeholder (shadcn Tabs)
12. Keyboard shortcuts
13. Polish and refinement
