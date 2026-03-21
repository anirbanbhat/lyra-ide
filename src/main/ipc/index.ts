import { registerFileSystemIPC } from './file-system.ipc';
import { registerTerminalIPC } from './terminal.ipc';
import { registerAgentIPC } from './agent.ipc';
import { registerSettingsIPC } from './settings.ipc';
import { registerAuthIPC } from './auth.ipc';
import { registerExtensionIPC } from './extension.ipc';
import { registerGitIPC } from './git.ipc';
import { registerMarkdownIPC } from './markdown.ipc';

export function registerAllIPC() {
  registerFileSystemIPC();
  registerTerminalIPC();
  registerAgentIPC();
  registerSettingsIPC();
  registerAuthIPC();
  registerExtensionIPC();
  registerGitIPC();
  registerMarkdownIPC();
}
