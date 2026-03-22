import { create } from 'zustand';
import type {
  PythonEnvironment,
  PythonDiagnostic,
  PythonTestItem,
  PythonTestRunResult,
  PythonDebugState,
} from '@shared/types/python.types';

type PythonView = 'environments' | 'tests' | 'diagnostics';

interface PythonState {
  activeView: PythonView;
  environments: PythonEnvironment[];
  activeEnvPath: string | null;
  diagnostics: PythonDiagnostic[];
  tests: PythonTestItem[];
  testRunning: boolean;
  lastTestResult: PythonTestRunResult | null;
  debugState: PythonDebugState;
  loading: boolean;
  lintTool: string;
  formatTool: string;
  testFramework: string;

  setActiveView: (view: PythonView) => void;
  detectEnvironments: (cwd: string) => Promise<void>;
  setEnvironment: (envPath: string) => Promise<void>;
  runLint: (filePath: string, content: string) => Promise<void>;
  formatCode: (filePath: string, content: string) => Promise<string>;
  discoverTests: (cwd: string) => Promise<void>;
  runTests: (cwd: string, testIds?: string[]) => Promise<void>;
  startDebug: (config: any) => Promise<void>;
  stopDebug: () => Promise<void>;
  refreshDebugState: () => Promise<void>;
  sortImports: (filePath: string, content: string) => Promise<string>;
  setLintTool: (tool: string) => void;
  setFormatTool: (tool: string) => void;
  setTestFramework: (framework: string) => void;
}

export const usePythonStore = create<PythonState>((set, get) => ({
  activeView: 'environments',
  environments: [],
  activeEnvPath: null,
  diagnostics: [],
  tests: [],
  testRunning: false,
  lastTestResult: null,
  debugState: { running: false, paused: false, port: null, breakpoints: [] },
  loading: false,
  lintTool: 'pylint',
  formatTool: 'black',
  testFramework: 'pytest',

  setActiveView: (view) => set({ activeView: view }),

  detectEnvironments: async (cwd) => {
    set({ loading: true });
    try {
      const environments = await window.lyra.python.detectEnvs(cwd);
      const activeEnv = await window.lyra.python.getActiveEnv();
      set({ environments, activeEnvPath: activeEnv?.path || null });
    } catch {
      set({ environments: [] });
    } finally {
      set({ loading: false });
    }
  },

  setEnvironment: async (envPath) => {
    await window.lyra.python.setEnv(envPath);
    set({ activeEnvPath: envPath });
  },

  runLint: async (filePath, content) => {
    try {
      const diagnostics = await window.lyra.python.lint(filePath, content, get().lintTool);
      set({ diagnostics });
    } catch {
      set({ diagnostics: [] });
    }
  },

  formatCode: async (filePath, content) => {
    try {
      const result = await window.lyra.python.format(filePath, content, get().formatTool);
      return result.formatted || content;
    } catch {
      return content;
    }
  },

  discoverTests: async (cwd) => {
    set({ loading: true });
    try {
      const tests = await window.lyra.python.discoverTests(cwd);
      set({ tests });
    } catch {
      set({ tests: [] });
    } finally {
      set({ loading: false });
    }
  },

  runTests: async (cwd, testIds) => {
    set({ testRunning: true });
    try {
      const result = await window.lyra.python.runTests(cwd, testIds);
      set({ lastTestResult: result, tests: result.tests || get().tests });
    } catch {
      // Keep existing tests
    } finally {
      set({ testRunning: false });
    }
  },

  startDebug: async (config) => {
    try {
      await window.lyra.python.debugStart(config);
      set({ debugState: { running: true, paused: false, port: null, breakpoints: [] } });
    } catch {}
  },

  stopDebug: async () => {
    try {
      await window.lyra.python.debugStop();
      set({ debugState: { running: false, paused: false, port: null, breakpoints: [] } });
    } catch {}
  },

  refreshDebugState: async () => {
    try {
      const state = await window.lyra.python.debugState();
      set({ debugState: state });
    } catch {}
  },

  sortImports: async (filePath, content) => {
    try {
      const result = await window.lyra.python.sortImports(filePath, content);
      if (result.changes && result.changes.length > 0) {
        return result.changes[0].content;
      }
      return content;
    } catch {
      return content;
    }
  },

  setLintTool: (tool) => set({ lintTool: tool }),
  setFormatTool: (tool) => set({ formatTool: tool }),
  setTestFramework: (framework) => set({ testFramework: framework }),
}));
