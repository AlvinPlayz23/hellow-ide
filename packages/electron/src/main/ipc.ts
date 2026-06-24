import { dialog, ipcMain } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirEntry[];
}

async function readDirectoryTree(directoryPath: string): Promise<DirEntry[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !entry.name.startsWith('.'));

  return Promise.all(
    visibleEntries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryPath,
          type: 'directory' as const,
          children: await readDirectoryTree(entryPath)
        };
      }

      return { name: entry.name, path: entryPath, type: 'file' as const };
    })
  );
}

export function registerIpcHandlers() {
  ipcMain.handle('open-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('read-directory', (_event, directoryPath: string) => readDirectoryTree(directoryPath));
  ipcMain.handle('read-file', (_event, filePath: string) => fs.readFile(filePath, 'utf8'));
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf8');
  });
}
