import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  height: number;
  onResize: (height: number) => void;
  cwd?: string;
  runCommand?: string | null;
  onCommandConsumed?: () => void;
}

interface TerminalTab {
  id: string;
  title: string;
  terminal: Terminal;
  fitAddon: FitAddon;
}

export function TerminalPanel({ height, onResize, cwd, runCommand, onCommandConsumed }: TerminalPanelProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  // Use a ref to track terminals so IPC listeners always have current data
  const tabsRef = useRef<TerminalTab[]>([]);
  tabsRef.current = tabs;

  const mountTerminal = useCallback((term: Terminal, fitAddon: FitAddon, id: string) => {
    // Retry mounting until the DOM container exists (React may not have rendered yet)
    const tryMount = (attempts: number) => {
      if (!containerRef.current || attempts <= 0) return;
      const el = containerRef.current.querySelector(`[data-terminal-id="${id}"]`) as HTMLElement;
      if (el && el.childElementCount === 0) {
        term.open(el);
        // Delay fit slightly to let layout settle
        setTimeout(() => {
          try { fitAddon.fit(); } catch {}
        }, 50);
      } else if (attempts > 1) {
        requestAnimationFrame(() => tryMount(attempts - 1));
      }
    };
    requestAnimationFrame(() => tryMount(10));
  }, []);

  const createTerminal = useCallback(async () => {
    const term = new Terminal({
      theme: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        selectionBackground: '#45475a',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8',
      },
      fontSize: 13,
      fontFamily: "'SF Mono', 'Fira Code', Menlo, monospace",
      cursorBlink: true,
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    const id = await window.lyra.terminal.spawn({ cwd: cwd || undefined });
    if (!id) {
      term.dispose();
      return;
    }

    // Forward keystrokes to the PTY
    term.onData((data) => {
      window.lyra.terminal.write(id, data);
    });

    // Forward resize events to the PTY
    term.onResize(({ cols, rows }) => {
      window.lyra.terminal.resize(id, cols, rows);
    });

    const tab: TerminalTab = { id, title: 'zsh', terminal: term, fitAddon };

    setTabs(prev => [...prev, tab]);
    setActiveTabId(id);

    // Mount after React renders the container div
    mountTerminal(term, fitAddon, id);
  }, [cwd, mountTerminal]);

  // Initialize first terminal on mount
  useEffect(() => {
    createTerminal();
    // Cleanup all terminals on unmount
    return () => {
      tabsRef.current.forEach(tab => {
        window.lyra.terminal.kill(tab.id);
        tab.terminal.dispose();
      });
    };
  }, []);

  // Single global listener for terminal data — uses ref to avoid stale closures
  useEffect(() => {
    const cleanupData = window.lyra.terminal.onData((id: string, data: string) => {
      const tab = tabsRef.current.find(t => t.id === id);
      if (tab) {
        tab.terminal.write(data);
      }
    });

    const cleanupExit = window.lyra.terminal.onExit((id: string) => {
      const tab = tabsRef.current.find(t => t.id === id);
      if (tab) tab.terminal.dispose();
      setTabs(prev => {
        const remaining = prev.filter(t => t.id !== id);
        setActiveTabId(current => {
          if (current === id && remaining.length > 0) {
            return remaining[remaining.length - 1].id;
          }
          return remaining.length === 0 ? null : current;
        });
        return remaining;
      });
    });

    return () => { cleanupData(); cleanupExit(); };
  }, []); // Only register once — tabsRef handles freshness

  // Execute run command when provided
  useEffect(() => {
    if (!runCommand || !activeTabId) return;
    window.lyra.terminal.write(activeTabId, runCommand + '\n');
    onCommandConsumed?.();
  }, [runCommand, activeTabId]);

  // Re-fit when height changes or active tab changes
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      setTimeout(() => {
        try { activeTab.fitAddon.fit(); } catch {}
      }, 50);
    }
  }, [height, activeTabId, tabs.length]);

  // Resize handle
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startY = e.clientY;
    const startHeight = height;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startY - e.clientY;
      onResize(Math.max(100, Math.min(600, startHeight + delta)));
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [height, onResize]);

  const closeTab = useCallback((id: string) => {
    window.lyra.terminal.kill(id);
    const tab = tabsRef.current.find(t => t.id === id);
    if (tab) tab.terminal.dispose();
    setTabs(prev => {
      const remaining = prev.filter(t => t.id !== id);
      setActiveTabId(current => {
        if (current === id && remaining.length > 0) {
          return remaining[remaining.length - 1].id;
        }
        return remaining.length === 0 ? null : current;
      });
      return remaining;
    });
  }, []);

  return (
    <div style={{ height, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{ height: 4, cursor: 'row-resize', flexShrink: 0 }}
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 8px',
        fontSize: 12,
        flexShrink: 0,
        gap: 4,
        minHeight: 30,
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTabId(tab.id);
              // Re-mount if needed after switching
              mountTerminal(tab.terminal, tab.fitAddon, tab.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab.id === activeTabId ? '2px solid var(--accent)' : '2px solid transparent',
              userSelect: 'none',
            }}
          >
            <span>{tab.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              style={{ fontSize: 14, color: 'var(--text-muted)', padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={createTerminal}
          style={{ color: 'var(--text-muted)', fontSize: 16, padding: '2px 6px' }}
          title="New terminal"
        >
          +
        </button>
      </div>

      {/* Terminal content */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            data-terminal-id={tab.id}
            style={{
              width: '100%',
              height: '100%',
              display: tab.id === activeTabId ? 'block' : 'none',
            }}
          />
        ))}
        {tabs.length === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            No terminal sessions. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
