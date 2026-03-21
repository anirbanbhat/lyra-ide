# Creating Custom AI Agents

You can create custom AI agent plugins that appear in Lyra's agent selector.

## Directory Structure

```
~/.lyra/agents/
  my-agent/
    package.json
    index.js
```

## Agent Manifest (package.json)

```json
{
  "name": "my-custom-agent",
  "version": "1.0.0",
  "description": "My custom AI agent",
  "main": "index.js",
  "lyra-agent": true,
  "license": "MIT"
}
```

The key field is `"lyra-agent": true` — this tells Lyra to load it as an agent plugin.

## Agent Implementation (index.js)

Your agent must export an object implementing the `AgentProvider` interface:

```javascript
module.exports = {
  // Required: unique identifier
  id: 'my-agent',

  // Required: display name shown in the dropdown
  name: 'My Agent',

  // Required: description shown in settings
  description: 'A custom AI agent',

  // Required: configuration fields for the settings UI
  configSchema: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'string',    // 'string' | 'number' | 'boolean' | 'select'
      required: true,
      secret: true,       // Masks the input
    },
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      required: true,
      options: ['model-a', 'model-b'],
      default: 'model-a',
    },
  ],

  // Called with user config from settings
  async initialize(config) {
    this._apiKey = config.apiKey;
    this._model = config.model;
  },

  // Returns true if the agent is ready to use
  isReady() {
    return !!this._apiKey;
  },

  // Async generator that yields stream chunks
  async *streamMessage(messages, options) {
    // messages: Array of { role: 'user' | 'assistant', content: string }
    // options: { model?, maxTokens?, temperature?, systemPrompt? }

    // Your API call logic here...
    // Yield chunks as you receive them:

    yield { type: 'text', content: 'Hello ' };
    yield { type: 'text', content: 'World!' };
    yield { type: 'done', content: '' };

    // On error:
    // yield { type: 'error', content: 'Something went wrong' };
    // yield { type: 'done', content: '' };
  },
};
```

## Stream Chunk Types

| Type | Description |
|------|-------------|
| `text` | Partial text content to append to the response |
| `done` | Signals the response is complete |
| `error` | Error message to display |

## Example

See the [example agent](../agents/example-agent/) for a working reference implementation.
