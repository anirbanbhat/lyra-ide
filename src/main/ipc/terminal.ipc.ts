import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '@shared/ipc-channels';
import { terminalService } from '../services/terminal.service';
import type { TerminalSpawnOpts } from '@shared/types/terminal.types';

export function registerTerminalIPC() {
  ipcMain.handle(IPC.TERMINAL_SPAWN, (event, opts: TerminalSpawnOpts) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const id = terminalService.spawn(
      opts,
      (termId, data) => {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC.TERMINAL_DATA, termId, data);
        }
      },
      (termId, code) => {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC.TERMINAL_EXIT, termId, code);
        }
      }
    );

    return id;
  });

  ipcMain.on(IPC.TERMINAL_WRITE, (_event, id: string, data: string) => {
    terminalService.write(id, data);
  });

  ipcMain.on(IPC.TERMINAL_RESIZE, (_event, id: string, cols: number, rows: number) => {
    terminalService.resize(id, cols, rows);
  });

  ipcMain.on(IPC.TERMINAL_KILL, (_event, id: string) => {
    terminalService.kill(id);
  });
}
