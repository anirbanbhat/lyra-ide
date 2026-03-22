import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc-channels';
import type { FileEntry, FileStat, FSWatchEvent } from '@shared/types/file-system.types';
import type { AgentInfo, AgentMessage, AgentStreamChunk, AgentRequestOptions } from '@shared/types/agent.types';
import type { TerminalSpawnOpts } from '@shared/types/terminal.types';
import type { ExtensionInfo, RegistryEntry } from '@shared/types/extension.types';
import type { GitStatus, GitLogEntry, GitConfig, GitBranch } from '@shared/types/git.types';

const lyraAPI = {
  fs: {
    readFile: (path: string): Promise<string> =>
      ipcRenderer.invoke(IPC.FS_READ_FILE, path),
    writeFile: (path: string, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_WRITE_FILE, path, content),
    listDir: (path: string): Promise<FileEntry[]> =>
      ipcRenderer.invoke(IPC.FS_LIST_DIR, path),
    stat: (path: string): Promise<FileStat> =>
      ipcRenderer.invoke(IPC.FS_STAT, path),
    openDialog: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC.FS_OPEN_DIALOG),
    openFolderDialog: (): Promise<string | null> =>
      ipcRenderer.invoke(IPC.FS_OPEN_FOLDER_DIALOG),
    saveDialog: (defaultPath?: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.FS_SAVE_DIALOG, defaultPath),
    createFile: (path: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_CREATE_FILE, path),
    createDir: (path: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_CREATE_DIR, path),
    delete: (path: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_DELETE, path),
    rename: (oldPath: string, newPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_RENAME, oldPath, newPath),
    copy: (srcPath: string, destPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FS_COPY, srcPath, destPath),
    newProject: (projectName: string, parentDir: string, template: string): Promise<string> =>
      ipcRenderer.invoke(IPC.FS_NEW_PROJECT, projectName, parentDir, template),
  },

  terminal: {
    spawn: (opts: TerminalSpawnOpts): Promise<string> =>
      ipcRenderer.invoke(IPC.TERMINAL_SPAWN, opts),
    write: (id: string, data: string): void =>
      ipcRenderer.send(IPC.TERMINAL_WRITE, id, data),
    resize: (id: string, cols: number, rows: number): void =>
      ipcRenderer.send(IPC.TERMINAL_RESIZE, id, cols, rows),
    kill: (id: string): void =>
      ipcRenderer.send(IPC.TERMINAL_KILL, id),
    onData: (callback: (id: string, data: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, id: string, data: string) => callback(id, data);
      ipcRenderer.on(IPC.TERMINAL_DATA, handler);
      return () => ipcRenderer.removeListener(IPC.TERMINAL_DATA, handler);
    },
    onExit: (callback: (id: string, code: number) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, id: string, code: number) => callback(id, code);
      ipcRenderer.on(IPC.TERMINAL_EXIT, handler);
      return () => ipcRenderer.removeListener(IPC.TERMINAL_EXIT, handler);
    },
  },

  agent: {
    list: (): Promise<AgentInfo[]> =>
      ipcRenderer.invoke(IPC.AGENT_LIST),
    send: (agentId: string, messages: AgentMessage[], options?: AgentRequestOptions): Promise<void> =>
      ipcRenderer.invoke(IPC.AGENT_SEND, agentId, messages, options),
    stop: (): void =>
      ipcRenderer.send(IPC.AGENT_STOP),
    onStream: (callback: (chunk: AgentStreamChunk) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, chunk: AgentStreamChunk) => callback(chunk);
      ipcRenderer.on(IPC.AGENT_STREAM, handler);
      return () => ipcRenderer.removeListener(IPC.AGENT_STREAM, handler);
    },
  },

  settings: {
    get: (key?: string): Promise<unknown> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key: string, value: unknown): Promise<void> =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
    getAll: (): Promise<Record<string, unknown>> =>
      ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
  },

  auth: {
    openUrl: (url: string): Promise<void> =>
      ipcRenderer.invoke(IPC.AUTH_OPEN_URL, url),
    startCallbackServer: (): Promise<number> =>
      ipcRenderer.invoke(IPC.AUTH_START_CALLBACK_SERVER),
    stopCallbackServer: (): Promise<void> =>
      ipcRenderer.invoke(IPC.AUTH_STOP_CALLBACK_SERVER),
    onKeyReceived: (callback: (key: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, key: string) => callback(key);
      ipcRenderer.on('auth:key-received', handler);
      return () => ipcRenderer.removeListener('auth:key-received', handler);
    },
  },

  git: {
    status: (cwd: string): Promise<GitStatus> =>
      ipcRenderer.invoke(IPC.GIT_STATUS, cwd),
    stage: (cwd: string, files: string[]): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_STAGE, cwd, files),
    unstage: (cwd: string, files: string[]): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_UNSTAGE, cwd, files),
    commit: (cwd: string, message: string): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_COMMIT, cwd, message),
    push: (cwd: string): Promise<string> =>
      ipcRenderer.invoke(IPC.GIT_PUSH, cwd),
    pull: (cwd: string): Promise<string> =>
      ipcRenderer.invoke(IPC.GIT_PULL, cwd),
    log: (cwd: string, count?: number): Promise<GitLogEntry[]> =>
      ipcRenderer.invoke(IPC.GIT_LOG, cwd, count),
    diff: (cwd: string, filePath?: string): Promise<string> =>
      ipcRenderer.invoke(IPC.GIT_DIFF, cwd, filePath),
    branches: (cwd: string): Promise<GitBranch[]> =>
      ipcRenderer.invoke(IPC.GIT_BRANCHES, cwd),
    checkout: (cwd: string, branch: string): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_CHECKOUT, cwd, branch),
    createBranch: (cwd: string, name: string): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_CREATE_BRANCH, cwd, name),
    init: (cwd: string): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_INIT, cwd),
    getConfig: (cwd: string): Promise<GitConfig> =>
      ipcRenderer.invoke(IPC.GIT_GET_CONFIG, cwd),
    setConfig: (cwd: string, config: GitConfig): Promise<void> =>
      ipcRenderer.invoke(IPC.GIT_SET_CONFIG, cwd, config),
  },

  markdown: {
    exportPdf: (htmlContent: string, defaultName?: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.MD_EXPORT_PDF, htmlContent, defaultName),
  },

  python: {
    detectEnvs: (cwd: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DETECT_ENVS, cwd),
    setEnv: (envPath: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_SET_ENV, envPath),
    getActiveEnv: () =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_GET_ACTIVE_ENV),
    lint: (filePath: string, content: string, tool?: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_LINT, filePath, content, tool),
    format: (filePath: string, content: string, tool?: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_FORMAT, filePath, content, tool),
    completions: (filePath: string, content: string, line: number, column: number) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_COMPLETIONS, filePath, content, line, column),
    hover: (filePath: string, content: string, line: number, column: number) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_HOVER, filePath, content, line, column),
    gotoDef: (filePath: string, content: string, line: number, column: number) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_GOTO_DEF, filePath, content, line, column),
    findRefs: (filePath: string, content: string, line: number, column: number) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_FIND_REFS, filePath, content, line, column),
    diagnostics: (filePath: string, content: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DIAGNOSTICS, filePath, content),
    discoverTests: (cwd: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DISCOVER_TESTS, cwd),
    runTests: (cwd: string, testIds?: string[]) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_RUN_TESTS, cwd, testIds),
    debugStart: (config: any) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DEBUG_START, config),
    debugStop: () =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DEBUG_STOP),
    debugState: () =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_DEBUG_STATE),
    refactor: (request: any) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_REFACTOR, request),
    sortImports: (filePath: string, content: string) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_SORT_IMPORTS, filePath, content),
    getConfig: () =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_GET_CONFIG),
    setConfig: (config: any) =>
      ipcRenderer.invoke(IPC.EXT_CALL, IPC.PYTHON_SET_CONFIG, config),
  },

  extensions: {
    listInstalled: (): Promise<ExtensionInfo[]> =>
      ipcRenderer.invoke(IPC.EXT_LIST_INSTALLED),
    listRegistry: (): Promise<RegistryEntry[]> =>
      ipcRenderer.invoke(IPC.EXT_LIST_REGISTRY),
    search: (query: string): Promise<ExtensionInfo[]> =>
      ipcRenderer.invoke(IPC.EXT_SEARCH, query),
    install: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.EXT_INSTALL, id),
    uninstall: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.EXT_UNINSTALL, id),
    enable: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.EXT_ENABLE, id),
    disable: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.EXT_DISABLE, id),
    getReadme: (id: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.EXT_README, id),
  },

  // Menu event listeners
  onMenuOpenFile: (callback: (path: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('menu:open-file', handler);
    return () => ipcRenderer.removeListener('menu:open-file', handler);
  },
  onMenuOpenFolder: (callback: (path: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('menu:open-folder', handler);
    return () => ipcRenderer.removeListener('menu:open-folder', handler);
  },
  onMenuSave: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save', handler);
    return () => ipcRenderer.removeListener('menu:save', handler);
  },
  onMenuNewProject: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:new-project', handler);
    return () => ipcRenderer.removeListener('menu:new-project', handler);
  },
  onMenuOpenSettings: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:open-settings', handler);
    return () => ipcRenderer.removeListener('menu:open-settings', handler);
  },
  onMenuToggleTerminal: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:toggle-terminal', handler);
    return () => ipcRenderer.removeListener('menu:toggle-terminal', handler);
  },
  onMenuToggleChat: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:toggle-chat', handler);
    return () => ipcRenderer.removeListener('menu:toggle-chat', handler);
  },
  onMenuToggleMarkdownPreview: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:toggle-markdown-preview', handler);
    return () => ipcRenderer.removeListener('menu:toggle-markdown-preview', handler);
  },
  onMenuRun: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:run', handler);
    return () => ipcRenderer.removeListener('menu:run', handler);
  },
  onMenuRunFile: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:run-file', handler);
    return () => ipcRenderer.removeListener('menu:run-file', handler);
  },
  onMenuStop: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:stop', handler);
    return () => ipcRenderer.removeListener('menu:stop', handler);
  },
};

contextBridge.exposeInMainWorld('lyra', lyraAPI);

// Type declaration for renderer
export type LyraAPI = typeof lyraAPI;
