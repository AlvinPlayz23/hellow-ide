import { Menu, app, BrowserWindow } from 'electron';

type MenuAction =
  | 'open-folder'
  | 'new-file'
  | 'new-folder'
  | 'save'
  | 'save-all'
  | 'reload-from-disk'
  | 'close-tab'
  | 'find'
  | 'find-in-files'
  | 'toggle-project'
  | 'toggle-structure'
  | 'toggle-terminal'
  | 'toggle-problems'
  | 'run'
  | 'build'
  | 'stop';

function sendAction(action: MenuAction) {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.send('menu-action', action);
}

export function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => sendAction('new-file') },
        { label: 'New Folder', accelerator: 'CmdOrCtrl+Shift+N', click: () => sendAction('new-folder') },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+O', click: () => sendAction('open-folder') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendAction('save') },
        { label: 'Save All', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendAction('save-all') },
        { label: 'Reload from Disk', accelerator: 'CmdOrCtrl+Alt+R', click: () => sendAction('reload-from-disk') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => sendAction('close-tab') },
        { type: 'separator' },
        { label: 'Settings...', accelerator: 'CmdOrCtrl+,' },
        { type: 'separator' },
        { label: 'Close Project' },
        { label: 'Quit', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { label: 'Find...', accelerator: 'CmdOrCtrl+F', click: () => sendAction('find') },
        { label: 'Replace...', accelerator: 'CmdOrCtrl+R' },
        { label: 'Find in Files...', accelerator: 'CmdOrCtrl+Shift+F', click: () => sendAction('find-in-files') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Tool Windows', enabled: false },
        { label: '  Project', accelerator: 'CmdOrCtrl+1', click: () => sendAction('toggle-project') },
        { label: '  Structure', accelerator: 'CmdOrCtrl+7', click: () => sendAction('toggle-structure') },
        { label: '  Terminal', accelerator: 'Alt+F12', click: () => sendAction('toggle-terminal') },
        { label: '  Problems', accelerator: 'CmdOrCtrl+6', click: () => sendAction('toggle-problems') },
        { type: 'separator' },
        { label: 'Compact Mode' },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Class...' },
        { label: 'File...', accelerator: 'CmdOrCtrl+Shift+O' },
        { label: 'Symbol...', accelerator: 'CmdOrCtrl+Alt+O' },
        { type: 'separator' },
        { label: 'Line/Column...', accelerator: 'CmdOrCtrl+L' },
        { label: 'Recent Files', accelerator: 'CmdOrCtrl+E' }
      ]
    },
    {
      label: 'Code',
      submenu: [
        { label: 'Reformat Code', accelerator: 'CmdOrCtrl+Alt+L' },
        { label: 'Optimize Imports', accelerator: 'Ctrl+Alt+O' },
        { type: 'separator' },
        { label: 'Comment with Line Comment', accelerator: 'CmdOrCtrl+/' }
      ]
    },
    {
      label: 'Refactor',
      submenu: [
        { label: 'Rename...', accelerator: 'Shift+F6' },
        { label: 'Extract Variable', accelerator: 'Alt+CmdOrCtrl+V' },
        { label: 'Extract Method', accelerator: 'Alt+CmdOrCtrl+M' }
      ]
    },
    {
      label: 'Build',
      submenu: [
        { label: 'Build Project', accelerator: 'F9', click: () => sendAction('build') },
        { label: 'Recompile Current File', accelerator: 'CmdOrCtrl+Shift+F9' }
      ]
    },
    {
      label: 'Run',
      submenu: [
        { label: "Run Active File", accelerator: 'Ctrl+R', click: () => sendAction('run') },
        { label: "Debug Active File", accelerator: 'Ctrl+D', click: () => sendAction('run') },
        { type: 'separator' },
        { label: 'Stop', accelerator: 'CmdOrCtrl+F2', click: () => sendAction('stop') }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Tasks & Contexts' },
        { label: 'HTTP Client' }
      ]
    },
    {
      label: 'VCS',
      submenu: [
        { label: 'Commit...', accelerator: 'CmdOrCtrl+K' },
        { label: 'Update Project', accelerator: 'CmdOrCtrl+T' },
        { label: 'Push...', accelerator: 'CmdOrCtrl+Shift+K' },
        { type: 'separator' },
        { label: 'Git: Branches...' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Restore Default Layout' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Find Action...', accelerator: 'CmdOrCtrl+Shift+A' },
        { label: 'Keyboard Shortcuts' },
        { type: 'separator' },
        { label: `About ${app.name}` }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
