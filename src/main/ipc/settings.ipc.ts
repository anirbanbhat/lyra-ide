import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { IPC } from '@shared/ipc-channels';
import { agentRegistry } from '../agents/registry';

const settingsPath = path.join(os.homedir(), '.lyra', 'settings.json');
let settings: Record<string, unknown> = {};

async function loadSettings() {
  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    settings = JSON.parse(content);
  } catch {
    settings = {};
  }
}

async function saveSettings() {
  const dir = path.dirname(settingsPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

async function initializeAgentsFromConfig() {
  const configs = settings.agentConfigs as Record<string, Record<string, unknown>> | undefined;
  if (!configs) return;

  for (const [agentId, config] of Object.entries(configs)) {
    const agent = agentRegistry.get(agentId);
    if (agent && config) {
      try {
        await agent.initialize(config);
      } catch (err) {
        console.warn(`Failed to initialize agent ${agentId}:`, err);
      }
    }
  }
}

export function registerSettingsIPC() {
  // Load settings from disk on startup
  loadSettings().then(() => {
    // Initialize agents with saved configs after a short delay (wait for agents to be registered)
    setTimeout(initializeAgentsFromConfig, 500);
  });

  ipcMain.handle(IPC.SETTINGS_GET, async (_event, key?: string) => {
    if (key) return settings[key];
    return settings;
  });

  ipcMain.handle(IPC.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    settings[key] = value;
    await saveSettings();

    // Re-initialize agents if agent configs changed
    if (key === 'agentConfigs') {
      await initializeAgentsFromConfig();
    }
  });

  ipcMain.handle(IPC.SETTINGS_GET_ALL, async () => {
    return settings;
  });
}
