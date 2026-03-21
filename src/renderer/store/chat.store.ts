import { create } from 'zustand';
import type { AgentMessage, AgentInfo } from '@shared/types/agent.types';

interface ChatState {
  messages: AgentMessage[];
  agents: AgentInfo[];
  activeAgentId: string | null;
  activeModel: string | null;
  isStreaming: boolean;
  streamingContent: string;
  setAgents: (agents: AgentInfo[]) => void;
  setActiveAgent: (id: string) => void;
  setActiveModel: (model: string) => void;
  addMessage: (message: AgentMessage) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamContent: (content: string) => void;
  finishStream: () => void;
  clearMessages: () => void;
  getModelsForActiveAgent: () => string[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  agents: [],
  activeAgentId: null,
  activeModel: null,
  isStreaming: false,
  streamingContent: '',

  setAgents: (agents) => set({ agents }),

  setActiveAgent: (id) => {
    const agent = get().agents.find(a => a.id === id);
    const modelField = agent?.configSchema.find(f => f.key === 'model');
    const defaultModel = modelField?.default as string || modelField?.options?.[0] || null;
    set({ activeAgentId: id, activeModel: defaultModel });
  },

  setActiveModel: (model) => set({ activeModel: model }),

  addMessage: (message) => set(state => ({
    messages: [...state.messages, message],
  })),

  setStreaming: (streaming) => set({ isStreaming: streaming, streamingContent: '' }),

  appendStreamContent: (content) => set(state => ({
    streamingContent: state.streamingContent + content,
  })),

  finishStream: () => {
    const content = get().streamingContent;
    if (content) {
      set(state => ({
        messages: [...state.messages, { role: 'assistant', content }],
        isStreaming: false,
        streamingContent: '',
      }));
    } else {
      set({ isStreaming: false, streamingContent: '' });
    }
  },

  clearMessages: () => set({ messages: [] }),

  getModelsForActiveAgent: () => {
    const { agents, activeAgentId } = get();
    const agent = agents.find(a => a.id === activeAgentId);
    if (!agent) return [];
    const modelField = agent.configSchema.find(f => f.key === 'model');
    return modelField?.options || [];
  },
}));
