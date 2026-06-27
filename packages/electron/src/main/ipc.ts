import { app, dialog, ipcMain } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const recentWorkspacesPath = () => path.join(app.getPath('userData'), 'recent-workspaces.json');
const terminalProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: DirEntry[];
}

async function readRecentWorkspaces(): Promise<string[]> {
  try {
    const raw = await fs.readFile(recentWorkspacesPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function writeRecentWorkspaces(workspaces: string[]) {
  await fs.mkdir(path.dirname(recentWorkspacesPath()), { recursive: true });
  await fs.writeFile(recentWorkspacesPath(), JSON.stringify(workspaces.slice(0, 10), null, 2), 'utf8');
}

async function addRecentWorkspace(workspacePath: string) {
  const current = await readRecentWorkspaces();
  await writeRecentWorkspaces([workspacePath, ...current.filter((item) => item !== workspacePath)]);
}

function isBinaryBuffer(buffer: Buffer) {
  if (buffer.includes(0)) return true;
  const sampleSize = Math.min(buffer.length, 4096);
  let suspicious = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    const byte = buffer[i];
    if (byte < 7 || (byte > 14 && byte < 32)) suspicious += 1;
  }
  return sampleSize > 0 && suspicious / sampleSize > 0.1;
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

      const stat = await fs.stat(entryPath);
      return { name: entry.name, path: entryPath, type: 'file' as const, size: stat.size };
    })
  );
}

export function registerIpcHandlers() {
  ipcMain.handle('open-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    const folderPath = result.canceled ? null : result.filePaths[0];
    if (folderPath) await addRecentWorkspace(folderPath);
    return folderPath;
  });

  ipcMain.handle('read-directory', (_event, directoryPath: string) => readDirectoryTree(directoryPath));
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_TEXT_FILE_BYTES) {
      throw new Error(`File is too large to open (${Math.round(stat.size / 1024)} KB).`);
    }

    const buffer = await fs.readFile(filePath);
    if (isBinaryBuffer(buffer)) {
      throw new Error('Binary files cannot be opened in the text editor.');
    }

    return buffer.toString('utf8');
  });
  ipcMain.handle('get-file-info', async (_event, filePath: string) => {
    const stat = await fs.stat(filePath);
    return { size: stat.size, isFile: stat.isFile(), isDirectory: stat.isDirectory() };
  });
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf8');
  });
  ipcMain.handle('create-file', async (_event, filePath: string, content = '') => {
    await fs.writeFile(filePath, content, { encoding: 'utf8', flag: 'wx' });
  });
  ipcMain.handle('create-directory', async (_event, directoryPath: string) => {
    await fs.mkdir(directoryPath, { recursive: false });
  });
  ipcMain.handle('delete-entry', async (_event, entryPath: string) => {
    await fs.rm(entryPath, { recursive: true, force: false });
  });
  ipcMain.handle('get-recent-workspaces', () => readRecentWorkspaces());
  ipcMain.handle('add-recent-workspace', (_event, workspacePath: string) => addRecentWorkspace(workspacePath));
  ipcMain.handle('terminal-run', async (event, id: string, command: string, cwd?: string) => {
    const existing = terminalProcesses.get(id);
    if (existing) existing.kill();

    const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', command] : ['-lc', command];
    const child = spawn(shell, args, {
      cwd: cwd || process.cwd(),
      env: process.env,
      windowsHide: true
    });

    terminalProcesses.set(id, child);

    child.stdout.on('data', (chunk: Buffer) => {
      event.sender.send('terminal-data', { id, type: 'stdout', text: chunk.toString() });
    });
    child.stderr.on('data', (chunk: Buffer) => {
      event.sender.send('terminal-data', { id, type: 'stderr', text: chunk.toString() });
    });
    child.on('error', (error) => {
      event.sender.send('terminal-data', { id, type: 'stderr', text: `${error.message}\n` });
    });
    child.on('close', (code) => {
      terminalProcesses.delete(id);
      event.sender.send('terminal-exit', { id, code });
    });
  });
  ipcMain.handle('terminal-stop', (_event, id: string) => {
    const child = terminalProcesses.get(id);
    if (!child) return;
    child.kill();
    terminalProcesses.delete(id);
  });
}
