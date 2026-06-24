export type VcsStatus = "modified" | "added" | "untracked" | "ignored";

export interface FileNode {
  type: "file";
  id: string;
  name: string;
  ext: string;
  lang: string;
  vcs?: VcsStatus;
  content: string;
}

export interface DirNode {
  type: "dir";
  id: string;
  name: string;
  expanded: boolean;
  children: TreeNode[];
}

export type TreeNode = FileNode | DirNode;

const f = (
  id: string,
  name: string,
  ext: string,
  lang: string,
  content: string,
  vcs?: VcsStatus,
): FileNode => ({ type: "file", id, name, ext, lang, vcs, content });

const d = (id: string, name: string, expanded: boolean, children: TreeNode[]): DirNode => ({
  type: "dir",
  id,
  name,
  expanded,
  children,
});

/* prettier-ignore */
export const APP_TSX = `import { useState, useCallback } from 'react';
import { TaskList } from './components/TaskList';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Task, Filter } from './types';
import { sortTasks } from './utils/sort';

/**
 * TaskFlow — a local-first task manager.
 * Renders the active task list and wires persistence
 * to the browser's localStorage.
 */
export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [filter, setFilter] = useState<Filter>('all');

  const addTask = useCallback(
    (title: string) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        done: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [task, ...prev]);
    },
    [setTasks],
  );

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

  const visible = sortTasks(
    tasks.filter((t) => {
      if (filter === 'active') return !t.done;
      if (filter === 'done') return t.done;
      return true;
    }),
  );

  return (
    <main className="app">
      <h1>TaskFlow</h1>
      <FilterBar value={filter} onChange={setFilter} />
      <TaskList tasks={visible} onAdd={addTask} onToggle={toggle} />
    </main>
  );
}
`;

export const TYPES_TS = `export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
  tags?: string[];
}

export type Filter = 'all' | 'active' | 'done';

export interface SortOptions {
  by: 'created' | 'title' | 'priority';
  descending: boolean;
}

export type TaskId = Task['id'];
`;

export const SORT_TS = `import type { SortOptions, Task } from '../types';

const DEFAULTS: SortOptions = { by: 'created', descending: true };

/**
 * Returns a new, sorted copy of the task list.
 * The original array is never mutated.
 */
export function sortTasks(
  tasks: Task[],
  opts: SortOptions = DEFAULTS,
): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (opts.by) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'priority':
        cmp = priority(a) - priority(b);
        break;
      default:
        cmp = a.createdAt - b.createdAt;
    }
    return opts.descending ? -cmp : cmp;
  });
}

function priority(task: Task): number {
  const tags = task.tags ?? [];
  if (tags.includes('urgent')) return 2;
  if (tags.includes('high')) return 1;
  return 0;
}
`;

export const USE_LOCAL_STORAGE_TS = `import { useEffect, useState } from 'react';

/**
 * A tiny stateful wrapper around window.localStorage.
 * Keeps a slice of state persisted across reloads.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
`;

export const TASK_LIST_TSX = `import { useState, type FormEvent } from 'react';
import type { Task } from '../types';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
}

export function TaskList({ tasks, onAdd, onToggle }: Props) {
  const [draft, setDraft] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft('');
  };

  return (
    <section className="task-list">
      <form onSubmit={submit}>
        <input
          value={draft}
          placeholder="What needs to be done?"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Add task</button>
      </form>
      {tasks.length === 0 ? (
        <p className="empty">Nothing here yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </section>
  );
}
`;

export const TASK_ITEM_TSX = `import type { Task } from '../types';
import './TaskItem.css';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
}

export function TaskItem({ task, onToggle }: Props) {
  const label = task.done ? 'Mark active' : 'Complete';
  return (
    <li className={task.done ? 'done' : ''}>
      <label>
        <input
          type="checkbox"
          checked={task.done}
          aria-label={label}
          onChange={() => onToggle(task.id)}
        />
        <span>{task.title}</span>
      </label>
    </li>
  );
}
`;

export const GLOBAL_CSS = `:root {
  --accent: #6c5ce7;
  --bg: #f7f8fa;
  --ink: #1a1a2e;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--ink);
}

.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

.task-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-list li.done span {
  text-decoration: line-through;
  opacity: 0.55;
}
`;

