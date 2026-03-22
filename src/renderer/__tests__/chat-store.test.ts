import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../store/chat.store';

const mockAgents = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI models',
    configSchema: [
      { key: 'apiKey', label: 'API Key', type: 'string' as const, required: true, secret: true },
      { key: 'model', label: 'Model', type: 'select' as const, required: true, options: ['gpt-4', 'gpt-3.5-turbo'], default: 'gpt-4' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models',
    configSchema: [
      { key: 'apiKey', label: 'API Key', type: 'string' as const, required: true },
      { key: 'model', label: 'Model', type: 'select' as const, required: true, options: ['claude-3-opus', 'claude-3-sonnet'], default: 'claude-3-sonnet' },
    ],
  },
];

describe('Chat Store', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      agents: [],
      activeAgentId: null,
      activeModel: null,
      isStreaming: false,
      streamingContent: '',
    });
  });

  describe('setAgents', () => {
    it('should set the agents list', () => {
      useChatStore.getState().setAgents(mockAgents);
      expect(useChatStore.getState().agents).toHaveLength(2);
    });
  });

  describe('setActiveAgent', () => {
    it('should set active agent and pick default model', () => {
      useChatStore.getState().setAgents(mockAgents);
      useChatStore.getState().setActiveAgent('openai');
      const state = useChatStore.getState();
      expect(state.activeAgentId).toBe('openai');
      expect(state.activeModel).toBe('gpt-4');
    });

    it('should fall back to first option if no default', () => {
      const agents = [{
        id: 'test',
        name: 'Test',
        description: '',
        configSchema: [
          { key: 'model', label: 'Model', type: 'select' as const, required: true, options: ['model-a', 'model-b'] },
        ],
      }];
      useChatStore.getState().setAgents(agents);
      useChatStore.getState().setActiveAgent('test');
      expect(useChatStore.getState().activeModel).toBe('model-a');
    });
  });

  describe('addMessage', () => {
    it('should append a message', () => {
      useChatStore.getState().addMessage({ role: 'user', content: 'Hello' });
      useChatStore.getState().addMessage({ role: 'assistant', content: 'Hi!' });
      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].content).toBe('Hi!');
    });
  });

  describe('streaming', () => {
    it('should start streaming with empty content', () => {
      useChatStore.getState().setStreaming(true);
      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingContent).toBe('');
    });

    it('should append streaming content', () => {
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().appendStreamContent('Hello');
      useChatStore.getState().appendStreamContent(' world');
      expect(useChatStore.getState().streamingContent).toBe('Hello world');
    });

    it('should finish stream and create assistant message', () => {
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().appendStreamContent('Complete response');
      useChatStore.getState().finishStream();
      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe('');
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual({ role: 'assistant', content: 'Complete response' });
    });

    it('should not create message if stream content is empty', () => {
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().finishStream();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      useChatStore.getState().addMessage({ role: 'user', content: 'test' });
      useChatStore.getState().addMessage({ role: 'assistant', content: 'response' });
      useChatStore.getState().clearMessages();
      expect(useChatStore.getState().messages).toEqual([]);
    });
  });

  describe('getModelsForActiveAgent', () => {
    it('should return model options for active agent', () => {
      useChatStore.getState().setAgents(mockAgents);
      useChatStore.getState().setActiveAgent('anthropic');
      const models = useChatStore.getState().getModelsForActiveAgent();
      expect(models).toEqual(['claude-3-opus', 'claude-3-sonnet']);
    });

    it('should return empty array when no agent is active', () => {
      expect(useChatStore.getState().getModelsForActiveAgent()).toEqual([]);
    });

    it('should return empty array for agent without model field', () => {
      useChatStore.getState().setAgents([{
        id: 'simple',
        name: 'Simple',
        description: '',
        configSchema: [{ key: 'apiKey', label: 'Key', type: 'string' as const, required: true }],
      }]);
      useChatStore.getState().setActiveAgent('simple');
      expect(useChatStore.getState().getModelsForActiveAgent()).toEqual([]);
    });
  });
});
