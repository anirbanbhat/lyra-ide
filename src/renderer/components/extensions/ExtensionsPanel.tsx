import React, { useEffect } from 'react';
import { useExtensionsStore } from '../../store/extensions.store';
import { ExtensionCard } from './ExtensionCard';
import type { ExtensionInfo } from '@shared/types/extension.types';

interface ExtensionsPanelProps {
  onOpenReadme?: (extId: string, displayName: string, content: string) => void;
}

export function ExtensionsPanel({ onOpenReadme }: ExtensionsPanelProps) {
  const {
    installed, registry, searchQuery, loading, activeView,
    setActiveView, setSearchQuery, fetchInstalled, fetchRegistry,
    install, uninstall, toggleEnabled,
  } = useExtensionsStore();

  useEffect(() => {
    fetchInstalled();
    fetchRegistry();
  }, []);

  const handleViewReadme = async (ext: ExtensionInfo) => {
    if (!onOpenReadme) return;
    if (ext.installed) {
      const content = await window.lyra.extensions.getReadme(ext.id);
      if (content) {
        onOpenReadme(ext.id, ext.displayName, content);
      }
    } else {
      // Generate a README from registry info for non-installed extensions
      const content = `# ${ext.displayName}\n\n${ext.description}\n\n- **Version**: ${ext.version}\n- **Author**: ${ext.author}\n- **Type**: ${ext.type}\n\n## Installation\n\nClick **Install** in the Extensions panel to add this extension.\n`;
      onOpenReadme(ext.id, ext.displayName, content);
    }
  };

  const installedIds = new Set(installed.map(e => e.id));

  // Build browse list: registry entries not yet installed
  const browseList: ExtensionInfo[] = registry
    .filter(entry => !installedIds.has(entry.name))
    .map(entry => ({
      id: entry.name,
      displayName: entry.displayName,
      version: entry.version,
      description: entry.description,
      author: entry.author,
      type: entry.type,
      enabled: false,
      installed: false,
    }));

  const displayList = activeView === 'installed' ? installed : browseList;

  const filtered = searchQuery
    ? displayList.filter(ext =>
        ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayList;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border)',
        userSelect: 'none',
      }}>
        Extensions
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
        userSelect: 'none',
      }}>
        {(['browse', 'installed'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            style={{
              flex: 1,
              padding: '6px 0',
              textAlign: 'center',
              color: activeView === view ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeView === view ? '2px solid var(--accent)' : '2px solid transparent',
              fontSize: 12,
              fontWeight: activeView === view ? 600 : 400,
              background: 'transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {view === 'installed' ? `Installed (${installed.length})` : 'Browse'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px' }}>
        <input
          type="text"
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            fontSize: 12,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Extension list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
            Loading...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
            {activeView === 'installed'
              ? 'No extensions installed yet.'
              : searchQuery
                ? 'No extensions match your search.'
                : 'No extensions available in registry.'
            }
          </div>
        )}

        {filtered.map(ext => (
          <ExtensionCard
            key={ext.id}
            extension={ext}
            loading={loading}
            onInstall={() => install(ext.id)}
            onUninstall={() => uninstall(ext.id)}
            onToggleEnabled={() => toggleEnabled(ext.id)}
            onViewReadme={() => handleViewReadme(ext)}
          />
        ))}
      </div>
    </div>
  );
}
