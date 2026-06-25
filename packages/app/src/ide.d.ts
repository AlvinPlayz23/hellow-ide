interface IdeApi {
  openFolder: () => Promise<string | null>;
  readDir: (path: string) => Promise<{ name: string; path: string; type: 'file' | 'directory'; children?: { name: string; path: string; type: 'file' | 'directory' }[] }[]>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  onMenuAction: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    ide?: IdeApi;
  }
}

export {};
