import React, { useEffect, useState } from 'react';
import { usePythonStore } from '../../store/python.store';
import { useFileTreeStore } from '../../store/file-tree.store';
import { TestExplorer } from './TestExplorer';
import { EnvironmentSelector } from './EnvironmentSelector';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function PythonPanel() {
  const { activeView, setActiveView, loading } = usePythonStore();
  const rootPath = useFileTreeStore(s => s.rootPath);

  const tabs = [
    { id: 'environments' as const, label: 'Environments' },
    { id: 'tests' as const, label: 'Tests' },
    { id: 'diagnostics' as const, label: 'Diagnostics' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border)',
      }}>
        Python
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              flex: 1,
              padding: '6px 8px',
              color: activeView === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeView === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              fontSize: 12,
              fontWeight: activeView === tab.id ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && (
          <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
            Loading...
          </div>
        )}
        {activeView === 'environments' && <EnvironmentSelector cwd={rootPath} />}
        {activeView === 'tests' && <TestExplorer cwd={rootPath} />}
        {activeView === 'diagnostics' && <DiagnosticsPanel />}
      </div>
    </div>
  );
}
