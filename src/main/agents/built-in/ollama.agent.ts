import type { AgentProvider } from '../types';
import type { AgentMessage, AgentStreamChunk, AgentConfigField, AgentRequestOptions } from '@shared/types/agent.types';

export class OllamaAgent implements AgentProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  description = 'Run local models via Ollama - no API key needed';

  configSchema: AgentConfigField[] = [
    { key: 'baseUrl', label: 'Ollama URL', type: 'string', required: false, default: 'http://localhost:11434' },
    { key: 'model', label: 'Model', type: 'string', required: true, default: 'llama3.2' },
    { key: 'temperature', label: 'Temperature', type: 'number', required: false, default: 0.7 },
  ];

  private baseUrl = 'http://localhost:11434';
  private model = 'llama3.2';
  private temperature = 0.7;

  async initialize(config: Record<string, unknown>) {
    this.baseUrl = (config.baseUrl as string) || 'http://localhost:11434';
    this.model = (config.model as string) || 'llama3.2';
    this.temperature = (config.temperature as number) || 0.7;
  }

  isReady(): boolean {
    return !!this.model;
  }

  async *streamMessage(
    messages: AgentMessage[],
    options?: AgentRequestOptions
  ): AsyncIterable<AgentStreamChunk> {
    const body = {
      model: options?.model || this.model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      options: {
        temperature: options?.temperature ?? this.temperature,
        ...(options?.maxTokens ? { num_predict: options.maxTokens } : {}),
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        yield { type: 'error', content: `Ollama error (${response.status}): ${err}. Make sure Ollama is running.` };
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
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              yield { type: 'text', content: parsed.message.content };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      yield { type: 'done', content: '' };
    } catch (err) {
      yield { type: 'error', content: `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running.` };
      yield { type: 'done', content: '' };
    }
  }
}
