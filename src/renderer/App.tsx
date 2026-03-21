import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditorStore } from './store/editor.store';
import { useFileTreeStore } from './store/file-tree.store';
import { Sidebar } from './components/layout/Sidebar';
import { FileExplorer } from './components/file-explorer/FileExplorer';
import { EditorTabs } from './components/editor/EditorTabs';
import { CodeEditor } from './components/editor/CodeEditor';
import { ChatPanel } from './components/chat/ChatPanel';
import { TerminalPanel } from './components/terminal/TerminalPanel';
import { StatusBar } from './components/layout/StatusBar';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { NewProjectDialog } from './components/settings/NewProjectDialog';
import { ExtensionsPanel } from './components/extensions/ExtensionsPanel';
import { GitPanel } from './components/git/GitPanel';
import { MarkdownPreview } from './components/markdown/MarkdownPreview';
import { useExtensionsStore } from './store/extensions.store';

type SidebarView = 'explorer' | 'git' | 'extensions';

// Map file extensions to run commands
const RUN_COMMANDS: Record<string, (file: string) => string> = {
  js: (f) => `node "${f}"`,
  ts: (f) => `npx ts-node "${f}"`,
  py: (f) => `python3 "${f}"`,
  rb: (f) => `ruby "${f}"`,
  go: (f) => `go run "${f}"`,
  rs: (f) => `cargo run`,
  sh: (f) => `bash "${f}"`,
  java: (f) => `java "${f}"`,
};

