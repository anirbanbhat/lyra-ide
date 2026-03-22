import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { FileEntry } from '@shared/types/file-system.types';
import { useFileTreeStore } from '../../store/file-tree.store';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  onOpenFile: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
  renamingPath: string | null;
  creatingIn: string | null;
  creatingType: 'file' | 'folder' | null;
  onRenameSubmit: (oldPath: string, newName: string) => void;
  onRenameCancel: () => void;
  onCreateSubmit: (parentDir: string, name: string, type: 'file' | 'folder') => void;
  onCreateCancel: () => void;
}

const FILE_ICONS: Record<string, string> = {
  ts: '🔷', tsx: '🔷', js: '🟡', jsx: '🟡',
  json: '{}', md: '📝', css: '🎨', html: '🌐',
  py: '🐍', rs: '🦀', go: '🔵', java: '☕',
  default: '📄', folder: '📁', folderOpen: '📂',
};

function getIcon(entry: FileEntry, isExpanded: boolean): string {
  if (entry.isDirectory) return isExpanded ? FILE_ICONS.folderOpen : FILE_ICONS.folder;
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

function InlineInput({ defaultValue, onSubmit, onCancel, depth, icon }: {
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  depth: number;
  icon?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      // Select the name without extension for files
      const dotIdx = defaultValue.lastIndexOf('.');
      if (dotIdx > 0) {
        ref.current.setSelectionRange(0, dotIdx);
      } else {
        ref.current.select();
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (trimmed && trimmed !== defaultValue) {
        onSubmit(trimmed);
      } else if (trimmed === defaultValue && defaultValue === '') {
        // new file/folder — name is required
        onCancel();
      } else {
        onCancel();
      }
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '2px 8px',
      paddingLeft: 12 + depth * 16,
      gap: 6,
    }}>
      <span style={{ width: 10 }} />
      {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
      <input
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const trimmed = value.trim();
          if (trimmed && trimmed !== defaultValue) {
            onSubmit(trimmed);
          } else {
            onCancel();
          }
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
      />
    </div>
  );
}

export function FileTreeItem({
  entry,
  depth,
  onOpenFile,
  onContextMenu,
  renamingPath,
  creatingIn,
  creatingType,
  onRenameSubmit,
  onRenameCancel,
  onCreateSubmit,
  onCreateCancel,
}: FileTreeItemProps) {
  const { isExpanded, toggleExpanded, setChildren, loadedChildren } = useFileTreeStore();
  const expanded = isExpanded(entry.path);
  const children = loadedChildren[entry.path];
  const [hover, setHover] = useState(false);
  const isRenaming = renamingPath === entry.path;

  const handleClick = useCallback(async () => {
    if (entry.isDirectory) {
      toggleExpanded(entry.path);
      if (!loadedChildren[entry.path]) {
        try {
          const entries = await window.lyra.fs.listDir(entry.path);
          setChildren(entry.path, entries);
        } catch (err) {
          console.error('Failed to list dir:', err);
        }
      }
    } else {
      onOpenFile(entry.path);
    }
  }, [entry, toggleExpanded, setChildren, loadedChildren, onOpenFile]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, entry);
  }, [entry, onContextMenu]);

  const isCreatingHere = entry.isDirectory && creatingIn === entry.path;

  return (
    <div>
      {isRenaming ? (
        <InlineInput
          defaultValue={entry.name}
          depth={depth}
          icon={getIcon(entry, expanded)}
          onSubmit={(newName) => onRenameSubmit(entry.path, newName)}
          onCancel={onRenameCancel}
        />
      ) : (
        <div
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '3px 8px',
            paddingLeft: 12 + depth * 16,
            cursor: 'pointer',
            fontSize: 13,
            background: hover ? 'var(--bg-hover)' : 'transparent',
            color: 'var(--text-primary)',
            userSelect: 'none',
            gap: 6,
          }}
        >
          {entry.isDirectory && (
            <span style={{
              fontSize: 10,
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s',
              display: 'inline-block',
              width: 10,
            }}>
              ▶
            </span>
          )}
          {!entry.isDirectory && <span style={{ width: 10 }} />}
          <span style={{ fontSize: 14, lineHeight: 1 }}>{getIcon(entry, expanded)}</span>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entry.name}
          </span>
        </div>
      )}

      {entry.isDirectory && expanded && (
        <div>
          {isCreatingHere && creatingType && (
            <InlineInput
              defaultValue=""
              depth={depth + 1}
              icon={creatingType === 'folder' ? FILE_ICONS.folder : FILE_ICONS.default}
              onSubmit={(name) => onCreateSubmit(entry.path, name, creatingType)}
              onCancel={onCreateCancel}
            />
          )}
          {children?.map(child => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
              renamingPath={renamingPath}
              creatingIn={creatingIn}
              creatingType={creatingType}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onCreateSubmit={onCreateSubmit}
              onCreateCancel={onCreateCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
