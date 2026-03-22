export const IPC = {
  // File system
  FS_READ_FILE: 'fs:read-file',
  FS_WRITE_FILE: 'fs:write-file',
  FS_LIST_DIR: 'fs:list-dir',
  FS_OPEN_DIALOG: 'fs:open-dialog',
  FS_OPEN_FOLDER_DIALOG: 'fs:open-folder-dialog',
  FS_SAVE_DIALOG: 'fs:save-dialog',
  FS_WATCH: 'fs:watch',
  FS_UNWATCH: 'fs:unwatch',
  FS_STAT: 'fs:stat',
  FS_CREATE_FILE: 'fs:create-file',
  FS_CREATE_DIR: 'fs:create-dir',
  FS_DELETE: 'fs:delete',
  FS_RENAME: 'fs:rename',
  FS_NEW_PROJECT: 'fs:new-project',

  // Terminal
  TERMINAL_SPAWN: 'terminal:spawn',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',
  TERMINAL_DATA: 'terminal:data',
  TERMINAL_EXIT: 'terminal:exit',

  // AI Agents
  AGENT_LIST: 'agent:list',
  AGENT_SEND: 'agent:send',
  AGENT_STREAM: 'agent:stream',
  AGENT_STREAM_END: 'agent:stream-end',
  AGENT_STOP: 'agent:stop',
  AGENT_GET_CONFIG: 'agent:get-config',
  AGENT_SET_MODEL: 'agent:set-model',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // Auth
  AUTH_OPEN_URL: 'auth:open-url',
  AUTH_START_CALLBACK_SERVER: 'auth:start-callback-server',
  AUTH_STOP_CALLBACK_SERVER: 'auth:stop-callback-server',

  // Git
  GIT_STATUS: 'git:status',
  GIT_STAGE: 'git:stage',
  GIT_UNSTAGE: 'git:unstage',
  GIT_COMMIT: 'git:commit',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_LOG: 'git:log',
  GIT_DIFF: 'git:diff',
  GIT_BRANCHES: 'git:branches',
  GIT_CHECKOUT: 'git:checkout',
  GIT_CREATE_BRANCH: 'git:create-branch',
  GIT_INIT: 'git:init',
  GIT_GET_CONFIG: 'git:get-config',
  GIT_SET_CONFIG: 'git:set-config',

  // Extensions
  EXT_LIST_INSTALLED: 'ext:list-installed',
  EXT_LIST_REGISTRY: 'ext:list-registry',
  EXT_SEARCH: 'ext:search',
  EXT_INSTALL: 'ext:install',
  EXT_UNINSTALL: 'ext:uninstall',
  EXT_ENABLE: 'ext:enable',
  EXT_DISABLE: 'ext:disable',
  EXT_README: 'ext:readme',

  // Markdown / PDF
  MD_EXPORT_PDF: 'md:export-pdf',

  // Extension host
  EXT_CALL: 'ext:call',

  // Python extension channels (routed through ext:call)
  PYTHON_DETECT_ENVS: 'python:detect-envs',
  PYTHON_SET_ENV: 'python:set-env',
  PYTHON_GET_ACTIVE_ENV: 'python:get-active-env',
  PYTHON_LINT: 'python:lint',
  PYTHON_FORMAT: 'python:format',
  PYTHON_COMPLETIONS: 'python:completions',
  PYTHON_HOVER: 'python:hover',
  PYTHON_GOTO_DEF: 'python:goto-def',
  PYTHON_FIND_REFS: 'python:find-refs',
  PYTHON_DIAGNOSTICS: 'python:diagnostics',
  PYTHON_DISCOVER_TESTS: 'python:discover-tests',
  PYTHON_RUN_TESTS: 'python:run-tests',
  PYTHON_DEBUG_START: 'python:debug-start',
  PYTHON_DEBUG_STOP: 'python:debug-stop',
  PYTHON_DEBUG_STATE: 'python:debug-state',
  PYTHON_REFACTOR: 'python:refactor',
  PYTHON_SORT_IMPORTS: 'python:sort-imports',
  PYTHON_GET_CONFIG: 'python:get-config',
  PYTHON_SET_CONFIG: 'python:set-config',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
} as const;
