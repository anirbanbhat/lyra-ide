export interface PythonEnvironment {
  name: string;
  path: string;
  version: string;
  type: 'system' | 'venv' | 'virtualenv' | 'conda' | 'pipenv' | 'pyenv';
  isActive: boolean;
}

export interface PythonDiagnostic {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  source: string;
  code?: string;
}

export interface PythonCompletionItem {
  label: string;
  kind: 'function' | 'variable' | 'class' | 'module' | 'keyword' | 'property' | 'method' | 'field' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

export interface PythonHoverInfo {
  contents: string;
  range?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

export interface PythonLocation {
  file: string;
  line: number;
  column: number;
}

export interface PythonTestItem {
  id: string;
  label: string;
  file: string;
  line: number;
  children?: PythonTestItem[];
  status?: 'passed' | 'failed' | 'skipped' | 'running' | 'pending';
  message?: string;
  duration?: number;
}

export interface PythonTestRunResult {
  tests: PythonTestItem[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

export interface PythonDebugConfig {
  program: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  port?: number;
  stopOnEntry?: boolean;
}

export interface PythonDebugState {
  running: boolean;
  paused: boolean;
  port: number | null;
  breakpoints: Array<{ file: string; line: number }>;
}

export interface PythonRefactorRequest {
  type: 'extract-variable' | 'extract-method' | 'rename' | 'sort-imports';
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  newName?: string;
  content: string;
}

export interface PythonRefactorResult {
  changes: Array<{
    file: string;
    content: string;
  }>;
}

export interface PythonFormatResult {
  formatted: string;
}

export interface PythonLintConfig {
  tool: 'pylint' | 'flake8' | 'mypy';
  enabled: boolean;
  args?: string[];
}

export interface PythonFormatConfig {
  tool: 'black' | 'autopep8' | 'yapf';
  args?: string[];
}
