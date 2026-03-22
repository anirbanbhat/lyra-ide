import React from 'react';
import { usePythonStore } from '../../store/python.store';
import { useEditorStore } from '../../store/editor.store';

export function DiagnosticsPanel() {
  const { diagnostics } = usePythonStore();
  const openFile = useEditorStore(s => s.openFile);

  const handleClick = async (filePath: string, line: number) => {
    try {
      const content = await window.lyra.fs.readFile(filePath);
      const name = filePath.split('/').pop() || filePath;
      openFile(filePath, name, content);
    } catch {}
  };

  const severityColors: Record<string, string> = {
    error: '#f38ba8',
    warning: '#f9e2af',
    info: '#89b4fa',
    hint: '#6c7086',
  };

  const severityIcons: Record<string, string> = {
    error: '\u2717',
    warning: '\u26A0',
    info: '\u2139',
    hint: '\u2022',
  };

  if (diagnostics.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        No diagnostics. Save a Python file to run linting.
      </div>
    );
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warnCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div style={{ padding: 8 }}>
      {/* Summary */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', gap: 12 }}>
        <span style={{ color: '#f38ba8' }}>{errorCount} errors</span>
        <span style={{ color: '#f9e2af' }}>{warnCount} warnings</span>
        <span>{diagnostics.length} total</span>
      </div>

      {/* Diagnostic list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {diagnostics.map((diag, i) => (
          <div
            key={i}
            onClick={() => handleClick(diag.file, diag.line)}
            style={{
              display: 'flex',
              gap: 8,
              padding: '4px 6px',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <span style={{ color: severityColors[diag.severity], width: 14, textAlign: 'center', flexShrink: 0 }}>
              {severityIcons[diag.severity]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {diag.message}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {diag.file.split('/').pop()}:{diag.line}:{diag.column}
                {diag.code && <span style={{ marginLeft: 4 }}>({diag.code})</span>}
                <span style={{ marginLeft: 4, color: 'var(--text-muted)' }}>[{diag.source}]</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
