import React, { useState } from 'react';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectPath: string) => void;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const TEMPLATES: ProjectTemplate[] = [
  { id: 'blank', name: 'Blank Project', description: 'Empty project with README and .gitignore', icon: '📁' },
  { id: 'node', name: 'Node.js', description: 'Node.js project with package.json and src/', icon: '🟢' },
  { id: 'typescript', name: 'TypeScript', description: 'TypeScript project with tsconfig.json', icon: '🔷' },
  { id: 'python', name: 'Python', description: 'Python project with src/ and requirements.txt', icon: '🐍' },
  { id: 'html', name: 'HTML/CSS/JS', description: 'Static web project with HTML, CSS, and JS', icon: '🌐' },
];

export function NewProjectDialog({ isOpen, onClose, onCreated }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [parentDir, setParentDir] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleBrowse = async () => {
    const dir = await window.lyra.fs.openFolderDialog();
    if (dir) setParentDir(dir);
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }
    if (!parentDir) {
      setError('Please select a location');
      return;
    }

    setError('');
    setCreating(true);

    try {
      const projectPath = await window.lyra.fs.newProject(
        projectName.trim(),
        parentDir,
        selectedTemplate
      );
      setCreating(false);
      setProjectName('');
      setParentDir('');
      setSelectedTemplate('blank');
      onCreated(projectPath);
      onClose();
    } catch (err) {
      setError(`Failed to create project: ${err}`);
      setCreating(false);
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
        width: 560,
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
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
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Project</h2>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Project name */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Project Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="my-project"
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Location <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={parentDir}
                onChange={e => setParentDir(e.target.value)}
                placeholder="/Users/you/projects"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleBrowse}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                }}
              >
                Browse...
              </button>
            </div>
            {parentDir && projectName && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Will create: {parentDir}/{projectName.trim()}
              </div>
            )}
          </div>

          {/* Template */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'left',
                    background: selectedTemplate === tpl.id ? 'var(--accent)' : 'var(--bg-surface)',
                    color: selectedTemplate === tpl.id ? 'var(--bg-primary)' : 'var(--text-primary)',
                    border: selectedTemplate === tpl.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{tpl.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tpl.name}</div>
                    <div style={{
                      fontSize: 11,
                      opacity: 0.8,
                      color: selectedTemplate === tpl.id ? 'var(--bg-primary)' : 'var(--text-muted)',
                    }}>
                      {tpl.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: 13 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 13,
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: creating ? 'var(--bg-hover)' : 'var(--accent)',
              color: creating ? 'var(--text-muted)' : 'var(--bg-primary)',
            }}
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
