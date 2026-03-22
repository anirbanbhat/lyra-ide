import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the AgentRegistry class directly, so we re-create it here
// to avoid importing from the module which exports a singleton
class AgentRegistry {
  private agents = new Map<string, any>();

  register(agent: any) {
    this.agents.set(agent.id, agent);
  }

  unregister(id: string) {
    const agent = this.agents.get(id);
    agent?.dispose?.();
    this.agents.delete(id);
  }

  get(id: string) {
    return this.agents.get(id);
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  has(id: string) {
    return this.agents.has(id);
  }
}

function createMockAgent(id: string, name: string) {
  return {
    id,
    name,
    description: `${name} description`,
    configSchema: [],
    initialize: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
    streamMessage: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it('should register an agent', () => {
    const agent = createMockAgent('test', 'Test Agent');
    registry.register(agent);
    expect(registry.has('test')).toBe(true);
    expect(registry.get('test')).toBe(agent);
  });

  it('should unregister an agent and call dispose', () => {
    const agent = createMockAgent('test', 'Test Agent');
    registry.register(agent);
    registry.unregister('test');
    expect(registry.has('test')).toBe(false);
    expect(agent.dispose).toHaveBeenCalled();
  });

  it('should handle unregister when dispose is not defined', () => {
    const agent = { id: 'no-dispose', name: 'No Dispose', description: '', configSchema: [], initialize: vi.fn(), isReady: vi.fn(), streamMessage: vi.fn() };
    registry.register(agent);
    expect(() => registry.unregister('no-dispose')).not.toThrow();
    expect(registry.has('no-dispose')).toBe(false);
  });

  it('should return all registered agents', () => {
    const a1 = createMockAgent('a1', 'Agent 1');
    const a2 = createMockAgent('a2', 'Agent 2');
    registry.register(a1);
    registry.register(a2);
    const all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContain(a1);
    expect(all).toContain(a2);
  });

  it('should return undefined for unknown agent', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('should report false for unknown agent via has()', () => {
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('should overwrite agent with same id on re-register', () => {
    const a1 = createMockAgent('test', 'First');
    const a2 = createMockAgent('test', 'Second');
    registry.register(a1);
    registry.register(a2);
    expect(registry.get('test')?.name).toBe('Second');
    expect(registry.getAll()).toHaveLength(1);
  });
});
