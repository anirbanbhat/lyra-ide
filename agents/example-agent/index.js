/**
 * Example Lyra IDE Agent Plugin
 *
 * This demonstrates how to create a custom AI agent for Lyra.
 * To install: copy this directory to ~/.lyra/agents/example-agent/
 *
 * The agent must export an object implementing the AgentProvider interface:
 * - id: unique identifier
 * - name: display name
 * - description: shown in agent selector
 * - configSchema: array of config fields (drives the settings UI)
 * - initialize(config): called with user-provided config
 * - isReady(): returns true if agent is configured
 * - streamMessage(messages, options): async generator yielding { type, content } chunks
 */

module.exports = {
  id: 'example-echo',
  name: 'Echo Bot (Example)',
  description: 'A simple example agent that echoes your messages back',

  configSchema: [
    {
      key: 'prefix',
      label: 'Response Prefix',
      type: 'string',
      required: false,
      default: 'Echo:',
    },
  ],

  _prefix: 'Echo:',

  async initialize(config) {
    this._prefix = config.prefix || 'Echo:';
  },

  isReady() {
    return true;
  },

  async *streamMessage(messages) {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      yield { type: 'error', content: 'No message to echo' };
      yield { type: 'done', content: '' };
      return;
    }

    const response = `${this._prefix} ${lastMessage.content}`;

    // Simulate streaming by yielding one word at a time
    const words = response.split(' ');
    for (const word of words) {
      yield { type: 'text', content: word + ' ' };
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    yield { type: 'done', content: '' };
  },
};
