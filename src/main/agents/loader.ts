import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { agentRegistry } from './registry';
import { OpenAIAgent } from './built-in/openai.agent';
import { AnthropicAgent } from './built-in/anthropic.agent';
import { OllamaAgent } from './built-in/ollama.agent';
import type { AgentProvider } from './types';
import { AGENTS_DIR } from '@shared/constants';

export async function loadBuiltInAgents() {
  agentRegistry.register(new OpenAIAgent());
  agentRegistry.register(new AnthropicAgent());
  agentRegistry.register(new OllamaAgent());
}

export async function loadUserAgents() {
  const agentsDir = path.join(os.homedir(), AGENTS_DIR);

  try {
    await fs.access(agentsDir);
  } catch {
    // Agents directory doesn't exist yet — that's fine
    return;
  }

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const agentDir = path.join(agentsDir, entry.name);
    const pkgPath = path.join(agentDir, 'package.json');

    try {
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      if (!pkg['lyra-agent']) {
        console.warn(`Skipping ${entry.name}: missing "lyra-agent": true in package.json`);
        continue;
      }

      const mainFile = path.join(agentDir, pkg.main || 'index.js');
      const mod = require(mainFile);
      const agent: AgentProvider = mod.default || mod;

      // Validate the agent conforms to the interface
      if (!agent.id || !agent.name || !agent.streamMessage) {
        console.warn(`Skipping ${entry.name}: does not implement AgentProvider interface`);
        continue;
      }

      agentRegistry.register(agent);
      console.log(`Loaded user agent: ${agent.name} (${agent.id})`);
    } catch (err) {
      console.warn(`Failed to load agent from ${entry.name}:`, err);
    }
  }
}

export async function loadAllAgents() {
  await loadBuiltInAgents();
  await loadUserAgents();
}
