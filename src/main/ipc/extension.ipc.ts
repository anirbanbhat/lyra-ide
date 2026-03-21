import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc-channels';
import { ExtensionManager } from '../extensions/manager';

const extensionManager = new ExtensionManager();

// Initialization promise — handlers wait for this before responding
const initPromise = extensionManager.loadInstalled().then(() => extensionManager.ensureDefaults());

export function registerExtensionIPC() {
  ipcMain.handle(IPC.EXT_LIST_INSTALLED, async () => {
    await initPromise;
    return extensionManager.getInstalled();
  });

  ipcMain.handle(IPC.EXT_LIST_REGISTRY, async () => {
    await initPromise;
    return extensionManager.loadRegistry();
  });

  ipcMain.handle(IPC.EXT_SEARCH, async (_event, query: string) => {
    await initPromise;
    return extensionManager.search(query);
  });

  ipcMain.handle(IPC.EXT_INSTALL, async (_event, id: string) => {
    await initPromise;
    await extensionManager.install(id);
  });

  ipcMain.handle(IPC.EXT_UNINSTALL, async (_event, id: string) => {
    await initPromise;
    await extensionManager.uninstall(id);
  });

  ipcMain.handle(IPC.EXT_ENABLE, async (_event, id: string) => {
    await initPromise;
    await extensionManager.enable(id);
  });

  ipcMain.handle(IPC.EXT_DISABLE, async (_event, id: string) => {
    await initPromise;
    await extensionManager.disable(id);
  });

  ipcMain.handle(IPC.EXT_README, async (_event, id: string) => {
    await initPromise;
    return extensionManager.getReadme(id);
  });
}
