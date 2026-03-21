import React, { useState } from 'react';
import type { ExtensionInfo, ExtensionType } from '@shared/types/extension.types';

const TYPE_BADGES: Record<ExtensionType, { label: string; color: string }> = {
  theme: { label: 'Theme', color: '#cba6f7' },
  'language-pack': { label: 'Language', color: '#89b4fa' },
  plugin: { label: 'Plugin', color: '#a6e3a1' },
};

interface ExtensionCardProps {
  extension: ExtensionInfo;
  onInstall?: () => void;
  onUninstall?: () => void;
  onToggleEnabled?: () => void;
  onViewReadme?: () => void;
  loading?: boolean;
}

export function ExtensionCard({ extension, onInstall, onUninstall, onToggleEnabled, onViewReadme, loading }: ExtensionCardProps) {
  const [hover, setHover] = useState(false);
  const badge = TYPE_BADGES[extension.type] || TYPE_BADGES.plugin;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '10px 12px',
        background: hover ? 'var(--bg-hover)' : 'var(--bg-surface)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            onClick={onViewReadme}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: onViewReadme ? 'pointer' : 'default',
              textDecoration: onViewReadme ? 'none' : undefined,
            }}
            onMouseOver={e => { if (onViewReadme) e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseOut={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            {extension.displayName}
          </span>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: `${badge.color}20`,
            color: badge.color,
            fontWeight: 600,
          }}>
            {badge.label}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{extension.version}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {extension.description}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{extension.author}</span>

        <div style={{ display: 'flex', gap: 6 }}>
          {extension.installed ? (
            <>
              <button
                onClick={onToggleEnabled}
                disabled={loading}
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 4,
                  background: extension.enabled ? 'var(--bg-hover)' : 'var(--accent)',
                  color: extension.enabled ? 'var(--text-secondary)' : 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                {extension.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={onUninstall}
                disabled={loading}
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                }}
              >
                Uninstall
              </button>
            </>
          ) : (
            <button
              onClick={onInstall}
              disabled={loading}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 4,
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                fontWeight: 600,
                border: 'none',
              }}
            >
              {loading ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
