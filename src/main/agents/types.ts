import type { AgentMessage, AgentStreamChunk, AgentConfigField, AgentRequestOptions, AgentInfo } from '@shared/types/agent.types';

export interface AgentProvider {
  /** Unique identifier */
  id: string;
  /** Display name in UI */
  name: string;
  /** Description for agent selector */
  description: string;
  /** Configuration schema - drives the settings UI dynamically */
  configSchema: AgentConfigField[];

  /** Initialize with user-provided config (API keys, model params, etc.) */
  initialize(config: Record<string, unknown>): Promise<void>;

  /** Check if the agent is properly configured and ready */
  isReady(): boolean;

  /** Send a message and stream the response token by token */
  streamMessage(
    messages: AgentMessage[],
    options?: AgentRequestOptions
  ): AsyncIterable<AgentStreamChunk>;

  /** Optional: dispose resources */
  dispose?(): Promise<void>;
}

export function toAgentInfo(provider: AgentProvider): AgentInfo {
  return {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    configSchema: provider.configSchema,
  };
}
