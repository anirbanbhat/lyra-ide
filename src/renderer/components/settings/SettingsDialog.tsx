import React, { useState, useEffect } from 'react';
import type { AgentInfo, AgentConfigField } from '@shared/types/agent.types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'agents';

const SIGN_IN_URLS: Record<string, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
};

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('agents');
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentConfigs, setAgentConfigs] = useState<Record<string, Record<string, unknown>>>({});
  const [saved, setSaved] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    window.lyra.agent.list().then(setAgents);
    window.lyra.settings.get('agentConfigs').then((configs) => {
      if (configs && typeof configs === 'object') {
        setAgentConfigs(configs as Record<string, Record<string, unknown>>);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Listen for key received from auth callback
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = window.lyra.auth.onKeyReceived((key: string) => {
      if (selectedAgentId) {
        handleConfigChange(selectedAgentId, 'apiKey', key);
        setSigningIn(false);
      }
    });
    return cleanup;
  }, [isOpen, selectedAgentId]);

  if (!isOpen) return null;

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const hasSignIn = selectedAgentId ? !!SIGN_IN_URLS[selectedAgentId] : false;
  const currentApiKey = selectedAgentId ? (agentConfigs[selectedAgentId]?.apiKey as string) || '' : '';

  const handleConfigChange = (agentId: string, key: string, value: unknown) => {
    setAgentConfigs(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], [key]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    await window.lyra.settings.set('agentConfigs', agentConfigs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignIn = async () => {
    if (!selectedAgentId || !SIGN_IN_URLS[selectedAgentId]) return;

    setSigningIn(true);

    try {
      // Start local callback server
      const port = await window.lyra.auth.startCallbackServer();

      // Open the provider's API key page in the browser
      // Also open our local paste page so the user can paste the key
      await window.lyra.auth.openUrl(SIGN_IN_URLS[selectedAgentId]);

      // Small delay then open the paste page
      setTimeout(async () => {
        await window.lyra.auth.openUrl(`http://localhost:${port}`);
      }, 1000);
    } catch (err) {
      console.error('Sign in failed:', err);
      setSigningIn(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 700,
        maxHeight: '80vh',
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Settings</h2>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{
            width: 160,
            borderRight: '1px solid var(--border)',
            padding: '8px 0',
          }}>
            {(['agents', 'general'] as SettingsTab[]).map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                  background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
                  borderLeft: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'agents' ? 'AI Agents' : 'General'}
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
            {activeTab === 'agents' && (
              <div>
                {/* Agent selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 13,
                        background: selectedAgentId === agent.id ? 'var(--accent)' : 'var(--bg-surface)',
                        color: selectedAgentId === agent.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {agent.name}
                    </button>
                  ))}
                </div>

                {/* Agent config form */}
                {selectedAgent && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      {selectedAgent.description}
                    </p>

                    {/* Sign in button for providers that support it */}
                    {hasSignIn && (
                      <div style={{
                        padding: 16,
                        background: 'var(--bg-surface)',
                        borderRadius: 8,
                        marginBottom: 16,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                              {currentApiKey ? 'Connected' : 'Sign in to get your API key'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {currentApiKey
                                ? `API key: ${currentApiKey.substring(0, 12)}...`
                                : 'Opens your browser to get an API key from the provider'
                              }
                            </div>
                          </div>
                          <button
                            onClick={handleSignIn}
                            disabled={signingIn}
                            style={{
                              padding: '8px 20px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              background: currentApiKey ? 'var(--bg-hover)' : 'var(--accent)',
                              color: currentApiKey ? 'var(--text-primary)' : 'var(--bg-primary)',
                              border: currentApiKey ? '1px solid var(--border)' : 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {signingIn ? 'Waiting...' : currentApiKey ? 'Reconnect' : `Sign in to ${selectedAgent.name}`}
                          </button>
                        </div>
                        {signingIn && (
                          <div style={{
                            fontSize: 12,
                            color: 'var(--warning)',
                            marginTop: 8,
                            padding: '8px 12px',
                            background: 'rgba(249, 226, 175, 0.1)',
                            borderRadius: 4,
                          }}>
                            A browser window has opened. Copy your API key from the provider's console,
                            then paste it in the Lyra page that opened in your browser.
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {selectedAgent.configSchema.map(field => (
                        <ConfigField
                          key={field.key}
                          field={field}
                          value={agentConfigs[selectedAgent.id]?.[field.key] ?? field.default ?? ''}
                          onChange={(value) => handleConfigChange(selectedAgent.id, field.key, value)}
                        />
                      ))}
                    </div>

                    {!hasSignIn && selectedAgentId === 'ollama' && (
                      <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: 'var(--bg-surface)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}>
                        Ollama runs locally — no API key needed. Make sure Ollama is running on your machine.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'general' && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                <p>General settings will be available in a future update.</p>
                <p style={{ marginTop: 12 }}>
                  Keyboard shortcuts:
                </p>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ShortcutRow keys="Cmd+S" action="Save file" />
                  <ShortcutRow keys="Cmd+O" action="Open file" />
                  <ShortcutRow keys="Cmd+Shift+O" action="Open folder" />
                  <ShortcutRow keys="Cmd+Shift+N" action="New project" />
                  <ShortcutRow keys="Cmd+`" action="Toggle terminal" />
                  <ShortcutRow keys="Cmd+B" action="Toggle AI chat" />
                  <ShortcutRow keys="Cmd+," action="Open settings" />
                  <ShortcutRow keys="Cmd+Shift+X" action="Toggle extensions" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          {saved && <span style={{ color: 'var(--success)', fontSize: 13, alignSelf: 'center' }}>Saved!</span>}
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: AgentConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
        {field.label} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
      </label>
      {field.type === 'select' ? (
        <select
          value={String(value)}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        >
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'boolean' ? (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(e.target.checked)}
        />
      ) : (
        <input
          type={field.secret ? 'password' : field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.secret ? 'sk-...' : ''}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: 13,
          }}
        />
      )}
    </div>
  );
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{action}</span>
      <kbd style={{ padding: '2px 8px', background: 'var(--bg-surface)', borderRadius: 3, fontSize: 12 }}>{keys}</kbd>
    </div>
  );
}
