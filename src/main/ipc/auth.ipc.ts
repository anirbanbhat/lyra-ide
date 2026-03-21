import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '@shared/ipc-channels';
import { openExternalUrl, startCallbackServer, stopCallbackServer } from '../services/auth.service';

const AUTH_CALLBACK_PORT = 17342;

export function registerAuthIPC() {
  ipcMain.handle(IPC.AUTH_OPEN_URL, async (_event, url: string) => {
    openExternalUrl(url);
  });

  ipcMain.handle(IPC.AUTH_START_CALLBACK_SERVER, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    await startCallbackServer(AUTH_CALLBACK_PORT, (key) => {
      if (!win.isDestroyed()) {
        win.webContents.send('auth:key-received', key);
      }
    });

    return AUTH_CALLBACK_PORT;
  });

  ipcMain.handle(IPC.AUTH_STOP_CALLBACK_SERVER, async () => {
    stopCallbackServer();
  });
}
