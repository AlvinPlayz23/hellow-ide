import { contextBridge, ipcRenderer } from 'electron';

const ide = {
  openFolder: () => ipcRenderer.invoke('open-folder') as Promise<string | null>,
  readDir: (path: string) => ipcRenderer.invoke('read-directory', path),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path) as Promise<string>,
  getFileInfo: (path: string) => ipcRenderer.invoke('get-file-info', path) as Promise<{ size: number; isFile: boolean; isDirectory: boolean }>,
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content) as Promise<void>,
  createFile: (path: string, content = '') => ipcRenderer.invoke('create-file', path, content) as Promise<void>,
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path) as Promise<void>,
  deleteEntry: (path: string) => ipcRenderer.invoke('delete-entry', path) as Promise<void>,
  getRecentWorkspaces: () => ipcRenderer.invoke('get-recent-workspaces') as Promise<string[]>,
  addRecentWorkspace: (path: string) => ipcRenderer.invoke('add-recent-workspace', path) as Promise<void>,
  terminalRun: (id: string, command: string, cwd?: string) => ipcRenderer.invoke('terminal-run', id, command, cwd) as Promise<void>,
  terminalStop: (id: string) => ipcRenderer.invoke('terminal-stop', id) as Promise<void>,
  onTerminalData: (callback: (event: { id: string; type: 'stdout' | 'stderr'; text: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { id: string; type: 'stdout' | 'stderr'; text: string }) => callback(payload);
    ipcRenderer.on('terminal-data', handler);
    return () => ipcRenderer.removeListener('terminal-data', handler);
  },
  onTerminalExit: (callback: (event: { id: string; code: number | null }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { id: string; code: number | null }) => callback(payload);
    ipcRenderer.on('terminal-exit', handler);
    return () => ipcRenderer.removeListener('terminal-exit', handler);
  },
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  }
};

contextBridge.exposeInMainWorld('ide', ide);

export type HellowIdeApi = typeof ide;
