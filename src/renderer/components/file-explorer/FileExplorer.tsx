import React, { useCallback } from 'react';
import { useFileTreeStore } from '../../store/file-tree.store';
import { FileTreeItem } from './FileTreeItem';

interface FileExplorerProps {
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onNewProject?: () => void;
}

export function FileExplorer({ onOpenFile, onOpenFolder, onNewProject }: FileExplorerProps) {
  const { rootPath, rootEntries } = useFileTreeStore();

  const handleOpenFolder = useCallback(async () => {
    const path = await window.lyra.fs.openFolderDialog();
    if (path) onOpenFolder(path);
  }, [onOpenFolder]);

  if (!rootPath) {
    return (
      <div style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>
          Explorer
        </div>
        <button
          onClick={onNewProject}
          style={{
            padding: '8px 12px',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          New Project
        </button>
        <button
          onClick={handleOpenFolder}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid var(--border)',
          }}
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '8px 12px',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border)',
        userSelect: 'none',
      }}>
        {rootPath.split('/').pop()}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {rootEntries.map(entry => (
          <FileTreeItem
            key={entry.path}
            entry={entry}
            depth={0}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  );
}
