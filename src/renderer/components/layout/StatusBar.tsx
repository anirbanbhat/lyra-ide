import React from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePythonStore } from '../../store/python.store';

interface StatusBarProps {
  showChat: boolean;
  showTerminal: boolean;
  onToggleChat: () => void;
  onToggleTerminal: () => void;
}

export function StatusBar({ showChat, showTerminal, onToggleChat, onToggleTerminal }: StatusBarProps) {
  const activeTab = useEditorStore(s => s.tabs.find(t => t.path === s.activeTabPath));
  const activeEnvPath = usePythonStore(s => s.activeEnvPath);
  const diagnostics = usePythonStore(s => s.diagnostics);
  const isPython = activeTab?.language === 'python';
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warnCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div style={{
      height: 'var(--statusbar-height)',
      background: 'var(--bg-tertiary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      fontSize: 12,
      color: 'var(--text-muted)',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {activeTab && (
          <>
            <span>{activeTab.language}</span>
            <span>{activeTab.isDirty ? 'Modified' : 'Saved'}</span>
            {isPython && (errorCount > 0 || warnCount > 0) && (
              <span>
                {errorCount > 0 && <span style={{ color: '#f38ba8' }}>{errorCount} errors</span>}
                {errorCount > 0 && warnCount > 0 && ' '}
                {warnCount > 0 && <span style={{ color: '#f9e2af' }}>{warnCount} warnings</span>}
              </span>
            )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {isPython && activeEnvPath && (
          <span style={{ color: 'var(--accent)', fontSize: 11 }} title={activeEnvPath}>
            Python: {activeEnvPath.split('/').slice(-3).join('/')}
          </span>
        )}
        <StatusButton active={showTerminal} onClick={onToggleTerminal} label="Terminal" />
        <StatusButton active={showChat} onClick={onToggleChat} label="AI Chat" />
        <span>Lyra v0.1.1</span>
      </div>
    </div>
  );
}

function StatusButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        padding: '2px 8px',
        borderRadius: 3,
        transition: 'color 0.15s',
      }}
      onMouseOver={e => (e.currentTarget.style.color = 'var(--accent)')}
      onMouseOut={e => (e.currentTarget.style.color = active ? 'var(--accent)' : 'var(--text-muted)')}
    >
      {label}
    </button>
  );
}
