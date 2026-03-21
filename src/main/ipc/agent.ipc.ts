import { ipcMain, BrowserWindow } from 'electron';
import { IPC } from '@shared/ipc-channels';
import { agentRegistry } from '../agents/registry';
import { toAgentInfo } from '../agents/types';
import { loadAllAgents } from '../agents/loader';
import type { AgentMessage, AgentRequestOptions } from '@shared/types/agent.types';

let abortController: AbortController | null = null;

export function registerAgentIPC() {
  // Load agents on startup
  loadAllAgents().catch(err => console.error('Failed to load agents:', err));

  ipcMain.handle(IPC.AGENT_LIST, async () => {
    return agentRegistry.getAll().map(toAgentInfo);
  });

  ipcMain.handle(
    IPC.AGENT_SEND,
    async (event, agentId: string, messages: AgentMessage[], options?: AgentRequestOptions) => {
      const agent = agentRegistry.get(agentId);
      if (!agent) {
        const win = BrowserWindow.fromWebContents(event.sender);
        win?.webContents.send(IPC.AGENT_STREAM, { type: 'error', content: `Agent "${agentId}" not found` });
        win?.webContents.send(IPC.AGENT_STREAM, { type: 'done', content: '' });
        return;
      }

      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;

      abortController = new AbortController();

      try {
        for await (const chunk of agent.streamMessage(messages, options)) {
          if (abortController.signal.aborted) break;
          win.webContents.send(IPC.AGENT_STREAM, chunk);
        }
      } catch (err) {
        win.webContents.send(IPC.AGENT_STREAM, {
          type: 'error',
          content: `Agent error: ${err}`,
        });
        win.webContents.send(IPC.AGENT_STREAM, { type: 'done', content: '' });
      } finally {
        abortController = null;
      }
    }
  );

  ipcMain.on(IPC.AGENT_STOP, () => {
    abortController?.abort();
    abortController = null;
  });

  // Get current config for an agent (to read its current model, etc.)
  ipcMain.handle(IPC.AGENT_GET_CONFIG, async (_event, agentId: string) => {
    const agent = agentRegistry.get(agentId);
    if (!agent) return null;
    // Return the agent info which includes configSchema with defaults
    return toAgentInfo(agent);
  });

  // Set model for a specific agent at runtime
  ipcMain.handle(IPC.AGENT_SET_MODEL, async (_event, agentId: string, model: string) => {
    const agent = agentRegistry.get(agentId);
    if (!agent) return;
    // Re-initialize with the updated model
    // We need to read existing config from settings and merge the new model
    const settingsIpc = require('./settings.ipc');
    // Just call initialize with the model change - agent will use it
    await agent.initialize({ ...(agent as any), model });
  });
}