export const PACKAGE_JSON = `{
  "name": "taskflow",
  "version": "1.4.2",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0",
    "vitest": "^2.0.0"
  }
}
`;

export const READMD_MD = `# TaskFlow

A minimal, local-first task manager built with **React 19** and **TypeScript**.

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Persists to localStorage automatically
- Sort by priority, title, or created date
- Keyboard-first interaction
- Zero runtime dependencies beyond React

## Scripts

- \`npm run dev\`   — start the dev server
- \`npm run build\` — type-check and bundle
- \`npm test\`      — run the unit suite

## License

MIT © 2026 TaskFlow
`;

export const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

export const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TaskFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

export const SORT_TEST_TS = `import { describe, it, expect } from 'vitest';
import { sortTasks } from '../src/utils/sort';
import type { Task } from '../src/types';

const make = (title: string, createdAt: number): Task => ({
  id: crypto.randomUUID(),
  title,
  done: false,
  createdAt,
});

describe('sortTasks', () => {
  it('sorts by creation date descending by default', () => {
    const tasks = [make('a', 1), make('b', 2)];
    const out = sortTasks(tasks);
    expect(out[0].title).toBe('b');
  });

  it('does not mutate the input', () => {
    const tasks = [make('a', 1), make('b', 2)];
    sortTasks(tasks);
    expect(tasks[0].title).toBe('a');
  });
});
`;

export const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

export const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
`;

export const GITIGNORE = `node_modules
dist
.DS_Store
*.local
.env
coverage
.vite
`;

export const TREE: DirNode = d("root", "taskflow", true, [
  d("root/public", "public", false, [
    f("root/public/favicon.svg", "favicon.svg", "svg", "svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#6c5ce7"/><path d="M9 22V10h5a4 4 0 0 1 0 8h-2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`, "ignored"),
  ]),
  d("root/src", "src", true, [
    d("root/src/components", "components", true, [
      f("root/src/components/TaskItem.tsx", "TaskItem.tsx", "tsx", "tsx", TASK_ITEM_TSX, "added"),
      f("root/src/components/TaskList.tsx", "TaskList.tsx", "tsx", "tsx", TASK_LIST_TSX, "modified"),
    ]),
    d("root/src/hooks", "hooks", true, [
      f("root/src/hooks/useLocalStorage.ts", "useLocalStorage.ts", "ts", "ts", USE_LOCAL_STORAGE_TS, "modified"),
    ]),
    d("root/src/styles", "styles", false, [
      f("root/src/styles/global.css", "global.css", "css", "css", GLOBAL_CSS),
    ]),
    d("root/src/utils", "utils", true, [
      f("root/src/utils/sort.ts", "sort.ts", "ts", "ts", SORT_TS, "modified"),
    ]),
    f("root/src/App.tsx", "App.tsx", "tsx", "tsx", APP_TSX, "modified"),
    f("root/src/main.tsx", "main.tsx", "tsx", "tsx", MAIN_TSX),
    f("root/src/types.ts", "types.ts", "ts", "ts", TYPES_TS, "added"),
  ]),
  d("root/tests", "tests", false, [
    f("root/tests/sort.test.ts", "sort.test.ts", "ts", "ts", SORT_TEST_TS),
  ]),
  f("root/.gitignore", ".gitignore", "gitignore", "txt", GITIGNORE),
  f("root/index.html", "index.html", "html", "html", INDEX_HTML),
  f("root/package.json", "package.json", "json", "json", PACKAGE_JSON),
  f("root/tsconfig.json", "tsconfig.json", "json", "json", TSCONFIG),
  f("root/vite.config.ts", "vite.config.ts", "ts", "ts", VITE_CONFIG),
  f("root/README.md", "README.md", "md", "md", READMD_MD),
]);

export function flattenFiles(node: TreeNode, acc: Record<string, FileNode> = {}): Record<string, FileNode> {
  if (node.type === "file") {
    acc[node.id] = node;
  } else {
    for (const child of node.children) flattenFiles(child, acc);
  }
  return acc;
}

export const FILE_MAP = flattenFiles(TREE);
