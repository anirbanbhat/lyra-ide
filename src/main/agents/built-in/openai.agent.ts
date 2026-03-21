import type { AgentProvider } from '../types';
import type { AgentMessage, AgentStreamChunk, AgentConfigField, AgentRequestOptions } from '@shared/types/agent.types';

export class OpenAIAgent implements AgentProvider {
  id = 'openai';
  name = 'OpenAI';
  description = 'GPT-4o, GPT-4, GPT-3.5 and other OpenAI models';

  configSchema: AgentConfigField[] = [
    { key: 'apiKey', label: 'API Key', type: 'string', required: true, secret: true },
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      required: true,
      options: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
      default: 'gpt-4o',
    },
    { key: 'baseUrl', label: 'Base URL (optional)', type: 'string', required: false, default: 'https://api.openai.com/v1' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'number', required: false, default: 4096 },
    { key: 'temperature', label: 'Temperature', type: 'number', required: false, default: 0.7 },
  ];

  private apiKey = '';
  private model = 'gpt-4o';
  private baseUrl = 'https://api.openai.com/v1';
  private maxTokens = 4096;
  private temperature = 0.7;

  async initialize(config: Record<string, unknown>) {
    this.apiKey = (config.apiKey as string) || '';
    this.model = (config.model as string) || 'gpt-4o';
    this.baseUrl = (config.baseUrl as string) || 'https://api.openai.com/v1';
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
      yield { type: 'error', content: 'OpenAI API key not configured. Go to Settings > AI Agents to add your key.' };
      yield { type: 'done', content: '' };
      return;
    }

    const body = {
      model: options?.model || this.model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: options?.maxTokens || this.maxTokens,
      temperature: options?.temperature ?? this.temperature,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        yield { type: 'error', content: `OpenAI API error (${response.status}): ${err}` };
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
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: 'text', content };
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
