import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chat.store';

interface ChatPanelProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function ChatPanel({ onClose, onOpenSettings }: ChatPanelProps) {
  const {
    messages, agents, activeAgentId, activeModel, isStreaming, streamingContent,
    addMessage, setAgents, setActiveAgent, setActiveModel, setStreaming,
    appendStreamContent, finishStream, clearMessages, getModelsForActiveAgent,
  } = useChatStore();
  const [input, setInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableModels = getModelsForActiveAgent();

  // Load agents on mount
  useEffect(() => {
    window.lyra.agent.list().then(agentList => {
      setAgents(agentList);
      if (agentList.length > 0 && !activeAgentId) {
        setActiveAgent(agentList[0].id);
      }
    });
  }, []);

  // Check if the active agent has an API key configured
  useEffect(() => {
    if (!activeAgentId || activeAgentId === 'ollama') {
      setHasApiKey(true);
      return;
    }
    window.lyra.settings.get('agentConfigs').then((configs) => {
      const agentConfigs = configs as Record<string, Record<string, unknown>> | undefined;
      const key = agentConfigs?.[activeAgentId]?.apiKey as string | undefined;
      setHasApiKey(!!key);
    });
  }, [activeAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Set up stream listener
  useEffect(() => {
    const cleanup = window.lyra.agent.onStream((chunk) => {
      if (chunk.type === 'text') {
        appendStreamContent(chunk.content);
      } else if (chunk.type === 'done') {
        finishStream();
      } else if (chunk.type === 'error') {
        appendStreamContent(`\n\nError: ${chunk.content}`);
        finishStream();
      }
    });
    return cleanup;
  }, [appendStreamContent, finishStream]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    addMessage({ role: 'user', content: text });
    setInput('');
    setStreaming(true);

    const agentId = useChatStore.getState().activeAgentId;
    const model = useChatStore.getState().activeModel;

    if (!agentId) {
      addMessage({ role: 'assistant', content: 'No AI agent selected. Choose an agent from the dropdown above.' });
      setStreaming(false);
      return;
    }

    try {
      const allMessages = [...useChatStore.getState().messages];
      await window.lyra.agent.send(agentId, allMessages, {
        model: model || undefined,
      });
    } catch (err) {
      addMessage({ role: 'assistant', content: `Error: ${err}` });
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    window.lyra.agent.stop();
    finishStream();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
        userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>AI Chat</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={clearMessages}
              title="Clear chat"
              style={{ color: 'var(--text-muted)', fontSize: 12, padding: '2px 4px' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', fontSize: 16, padding: '0 2px' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Agent + Model selectors */}
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={activeAgentId || ''}
            onChange={(e) => setActiveAgent(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '4px 6px',
              fontSize: 11,
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {availableModels.length > 0 && (
            <select
              value={activeModel || ''}
              onChange={(e) => setActiveModel(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '4px 6px',
                fontSize: 11,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* API Key missing banner */}
      {!hasApiKey && activeAgentId && (
        <div style={{
          margin: '8px 12px 0',
          padding: '10px 14px',
          background: 'rgba(249, 226, 175, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: 8,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span style={{ color: 'var(--warning)' }}>
            API key not configured for {agents.find(a => a.id === activeAgentId)?.name || activeAgentId}.
          </span>
          <button
            onClick={onOpenSettings}
            style={{
              padding: '4px 12px',
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Configure
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.length === 0 && !isStreaming && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
            <div style={{ marginBottom: 8 }}>Send a message to start chatting.</div>
            <div style={{ fontSize: 11 }}>
              Agent: <strong>{agents.find(a => a.id === activeAgentId)?.name || 'None'}</strong>
              {activeModel && <> &middot; Model: <strong>{activeModel}</strong></>}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
            background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-surface)',
            color: msg.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.content}
          </div>
        ))}
        {isStreaming && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
            background: 'var(--bg-surface)',
            alignSelf: 'flex-start',
            maxWidth: '85%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {streamingContent || '...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send)"
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 6,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              style={{
                padding: '8px 16px',
                background: 'var(--error)',
                color: 'var(--bg-primary)',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                alignSelf: 'flex-end',
              }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                padding: '8px 16px',
                background: !input.trim() ? 'var(--bg-hover)' : 'var(--accent)',
                color: !input.trim() ? 'var(--text-muted)' : 'var(--bg-primary)',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                alignSelf: 'flex-end',
              }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
