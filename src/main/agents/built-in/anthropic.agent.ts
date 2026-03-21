import type { AgentProvider } from '../types';
import type { AgentMessage, AgentStreamChunk, AgentConfigField, AgentRequestOptions } from '@shared/types/agent.types';

export class AnthropicAgent implements AgentProvider {
  id = 'anthropic';
  name = 'Anthropic';
  description = 'Claude 4.5/4.6 Opus, Sonnet, Haiku and other Anthropic models';

  configSchema: AgentConfigField[] = [
    { key: 'apiKey', label: 'API Key', type: 'string', required: true, secret: true },
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      required: true,
      options: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250514'],
      default: 'claude-sonnet-4-6',
    },
    { key: 'maxTokens', label: 'Max Tokens', type: 'number', required: false, default: 4096 },
    { key: 'temperature', label: 'Temperature', type: 'number', required: false, default: 0.7 },
  ];

  private apiKey = '';
  private model = 'claude-sonnet-4-6';
  private maxTokens = 4096;
  private temperature = 0.7;

  async initialize(config: Record<string, unknown>) {
    this.apiKey = (config.apiKey as string) || '';
    this.model = (config.model as string) || 'claude-sonnet-4-6';
    this.maxTokens = (config.maxTokens as number) || 4096;
    this.temperature = (config.temperature as number) || 0.7;
  }

  isReady(): boolean {
    return !!this.apiKey;
  }

  async *streamMessage(
    messages: AgentMessage[],
    options?: AgentRequestOptions
  ): AsyncIterable<AgentStreamChunk> {
    if (!this.apiKey) {
      yield { type: 'error', content: 'Anthropic API key not configured. Go to Settings > AI Agents to add your key.' };
      yield { type: 'done', content: '' };
      return;
    }

    const systemPrompt = options?.systemPrompt || 'You are a helpful coding assistant integrated in the Lyra IDE.';

    const body = {
      model: options?.model || this.model,
      max_tokens: options?.maxTokens || this.maxTokens,
      temperature: options?.temperature ?? this.temperature,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        yield { type: 'error', content: `Anthropic API error (${response.status}): ${err}` };
        yield { type: 'done', content: '' };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', content: 'No response body' };
        yield { type: 'done', content: '' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'text', content: parsed.delta.text };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      yield { type: 'done', content: '' };
    } catch (err) {
      yield { type: 'error', content: `Network error: ${err}` };
      yield { type: 'done', content: '' };
    }
  }
}
