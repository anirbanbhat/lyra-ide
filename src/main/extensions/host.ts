import path from 'path';
import { ipcMain } from 'electron';

export interface ExtensionContext {
  extensionPath: string;
  extensionId: string;
  subscriptions: Array<{ dispose(): void }>;
  registerHandler(channel: string, handler: (...args: any[]) => any): void;
  log(message: string): void;
}

interface ActiveExtension {
  id: string;
  module: any;
  context: ExtensionContext;
}

export class ExtensionHost {
  private active = new Map<string, ActiveExtension>();
  private handlers = new Map<string, (...args: any[]) => any>();

  constructor() {
    // Generic handler for extension IPC — routes ext:<channel> to the registered handler
    ipcMain.handle('ext:call', async (_event, channel: string, ...args: any[]) => {
      const handler = this.handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for channel: ${channel}`);
      }
      return handler(...args);
    });
  }

  async activate(extId: string, extPath: string, mainFile: string): Promise<void> {
    if (this.active.has(extId)) return;

    const fullPath = path.join(extPath, mainFile);
    let mod: any;
    try {
      // Clear require cache so re-installs get fresh code
      delete require.cache[require.resolve(fullPath)];
      mod = require(fullPath);
    } catch (err) {
      console.error(`[ExtensionHost] Failed to load ${extId}:`, err);
      return;
    }

    const context = this.createContext(extId, extPath);

    try {
      if (typeof mod.activate === 'function') {
        await mod.activate(context);
      }
      this.active.set(extId, { id: extId, module: mod, context });
      console.log(`[ExtensionHost] Activated: ${extId}`);
    } catch (err) {
      console.error(`[ExtensionHost] Error activating ${extId}:`, err);
      context.subscriptions.forEach(s => s.dispose());
    }
  }

  async deactivate(extId: string): Promise<void> {
    const ext = this.active.get(extId);
    if (!ext) return;

    try {
      if (typeof ext.module.deactivate === 'function') {
        await ext.module.deactivate();
      }
    } catch (err) {
      console.error(`[ExtensionHost] Error deactivating ${extId}:`, err);
    }

    // Dispose subscriptions and remove handlers
    ext.context.subscriptions.forEach(s => s.dispose());
    this.active.delete(extId);
    console.log(`[ExtensionHost] Deactivated: ${extId}`);
  }

  async deactivateAll(): Promise<void> {
    for (const id of Array.from(this.active.keys())) {
      await this.deactivate(id);
    }
  }

  isActive(extId: string): boolean {
    return this.active.has(extId);
  }

  private createContext(extId: string, extPath: string): ExtensionContext {
    const subscriptions: Array<{ dispose(): void }> = [];
    const self = this;

    return {
      extensionId: extId,
      extensionPath: extPath,
      subscriptions,
      registerHandler(channel: string, handler: (...args: any[]) => any) {
        self.handlers.set(channel, handler);
        subscriptions.push({
          dispose() {
            self.handlers.delete(channel);
          },
        });
      },
      log(message: string) {
        console.log(`[${extId}] ${message}`);
      },
    };
  }
}

export const extensionHost = new ExtensionHost();
