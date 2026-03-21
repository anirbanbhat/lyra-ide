import type { AgentProvider } from './types';

class AgentRegistry {
  private agents = new Map<string, AgentProvider>();

  register(agent: AgentProvider) {
    this.agents.set(agent.id, agent);
  }

  unregister(id: string) {
    const agent = this.agents.get(id);
    agent?.dispose?.();
    this.agents.delete(id);
  }

  get(id: string): AgentProvider | undefined {
    return this.agents.get(id);
  }

  getAll(): AgentProvider[] {
    return Array.from(this.agents.values());
  }

  has(id: string): boolean {
    return this.agents.has(id);
  }
}

export const agentRegistry = new AgentRegistry();
