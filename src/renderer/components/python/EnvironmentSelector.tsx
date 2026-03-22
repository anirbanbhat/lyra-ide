import React, { useEffect } from 'react';
import { usePythonStore } from '../../store/python.store';

interface EnvironmentSelectorProps {
  cwd: string | null;
}

export function EnvironmentSelector({ cwd }: EnvironmentSelectorProps) {
  const {
    environments, activeEnvPath, detectEnvironments, setEnvironment,
    lintTool, setLintTool, formatTool, setFormatTool, testFramework, setTestFramework,
  } = usePythonStore();

  useEffect(() => {
    if (cwd) detectEnvironments(cwd);
  }, [cwd]);

  return (
    <div style={{ padding: 8 }}>
      {/* Python interpreter selection */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Python Interpreter
        </div>
        {environments.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
            No Python environments detected.
            {cwd ? ' Open a Python project to see environments.' : ' Open a folder first.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {environments.map(env => (
              <button
                key={env.path}
                onClick={() => setEnvironment(env.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  textAlign: 'left',
                  background: env.path === activeEnvPath ? 'var(--bg-hover)' : 'transparent',
                  color: env.path === activeEnvPath ? 'var(--accent)' : 'var(--text-primary)',
                  border: env.path === activeEnvPath ? '1px solid var(--accent)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontWeight: 500 }}>{env.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {env.version} &middot; {env.type}
                </span>
              </button>
            ))}
          </div>
        )}
        {cwd && (
          <button
            onClick={() => detectEnvironments(cwd)}
            style={{
              marginTop: 8,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--text-muted)',
              borderRadius: 4,
              border: '1px solid var(--border)',
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* Tool configuration */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Tool Configuration
        </div>

        <ConfigSelect
          label="Linter"
          value={lintTool}
          options={['pylint', 'flake8', 'mypy']}
          onChange={setLintTool}
        />
        <ConfigSelect
          label="Formatter"
          value={formatTool}
          options={['black', 'autopep8', 'yapf']}
          onChange={setFormatTool}
        />
        <ConfigSelect
          label="Test Framework"
          value={testFramework}
          options={['pytest', 'unittest']}
          onChange={setTestFramework}
        />
      </div>
    </div>
  );
}

function ConfigSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 12,
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
