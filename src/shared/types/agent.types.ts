export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentStreamChunk {
  type: 'text' | 'error' | 'done';
  content: string;
}

export interface AgentConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  secret?: boolean;
  options?: string[];
  default?: unknown;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  configSchema: AgentConfigField[];
}

export interface AgentRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}
