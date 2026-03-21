import React from 'react';
import { useEditorStore } from '../../store/editor.store';

interface StatusBarProps {
  showChat: boolean;
  showTerminal: boolean;
  onToggleChat: () => void;
  onToggleTerminal: () => void;
}

export function StatusBar({ showChat, showTerminal, onToggleChat, onToggleTerminal }: StatusBarProps) {
  const activeTab = useEditorStore(s => s.tabs.find(t => t.path === s.activeTabPath));

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
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatusButton active={showTerminal} onClick={onToggleTerminal} label="Terminal" />
        <StatusButton active={showChat} onClick={onToggleChat} label="AI Chat" />
        <span>Lyra v0.1.0</span>
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
