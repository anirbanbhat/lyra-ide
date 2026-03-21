import React, { useEffect, useState } from 'react';
import { useGitStore } from '../../store/git.store';
import { useFileTreeStore } from '../../store/file-tree.store';
import type { GitFileChange } from '@shared/types/git.types';

export function GitPanel() {
  const cwd = useFileTreeStore(s => s.rootPath);
  const {
    status, log, branches, config, activeView, commitMessage, loading, error,
    diffContent, diffFile,
    setActiveView, setCommitMessage, setError,
    refresh, fetchLog, fetchBranches, fetchConfig,
    stageFiles, unstageFiles, stageAll, commit, push, pull,
    checkoutBranch, createBranch, initRepo, saveConfig, viewDiff,
  } = useGitStore();

  const [newBranch, setNewBranch] = useState('');
  const [configName, setConfigName] = useState('');
  const [configEmail, setConfigEmail] = useState('');
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    if (cwd) {
      refresh(cwd);
    }
  }, [cwd]);

  useEffect(() => {
    if (!cwd || !status?.isRepo) return;
    if (activeView === 'log') fetchLog(cwd);
    if (activeView === 'branches') fetchBranches(cwd);
    if (activeView === 'config') {
      fetchConfig(cwd).then(() => {
        const c = useGitStore.getState().config;
        if (c) {
          setConfigName(c.userName);
          setConfigEmail(c.userEmail);
        }
      });
    }
  }, [activeView, cwd, status?.isRepo]);

  if (!cwd) {
    return (
      <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
        Open a folder to use Git.
      </div>
    );
  }

  if (status && !status.isRepo) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)' }}>This folder is not a Git repository.</div>
        <button
          onClick={() => initRepo(cwd)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0) + (status?.untracked.length || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        userSelect: 'none',
      }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
          Git
        </span>
        {status?.branch && (
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>
            {status.branch}
            {(status.ahead > 0 || status.behind > 0) && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                {status.ahead > 0 && `+${status.ahead}`}{status.behind > 0 && ` -${status.behind}`}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', fontSize: 11, userSelect: 'none' }}>
        {(['changes', 'log', 'branches', 'config'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              flex: 1,
              padding: '5px 0',
              textAlign: 'center',
              color: activeView === view ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeView === view ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeView === view ? 600 : 400,
              background: 'transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: 11,
            }}
          >
            {view === 'changes' ? `Changes (${totalChanges})` : view}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: '8px 12px 0',
          padding: '6px 10px',
          background: 'rgba(243, 139, 168, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--error)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>{error.toString().replace('Error: ', '').slice(0, 120)}</span>
          <button onClick={() => setError(null)} style={{ color: 'var(--error)', fontSize: 14 }}>x</button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {activeView === 'changes' && status && (
          <ChangesView
            status={status}
            commitMessage={commitMessage}
            loading={loading}
            cwd={cwd}
            onSetMessage={setCommitMessage}
            onStage={(f) => stageFiles(cwd, f)}
            onUnstage={(f) => unstageFiles(cwd, f)}
            onStageAll={() => stageAll(cwd)}
            onCommit={() => commit(cwd)}
            onPush={() => push(cwd)}
            onPull={() => pull(cwd)}
            onRefresh={() => refresh(cwd)}
            onDiff={(f) => viewDiff(cwd, f)}
            diffContent={diffContent}
            diffFile={diffFile}
          />
        )}

        {activeView === 'log' && (
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No commits yet.</div>}
            {log.map(entry => (
              <div key={entry.hash} style={{
                padding: '6px 8px',
                background: 'var(--bg-surface)',
                borderRadius: 4,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: 11 }}>{entry.shortHash}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{new Date(entry.date).toLocaleDateString()}</span>
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{entry.message}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{entry.author}</div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'branches' && (
          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={newBranch}
                onChange={e => setNewBranch(e.target.value)}
                placeholder="New branch name..."
                style={{
                  flex: 1, padding: '5px 8px', fontSize: 12,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newBranch.trim()) {
                    createBranch(cwd, newBranch.trim());
                    setNewBranch('');
                  }
                }}
              />
              <button
                onClick={() => { if (newBranch.trim()) { createBranch(cwd, newBranch.trim()); setNewBranch(''); } }}
                disabled={!newBranch.trim()}
                style={{
                  padding: '5px 10px', fontSize: 11, background: 'var(--accent)',
                  color: 'var(--bg-primary)', borderRadius: 4, fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
            {branches.map(b => (
              <div
                key={b.name}
                onClick={() => { if (!b.current) checkoutBranch(cwd, b.name); }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: b.current ? 'default' : 'pointer',
                  background: b.current ? 'var(--bg-hover)' : 'transparent',
                  color: b.current ? 'var(--accent)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {b.current && <span style={{ fontSize: 8 }}>*</span>}
                {b.name}
              </div>
            ))}
          </div>
        )}

        {activeView === 'config' && (
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Git Identity</div>
            <ConfigInput label="Name" value={configName} onChange={setConfigName} placeholder="Your Name" />
            <ConfigInput label="Email" value={configEmail} onChange={setConfigEmail} placeholder="you@example.com" />

            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>GitHub Token</div>
            <ConfigInput
              label="Personal Access Token"
              value={githubToken}
              onChange={setGithubToken}
              placeholder="ghp_..."
              secret
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Used for pushing to private repos. Get one from GitHub Settings &gt; Developer settings &gt; Personal access tokens.
            </div>

            <button
              onClick={async () => {
                await saveConfig(cwd, { userName: configName, userEmail: configEmail, githubToken });
                // Store GitHub token in settings for credential helper
                if (githubToken) {
                  await window.lyra.settings.set('githubToken', githubToken);
                }
              }}
              disabled={loading}
              style={{
                padding: '8px 16px', background: 'var(--accent)',
                color: 'var(--bg-primary)', borderRadius: 6,
                fontWeight: 600, fontSize: 13, alignSelf: 'flex-start',
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onChange, placeholder, secret }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>{label}</label>
      <input
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '5px 8px', fontSize: 12,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
        }}
      />
    </div>
  );
}

function ChangesView({ status, commitMessage, loading, cwd, onSetMessage, onStage, onUnstage, onStageAll, onCommit, onPush, onPull, onRefresh, onDiff, diffContent, diffFile }: {
  status: NonNullable<ReturnType<typeof useGitStore.getState>['status']>;
  commitMessage: string; loading: boolean; cwd: string;
  onSetMessage: (m: string) => void;
  onStage: (f: string[]) => void; onUnstage: (f: string[]) => void;
  onStageAll: () => void; onCommit: () => void;
  onPush: () => void; onPull: () => void; onRefresh: () => void;
  onDiff: (f?: string) => void;
  diffContent: string | null; diffFile: string | null;
}) {
  return (
    <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <SmallButton onClick={onRefresh} label="Refresh" />
        <SmallButton onClick={onPull} label="Pull" disabled={loading} />
        <SmallButton onClick={onPush} label="Push" disabled={loading} />
      </div>

      {/* Commit input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={commitMessage}
          onChange={e => onSetMessage(e.target.value)}
          placeholder="Commit message..."
          style={{
            flex: 1, padding: '5px 8px', fontSize: 12,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
          }}
          onKeyDown={e => { if (e.key === 'Enter') onCommit(); }}
        />
        <button
          onClick={onCommit}
          disabled={!commitMessage.trim() || loading}
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600,
            background: !commitMessage.trim() ? 'var(--bg-hover)' : 'var(--accent)',
            color: !commitMessage.trim() ? 'var(--text-muted)' : 'var(--bg-primary)',
            borderRadius: 4,
          }}
        >
          Commit
        </button>
      </div>

      {/* Staged files */}
      {status.staged.length > 0 && (
        <FileSection
          title={`Staged (${status.staged.length})`}
          files={status.staged}
          actionLabel="-"
          actionTitle="Unstage"
          onAction={(f) => onUnstage([f])}
          onDiff={onDiff}
        />
      )}

      {/* Unstaged files */}
      {status.unstaged.length > 0 && (
        <FileSection
          title={`Modified (${status.unstaged.length})`}
          files={status.unstaged}
          actionLabel="+"
          actionTitle="Stage"
          onAction={(f) => onStage([f])}
          onDiff={onDiff}
        />
      )}

      {/* Untracked files */}
      {status.untracked.length > 0 && (
        <FileSection
          title={`Untracked (${status.untracked.length})`}
          files={status.untracked}
          actionLabel="+"
          actionTitle="Stage"
          onAction={(f) => onStage([f])}
          onDiff={onDiff}
        />
      )}

      {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          No changes
        </div>
      )}

      {(status.unstaged.length > 0 || status.untracked.length > 0) && (
        <button
          onClick={onStageAll}
          style={{
            padding: '5px 12px', fontSize: 11,
            background: 'var(--bg-surface)', color: 'var(--text-secondary)',
            borderRadius: 4, border: '1px solid var(--border)', alignSelf: 'flex-start',
          }}
        >
          Stage All
        </button>
      )}

      {/* Diff view */}
      {diffContent !== null && (
        <div style={{
          marginTop: 4,
          background: 'var(--bg-surface)',
          borderRadius: 4,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '4px 8px', fontSize: 11, color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{diffFile || 'All changes'}</span>
            <button onClick={() => useGitStore.setState({ diffContent: null, diffFile: null })}
              style={{ color: 'var(--text-muted)', fontSize: 13 }}>x</button>
          </div>
          <pre style={{
            padding: 8, fontSize: 11, fontFamily: 'monospace',
            overflow: 'auto', maxHeight: 200, margin: 0,
            color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
          }}>
            {diffContent || '(no diff)'}
          </pre>
        </div>
      )}
    </div>
  );
}

function FileSection({ title, files, actionLabel, actionTitle, onAction, onDiff }: {
  title: string; files: GitFileChange[];
  actionLabel: string; actionTitle: string;
  onAction: (path: string) => void;
  onDiff: (path: string) => void;
}) {
  const STATUS_COLORS: Record<string, string> = {
    modified: '#f9e2af',
    added: '#a6e3a1',
    deleted: '#f38ba8',
    renamed: '#89b4fa',
    untracked: '#6c7086',
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {files.map(file => (
        <div key={file.path} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '3px 6px', fontSize: 12, borderRadius: 3,
        }}>
          <span
            onClick={() => onDiff(file.path)}
            style={{
              cursor: 'pointer',
              color: STATUS_COLORS[file.status] || 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}
            title={file.path}
          >
            {file.path.split('/').pop()}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: STATUS_COLORS[file.status], textTransform: 'uppercase' }}>
              {file.status[0]}
            </span>
            <button
              onClick={() => onAction(file.path)}
              title={actionTitle}
              style={{
                width: 18, height: 18, fontSize: 13, lineHeight: '18px',
                textAlign: 'center', borderRadius: 3,
                background: 'var(--bg-hover)', color: 'var(--text-secondary)',
              }}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px', fontSize: 11, borderRadius: 4,
        background: 'var(--bg-surface)', color: 'var(--text-secondary)',
        border: '1px solid var(--border)', cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}
