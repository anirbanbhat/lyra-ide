import { Menu, app, BrowserWindow, dialog } from 'electron';
import { IPC } from '@shared/ipc-channels';

export function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Lyra',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:open-settings');
          },
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project...',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:new-project');
          },
        },
        { type: 'separator' },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const result = await dialog.showOpenDialog(win, {
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('menu:open-file', result.filePaths[0]);
            }
          },
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            if (!win) return;
            const result = await dialog.showOpenDialog(win, {
              properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('menu:open-folder', result.filePaths[0]);
            }
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:save');
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
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
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:toggle-terminal');
          },
        },
        {
          label: 'Toggle AI Chat',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:toggle-chat');
          },
        },
        {
          label: 'Toggle Markdown Preview',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:toggle-markdown-preview');
          },
        },
      ],
    },
    {
      label: 'Run',
      submenu: [
        {
          label: 'Run in Terminal',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:run');
          },
        },
        {
          label: 'Run Current File',
          accelerator: 'CmdOrCtrl+Shift+F5',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:run-file');
          },
        },
        { type: 'separator' },
        {
          label: 'Stop',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send('menu:stop');
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