export default function App() {
  const { openFile, getActiveTab, updateContent, markSaved } = useEditorStore();
  const { rootPath, setRootPath, setRootEntries } = useFileTreeStore();
  const { installed, fetchInstalled: fetchExtensions } = useExtensionsStore();
  const isMarkdownPreviewActive = installed.some(e => e.id === 'lyra-markdown-preview' && e.enabled);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const [showChat, setShowChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(true);
  const [runCommand, setRunCommand] = useState<string | null>(null);

  const handleOpenFile = useCallback(async (filePath: string) => {
    try {
      const content = await window.lyra.fs.readFile(filePath);
      const name = filePath.split('/').pop() || filePath;
      openFile(filePath, name, content);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [openFile]);

  const handleOpenFolder = useCallback(async (folderPath: string) => {
    setRootPath(folderPath);
    const entries = await window.lyra.fs.listDir(folderPath);
    setRootEntries(entries);
  }, [setRootPath, setRootEntries]);

  const handleSave = useCallback(async () => {
    const tab = getActiveTab();
    if (!tab) return;
    try {
      await window.lyra.fs.writeFile(tab.path, tab.content);
      markSaved(tab.path);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [getActiveTab, markSaved]);

  const handleProjectCreated = useCallback(async (projectPath: string) => {
    await handleOpenFolder(projectPath);
  }, [handleOpenFolder]);

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleRunFile = useCallback(() => {
    const tab = getActiveTab();
    if (!tab) return;
    const ext = tab.name.split('.').pop()?.toLowerCase() || '';
    const cmdFn = RUN_COMMANDS[ext];
    if (cmdFn) {
      setRunCommand(cmdFn(tab.path));
      setShowTerminal(true);
    } else {
      setShowTerminal(true);
    }
  }, [getActiveTab]);

  useEffect(() => {
    const cleanupFile = window.lyra.onMenuOpenFile(handleOpenFile);
    const cleanupFolder = window.lyra.onMenuOpenFolder(handleOpenFolder);
    const cleanupSave = window.lyra.onMenuSave(handleSave);
    const cleanupNewProject = window.lyra.onMenuNewProject(() => setShowNewProject(true));
    const cleanupSettings = window.lyra.onMenuOpenSettings(() => setShowSettings(prev => !prev));
    const cleanupTerminal = window.lyra.onMenuToggleTerminal(() => setShowTerminal(prev => !prev));
    const cleanupChat = window.lyra.onMenuToggleChat(() => setShowChat(prev => !prev));
    const cleanupMdPreview = window.lyra.onMenuToggleMarkdownPreview(() => setShowMarkdownPreview(prev => !prev));
    const cleanupRun = window.lyra.onMenuRun(() => setShowTerminal(true));
    const cleanupRunFile = window.lyra.onMenuRunFile(handleRunFile);
    const cleanupStop = window.lyra.onMenuStop(() => { /* terminal handles its own stop */ });
    return () => {
      cleanupFile(); cleanupFolder(); cleanupSave(); cleanupNewProject();
      cleanupSettings(); cleanupTerminal(); cleanupChat(); cleanupMdPreview();
      cleanupRun(); cleanupRunFile(); cleanupStop();
    };
  }, [handleOpenFile, handleOpenFolder, handleSave, handleRunFile]);

  // Keyboard shortcuts (for shortcuts not handled by native menu accelerators)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setSidebarView(prev => prev === 'git' ? 'explorer' : 'git');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        setSidebarView(prev => prev === 'extensions' ? 'explorer' : 'extensions');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeTab = useEditorStore(s => s.tabs.find(t => t.path === s.activeTabPath));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Titlebar drag region */}
      <div style={{
        height: 'var(--titlebar-height)',
        WebkitAppRegion: 'drag' as any,
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 12,
        color: 'var(--text-secondary)',
        userSelect: 'none',
      }}>
        {rootPath ? rootPath.split('/').pop() : 'Lyra'}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity bar */}
        <div style={{
          width: 44,
          background: 'var(--bg-tertiary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 4,
          gap: 2,
          flexShrink: 0,
        }}>
          <ActivityBarButton
            icon="files"
            active={sidebarView === 'explorer'}
            onClick={() => setSidebarView('explorer')}
            title="Explorer"
          />
          <ActivityBarButton
            icon="git"
            active={sidebarView === 'git'}
            onClick={() => setSidebarView('git')}
            title="Source Control (Cmd+Shift+G)"
          />
          <ActivityBarButton
            icon="extensions"
            active={sidebarView === 'extensions'}
            onClick={() => setSidebarView('extensions')}
            title="Extensions (Cmd+Shift+X)"
          />
        </div>

        {/* Sidebar */}
        <Sidebar width={sidebarWidth} onResize={setSidebarWidth}>
          {sidebarView === 'explorer' ? (
            <FileExplorer
              onOpenFile={handleOpenFile}
              onOpenFolder={handleOpenFolder}
              onNewProject={() => setShowNewProject(true)}
            />
          ) : sidebarView === 'git' ? (
            <GitPanel />
          ) : (
            <ExtensionsPanel onOpenReadme={(extId, displayName, content) => {
              openFile(`ext-readme://${extId}`, `${displayName} README.md`, content);
            }} />
          )}
        </Sidebar>

        {/* Editor + Terminal area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <EditorTabs />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {activeTab ? (
              activeTab.path.startsWith('ext-readme://') ? (
                /* Extension README — render as full markdown preview */
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <MarkdownPreview
                    content={activeTab.content}
                    fileName={activeTab.name}
                  />
                </div>
              ) : (
              <>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <CodeEditor
                    key={activeTab.path}
                    content={activeTab.content}
                    language={activeTab.language}
                    onChange={(value) => updateContent(activeTab.path, value)}
                  />
                </div>
                {/* Markdown split preview — gated on extension */}
                {activeTab.language === 'markdown' && showMarkdownPreview && isMarkdownPreviewActive && (
                  <div style={{
                    flex: 1,
                    borderLeft: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <MarkdownPreview
                      content={activeTab.content}
                      fileName={activeTab.path.split('/').pop()}
                    />
                  </div>
                )}
              </>
              )
            ) : (
              <WelcomeScreen
                onOpenFolder={handleOpenFolder}
                onNewProject={() => setShowNewProject(true)}
              />
            )}
          </div>

          {/* Integrated Terminal */}
          {showTerminal && (
            <TerminalPanel
              height={terminalHeight}
              onResize={setTerminalHeight}
              cwd={rootPath || undefined}
              runCommand={runCommand}
              onCommandConsumed={() => setRunCommand(null)}
            />
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div style={{
            width: chatWidth,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}>
            <ChatPanel onClose={() => setShowChat(false)} onOpenSettings={() => setShowSettings(true)} />
          </div>
        )}
      </div>

      <StatusBar
        showChat={showChat}
        showTerminal={showTerminal}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
      />

      <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <NewProjectDialog
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}

function ActivityBarButton({ icon, active, onClick, title }: {
  icon: 'files' | 'git' | 'extensions';
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  const icons: Record<string, string> = {
    files: '\u{1F4C1}',       // folder icon
    git: '\u{1F500}',         // git branch icon
    extensions: '\u{1F9E9}',  // puzzle piece
  };

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        fontSize: 18,
        background: active ? 'var(--bg-hover)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        border: 'none',
        cursor: 'pointer',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      {icons[icon]}
    </button>
  );
}

function WelcomeScreen({ onOpenFolder, onNewProject }: { onOpenFolder: (path: string) => void; onNewProject: () => void }) {
  const handleOpen = async () => {
    const path = await window.lyra.fs.openFolderDialog();
    if (path) onOpenFolder(path);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      gap: 24,
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--text-secondary)' }}>Lyra</div>
      <div style={{ fontSize: 14 }}>Open-source IDE with AI Agents</div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={onNewProject}
          style={{
            padding: '10px 24px',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          New Project
        </button>
        <button
          onClick={handleOpen}
          style={{
            padding: '10px 24px',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid var(--border)',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
        >
          Open Folder
        </button>
      </div>

      <div style={{ fontSize: 12, marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div>
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+Shift+N</kbd>
          {' '}new project &middot;{' '}
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+Shift+O</kbd>
          {' '}open folder
        </div>
        <div>
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+`</kbd>
          {' '}terminal &middot;{' '}
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+B</kbd>
          {' '}AI chat &middot;{' '}
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+,</kbd>
          {' '}settings &middot;{' '}
          <kbd style={{ padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 3 }}>Cmd+Shift+X</kbd>
          {' '}extensions
        </div>
      </div>
    </div>
  );
}
