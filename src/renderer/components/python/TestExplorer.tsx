import React, { useEffect, useCallback } from 'react';
import { usePythonStore } from '../../store/python.store';
import type { PythonTestItem } from '@shared/types/python.types';

interface TestExplorerProps {
  cwd: string | null;
}

export function TestExplorer({ cwd }: TestExplorerProps) {
  const {
    tests, testRunning, lastTestResult,
    discoverTests, runTests,
  } = usePythonStore();

  useEffect(() => {
    if (cwd) discoverTests(cwd);
  }, [cwd]);

  const handleRunAll = useCallback(() => {
    if (cwd) runTests(cwd);
  }, [cwd, runTests]);

  const handleRunTest = useCallback((testId: string) => {
    if (cwd) runTests(cwd, [testId]);
  }, [cwd, runTests]);

  return (
    <div style={{ padding: 8 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          onClick={handleRunAll}
          disabled={testRunning || !cwd}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 4,
            fontWeight: 600,
            opacity: testRunning ? 0.6 : 1,
          }}
        >
          {testRunning ? 'Running...' : 'Run All Tests'}
        </button>
        <button
          onClick={() => cwd && discoverTests(cwd)}
          disabled={!cwd}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Test summary */}
      {lastTestResult && (
        <div style={{
          padding: '6px 8px',
          marginBottom: 8,
          borderRadius: 4,
          fontSize: 11,
          background: lastTestResult.summary.failed > 0 ? '#f38ba820' : '#a6e3a120',
          color: lastTestResult.summary.failed > 0 ? '#f38ba8' : '#a6e3a1',
          border: `1px solid ${lastTestResult.summary.failed > 0 ? '#f38ba840' : '#a6e3a140'}`,
        }}>
          {lastTestResult.summary.passed} passed
          {lastTestResult.summary.failed > 0 && `, ${lastTestResult.summary.failed} failed`}
          {lastTestResult.summary.skipped > 0 && `, ${lastTestResult.summary.skipped} skipped`}
          {' '}({(lastTestResult.summary.duration / 1000).toFixed(1)}s)
        </div>
      )}

      {/* Test tree */}
      {tests.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
          {cwd ? 'No tests discovered. Make sure pytest or unittest test files exist.' : 'Open a folder to discover tests.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tests.map(test => (
            <TestItemRow key={test.id} item={test} onRun={handleRunTest} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestItemRow({ item, onRun, depth }: { item: PythonTestItem; onRun: (id: string) => void; depth: number }) {
  const statusIcons: Record<string, string> = {
    passed: '\u2713',   // checkmark
    failed: '\u2717',   // cross
    skipped: '\u2014',  // dash
    running: '\u25CB',  // circle
    pending: '\u25CB',  // circle
  };

  const statusColors: Record<string, string> = {
    passed: '#a6e3a1',
    failed: '#f38ba8',
    skipped: '#f9e2af',
    running: '#89b4fa',
    pending: 'var(--text-muted)',
  };

  const status = item.status || 'pending';

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          paddingLeft: 8 + depth * 16,
          fontSize: 12,
          borderRadius: 3,
          cursor: 'pointer',
        }}
        onClick={() => onRun(item.id)}
        title={`Click to run: ${item.id}`}
      >
        <span style={{ color: statusColors[status], fontWeight: 700, width: 14, textAlign: 'center' }}>
          {statusIcons[status]}
        </span>
        <span style={{ color: 'var(--text-primary)', flex: 1 }}>{item.label}</span>
        {item.message && (
          <span style={{ color: '#f38ba8', fontSize: 11 }} title={item.message}>!</span>
        )}
      </div>
      {item.children?.map(child => (
        <TestItemRow key={child.id} item={child} onRun={onRun} depth={depth + 1} />
      ))}
    </>
  );
}
