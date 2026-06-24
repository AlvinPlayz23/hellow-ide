import { contextBridge, ipcRenderer } from 'electron';

const ide = {
  openFolder: () => ipcRenderer.invoke('open-folder') as Promise<string | null>,
  readDir: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path) as Promise<string>,
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content) as Promise<void>
};

contextBridge.exposeInMainWorld('ide', ide);

export type HellowIdeApi = typeof ide;
