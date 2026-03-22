import { describe, it, expect } from 'vitest';
import { toAgentInfo } from '../agents/types';

describe('toAgentInfo', () => {
  it('should extract id, name, description, and configSchema', () => {
    const provider = {
      id: 'openai',
      name: 'OpenAI',
      description: 'OpenAI GPT models',
      configSchema: [
        { key: 'apiKey', label: 'API Key', type: 'string' as const, required: true, secret: true },
        { key: 'model', label: 'Model', type: 'select' as const, required: true, options: ['gpt-4', 'gpt-3.5-turbo'], default: 'gpt-4' },
      ],
      initialize: async () => {},
      isReady: () => true,
      streamMessage: async function* () {},
    };

    const info = toAgentInfo(provider);
    expect(info.id).toBe('openai');
    expect(info.name).toBe('OpenAI');
    expect(info.description).toBe('OpenAI GPT models');
    expect(info.configSchema).toHaveLength(2);
    expect(info.configSchema[0].key).toBe('apiKey');
  });

  it('should not include initialize, isReady, or streamMessage', () => {
    const provider = {
      id: 'test',
      name: 'Test',
      description: 'Test agent',
      configSchema: [],
      initialize: async () => {},
      isReady: () => false,
      streamMessage: async function* () {},
    };

    const info = toAgentInfo(provider);
    expect(info).not.toHaveProperty('initialize');
    expect(info).not.toHaveProperty('isReady');
    expect(info).not.toHaveProperty('streamMessage');
  });
});
