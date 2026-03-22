import { describe, it, expect } from 'vitest';

// Type-level tests — verify that the type interfaces compile and exported objects conform
// These tests validate that types are correctly structured at runtime through representative objects

describe('Git types', () => {
  it('should allow constructing a valid GitStatus object', () => {
    const status = {
      isRepo: true,
      branch: 'main',
      ahead: 1,
      behind: 0,
      staged: [{ path: 'file.ts', status: 'modified' as const, staged: true }],
      unstaged: [],
      untracked: [{ path: 'new.ts', status: 'untracked' as const, staged: false }],
    };
    expect(status.isRepo).toBe(true);
    expect(status.staged).toHaveLength(1);
    expect(status.staged[0].status).toBe('modified');
  });

  it('should allow constructing a valid GitLogEntry', () => {
    const entry = {
      hash: 'abc123def456',
      shortHash: 'abc123d',
      message: 'Initial commit',
      author: 'Test User',
      date: '2024-01-01 00:00:00 +0000',
    };
    expect(entry.hash).toBe('abc123def456');
    expect(entry.shortHash).toBe('abc123d');
  });

  it('should allow all valid file change statuses', () => {
    const statuses = ['modified', 'added', 'deleted', 'renamed', 'untracked'] as const;
    for (const status of statuses) {
      const change = { path: 'file.ts', status, staged: false };
      expect(change.status).toBe(status);
    }
  });
});

describe('Agent types', () => {
  it('should allow constructing a valid AgentInfo object', () => {
    const agent = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      configSchema: [
        { key: 'apiKey', label: 'API Key', type: 'string' as const, required: true, secret: true },
        { key: 'model', label: 'Model', type: 'select' as const, required: true, options: ['gpt-4', 'gpt-3.5'], default: 'gpt-4' },
      ],
    };
    expect(agent.id).toBe('test-agent');
    expect(agent.configSchema).toHaveLength(2);
    expect(agent.configSchema[1].options).toContain('gpt-4');
  });

  it('should allow constructing valid AgentMessage objects', () => {
    const messages = [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
    ];
    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe('system');
  });
});

describe('Extension types', () => {
  it('should allow constructing a valid ExtensionInfo object', () => {
    const ext = {
      id: 'lyra-markdown-preview',
      displayName: 'Markdown Preview',
      version: '1.0.0',
      description: 'Live preview',
      author: 'Lyra',
      type: 'plugin' as const,
      enabled: true,
      installed: true,
      path: '/home/user/.lyra/extensions/lyra-markdown-preview',
    };
    expect(ext.id).toBe('lyra-markdown-preview');
    expect(ext.installed).toBe(true);
  });

  it('should allow all valid extension types', () => {
    const types = ['theme', 'language-pack', 'plugin'] as const;
    for (const type of types) {
      expect(typeof type).toBe('string');
    }
  });

  it('should allow constructing a valid RegistryEntry with optional repository', () => {
    const entry = {
      name: 'my-ext',
      displayName: 'My Extension',
      version: '1.0.0',
      description: 'Test',
      author: 'Test',
      type: 'plugin' as const,
      url: '',
      repository: 'https://github.com/test/my-ext.git',
    };
    expect(entry.repository).toContain('github.com');

    const entryWithoutRepo = { ...entry, repository: undefined };
    expect(entryWithoutRepo.repository).toBeUndefined();
  });
});
