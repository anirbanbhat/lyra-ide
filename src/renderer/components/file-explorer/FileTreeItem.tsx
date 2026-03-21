import React, { useCallback, useState, useEffect } from 'react';
import type { FileEntry } from '@shared/types/file-system.types';
import { useFileTreeStore } from '../../store/file-tree.store';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  onOpenFile: (path: string) => void;
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

export function FileTreeItem({ entry, depth, onOpenFile }: FileTreeItemProps) {
  const { isExpanded, toggleExpanded, setChildren, loadedChildren } = useFileTreeStore();
  const expanded = isExpanded(entry.path);
  const children = loadedChildren[entry.path];
  const [hover, setHover] = useState(false);

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

  return (
    <div>
      <div
        onClick={handleClick}
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
      {entry.isDirectory && expanded && children && (
        <div>
          {children.map(child => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
