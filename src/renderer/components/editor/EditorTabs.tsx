import React from 'react';
import { useEditorStore } from '../../store/editor.store';

export function EditorTabs() {
  const { tabs, activeTabPath, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      overflow: 'auto',
      flexShrink: 0,
    }}>
      {tabs.map(tab => (
        <div
          key={tab.path}
          onClick={() => setActiveTab(tab.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 12,
            cursor: 'pointer',
            background: tab.path === activeTabPath ? 'var(--tab-active)' : 'var(--tab-inactive)',
            borderRight: '1px solid var(--border)',
            borderBottom: tab.path === activeTabPath ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab.path === activeTabPath ? 'var(--text-primary)' : 'var(--text-secondary)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{tab.name}</span>
          {tab.isDirty && (
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent)',
              flexShrink: 0,
            }} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 3,
              fontSize: 14,
              lineHeight: 1,
              color: 'var(--text-muted)',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
