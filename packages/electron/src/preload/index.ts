import { contextBridge, ipcRenderer } from 'electron';

const ide = {
  openFolder: () => ipcRenderer.invoke('open-folder') as Promise<string | null>,
  readDir: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path) as Promise<string>,
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content) as Promise<void>,
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  }
};

contextBridge.exposeInMainWorld('ide', ide);

export type HellowIdeApi = typeof ide;
