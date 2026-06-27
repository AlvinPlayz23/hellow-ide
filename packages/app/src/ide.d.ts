interface DirEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: DirEntry[];
}

interface IdeApi {
  openFolder: () => Promise<string | null>;
  readDir: (path: string) => Promise<DirEntry[]>;
  readFile: (path: string) => Promise<string>;
  getFileInfo: (path: string) => Promise<{ size: number; isFile: boolean; isDirectory: boolean }>;
  writeFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  deleteEntry: (path: string) => Promise<void>;
  getRecentWorkspaces: () => Promise<string[]>;
  addRecentWorkspace: (path: string) => Promise<void>;
  terminalStart: (id: string, cwd?: string) => Promise<void>;
  terminalWrite: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  terminalRun: (id: string, command: string) => Promise<void>;
  terminalStop: (id: string) => Promise<void>;
  onTerminalData: (callback: (event: { id: string; type: "stdout" | "stderr"; text: string }) => void) => () => void;
  onTerminalExit: (callback: (event: { id: string; code: number | null }) => void) => () => void;
  onMenuAction: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    ide?: IdeApi;
  }
}

export {};
