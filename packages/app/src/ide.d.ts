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
  writeFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  deleteEntry: (path: string) => Promise<void>;
  onMenuAction: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    ide?: IdeApi;
  }
}

export {};
