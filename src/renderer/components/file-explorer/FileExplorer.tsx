import React, { useCallback, useState } from 'react';
import { useFileTreeStore } from '../../store/file-tree.store';
import { FileTreeItem } from './FileTreeItem';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import type { FileEntry } from '@shared/types/file-system.types';

interface FileExplorerProps {
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onNewProject?: () => void;
}

export function FileExplorer({ onOpenFile, onOpenFolder, onNewProject }: FileExplorerProps) {
  const { rootPath, rootEntries, refreshDir, toggleExpanded, isExpanded, setChildren } = useFileTreeStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; operation: 'copy' | 'cut' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);

  const handleOpenFolder = useCallback(async () => {
    const p = await window.lyra.fs.openFolderDialog();
    if (p) onOpenFolder(p);
  }, [onOpenFolder]);

  const getParentDir = (filePath: string) => {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, []);

  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!rootPath) return;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      entry: { name: rootPath.split('/').pop() || '', path: rootPath, isDirectory: true, isFile: false },
    });
  }, [rootPath]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleDelete = useCallback(async (entryPath: string) => {
    const name = entryPath.split('/').pop();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await window.lyra.fs.delete(entryPath);
      const parent = getParentDir(entryPath);
      await refreshDir(parent);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }, [refreshDir]);

  const handleCopy = useCallback((entryPath: string) => {
    setClipboard({ path: entryPath, operation: 'copy' });
  }, []);

  const handleCut = useCallback((entryPath: string) => {
    setClipboard({ path: entryPath, operation: 'cut' });
  }, []);

  const handlePaste = useCallback(async (targetDir: string) => {
    if (!clipboard) return;
    const srcName = clipboard.path.split('/').pop()!;
    let destPath = targetDir + '/' + srcName;

    // Avoid overwriting — add (copy) suffix if needed
    try {
      await window.lyra.fs.stat(destPath);
      const dotIdx = srcName.lastIndexOf('.');
      if (dotIdx > 0) {
        destPath = targetDir + '/' + srcName.slice(0, dotIdx) + ' (copy)' + srcName.slice(dotIdx);
      } else {
        destPath = targetDir + '/' + srcName + ' (copy)';
      }
    } catch {
      // Doesn't exist — good
    }

    try {
      if (clipboard.operation === 'copy') {
        await window.lyra.fs.copy(clipboard.path, destPath);
      } else {
        await window.lyra.fs.rename(clipboard.path, destPath);
        // Refresh source parent too
        await refreshDir(getParentDir(clipboard.path));
        setClipboard(null);
      }
      await refreshDir(targetDir);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  }, [clipboard, refreshDir]);

  const handleRenameSubmit = useCallback(async (oldPath: string, newName: string) => {
    const parent = getParentDir(oldPath);
    const newPath = parent + '/' + newName;
    try {
      await window.lyra.fs.rename(oldPath, newPath);
      await refreshDir(parent);
    } catch (err) {
      console.error('Failed to rename:', err);
    }
    setRenamingPath(null);
  }, [refreshDir]);

  const handleCreateSubmit = useCallback(async (parentDir: string, name: string, type: 'file' | 'folder') => {
    const newPath = parentDir + '/' + name;
    try {
      if (type === 'file') {
        await window.lyra.fs.createFile(newPath);
      } else {
        await window.lyra.fs.createDir(newPath);
      }
      await refreshDir(parentDir);
    } catch (err) {
      console.error('Failed to create:', err);
    }
    setCreatingIn(null);
    setCreatingType(null);
  }, [refreshDir]);

  const startCreate = useCallback(async (dirPath: string, type: 'file' | 'folder') => {
    // Ensure the directory is expanded so the inline input is visible
    if (!isExpanded(dirPath) && dirPath !== rootPath) {
      toggleExpanded(dirPath);
      try {
        const entries = await window.lyra.fs.listDir(dirPath);
        setChildren(dirPath, entries);
      } catch {}
    }
    setCreatingIn(dirPath);
    setCreatingType(type);
  }, [isExpanded, toggleExpanded, setChildren, rootPath]);

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const entry = contextMenu.entry;
    const isDir = entry.isDirectory;
    const targetDir = isDir ? entry.path : getParentDir(entry.path);

    const items: ContextMenuItem[] = [];

    items.push({ label: 'New File', action: () => startCreate(targetDir, 'file') });
    items.push({ label: 'New Folder', action: () => startCreate(targetDir, 'folder') });
    items.push({ label: '', action: () => {}, separator: true });
    items.push({ label: 'Copy', action: () => handleCopy(entry.path) });
    items.push({ label: 'Cut', action: () => handleCut(entry.path) });
    items.push({
      label: 'Paste',
      action: () => handlePaste(targetDir),
      disabled: !clipboard,
    });
    items.push({ label: '', action: () => {}, separator: true });
    items.push({ label: 'Rename', action: () => setRenamingPath(entry.path) });
    items.push({ label: 'Delete', action: () => handleDelete(entry.path) });

    return items;
  }, [contextMenu, clipboard, handleCopy, handleCut, handlePaste, handleDelete, startCreate]);

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
      <div
        onContextMenu={handleRootContextMenu}
        style={{
          padding: '8px 12px',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
          userSelect: 'none',
        }}
      >
        {rootPath.split('/').pop()}
      </div>
      <div
        style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}
        onContextMenu={(e) => {
          // Right-click on empty space in the tree
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              entry: { name: rootPath.split('/').pop() || '', path: rootPath, isDirectory: true, isFile: false },
            });
          }
        }}
      >
        {/* Inline create at root level */}
        {creatingIn === rootPath && creatingType && (
          <div style={{ paddingLeft: 12 }}>
            <InlineInputRoot
              type={creatingType}
              onSubmit={(name) => handleCreateSubmit(rootPath, name, creatingType)}
              onCancel={() => { setCreatingIn(null); setCreatingType(null); }}
            />
          </div>
        )}
        {rootEntries.map(entry => (
          <FileTreeItem
            key={entry.path}
            entry={entry}
            depth={0}
            onOpenFile={onOpenFile}
            onContextMenu={handleContextMenu}
            renamingPath={renamingPath}
            creatingIn={creatingIn}
            creatingType={creatingType}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenamingPath(null)}
            onCreateSubmit={handleCreateSubmit}
            onCreateCancel={() => { setCreatingIn(null); setCreatingType(null); }}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

function InlineInputRoot({ type, onSubmit, onCancel }: {
  type: 'file' | 'folder';
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0', gap: 6 }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{type === 'folder' ? '📁' : '📄'}</span>
      <input
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (value.trim()) onSubmit(value.trim());
          else onCancel();
        }}
        style={{
          flex: 1,
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent)',
          borderRadius: 3,
          padding: '2px 4px',
          fontSize: 13,
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        placeholder={type === 'folder' ? 'Folder name...' : 'File name...'}
      />
    </div>
  );
}
