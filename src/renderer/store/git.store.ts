import { create } from 'zustand';
import type { GitStatus, GitLogEntry, GitConfig, GitBranch } from '@shared/types/git.types';

type GitView = 'changes' | 'log' | 'branches' | 'config';

interface GitState {
  status: GitStatus | null;
  log: GitLogEntry[];
  branches: GitBranch[];
  config: GitConfig | null;
  activeView: GitView;
  commitMessage: string;
  loading: boolean;
  error: string | null;
  diffContent: string | null;
  diffFile: string | null;

  setActiveView: (view: GitView) => void;
  setCommitMessage: (msg: string) => void;
  setError: (err: string | null) => void;

  refresh: (cwd: string) => Promise<void>;
  fetchLog: (cwd: string) => Promise<void>;
  fetchBranches: (cwd: string) => Promise<void>;
  fetchConfig: (cwd: string) => Promise<void>;
  stageFiles: (cwd: string, files: string[]) => Promise<void>;
  unstageFiles: (cwd: string, files: string[]) => Promise<void>;
  stageAll: (cwd: string) => Promise<void>;
  commit: (cwd: string) => Promise<void>;
  push: (cwd: string) => Promise<void>;
  pull: (cwd: string) => Promise<void>;
  checkoutBranch: (cwd: string, branch: string) => Promise<void>;
  createBranch: (cwd: string, name: string) => Promise<void>;
  initRepo: (cwd: string) => Promise<void>;
  saveConfig: (cwd: string, config: GitConfig) => Promise<void>;
  viewDiff: (cwd: string, filePath?: string) => Promise<void>;
}

export const useGitStore = create<GitState>((set, get) => ({
  status: null,
  log: [],
  branches: [],
  config: null,
  activeView: 'changes',
  commitMessage: '',
  loading: false,
  error: null,
  diffContent: null,
  diffFile: null,

  setActiveView: (view) => set({ activeView: view }),
  setCommitMessage: (msg) => set({ commitMessage: msg }),
  setError: (err) => set({ error: err }),

  refresh: async (cwd) => {
    try {
      const status = await window.lyra.git.status(cwd);
      set({ status, error: null });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  fetchLog: async (cwd) => {
    try {
      const log = await window.lyra.git.log(cwd, 50);
      set({ log });
    } catch {
      set({ log: [] });
    }
  },

  fetchBranches: async (cwd) => {
    try {
      const branches = await window.lyra.git.branches(cwd);
      set({ branches });
    } catch {
      set({ branches: [] });
    }
  },

  fetchConfig: async (cwd) => {
    try {
      const config = await window.lyra.git.getConfig(cwd);
      set({ config });
    } catch {}
  },

  stageFiles: async (cwd, files) => {
    await window.lyra.git.stage(cwd, files);
    await get().refresh(cwd);
  },

  unstageFiles: async (cwd, files) => {
    await window.lyra.git.unstage(cwd, files);
    await get().refresh(cwd);
  },

  stageAll: async (cwd) => {
    await window.lyra.git.stage(cwd, ['.']);
    await get().refresh(cwd);
  },

  commit: async (cwd) => {
    const msg = get().commitMessage.trim();
    if (!msg) { set({ error: 'Commit message is required' }); return; }
    set({ loading: true, error: null });
    try {
      await window.lyra.git.commit(cwd, msg);
      set({ commitMessage: '' });
      await get().refresh(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  push: async (cwd) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.push(cwd);
      await get().refresh(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  pull: async (cwd) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.pull(cwd);
      await get().refresh(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  checkoutBranch: async (cwd, branch) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.checkout(cwd, branch);
      await get().refresh(cwd);
      await get().fetchBranches(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  createBranch: async (cwd, name) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.createBranch(cwd, name);
      await get().refresh(cwd);
      await get().fetchBranches(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  initRepo: async (cwd) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.init(cwd);
      await get().refresh(cwd);
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  saveConfig: async (cwd, config) => {
    set({ loading: true, error: null });
    try {
      await window.lyra.git.setConfig(cwd, config);
      set({ config });
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ loading: false });
    }
  },

  viewDiff: async (cwd, filePath) => {
    try {
      const content = await window.lyra.git.diff(cwd, filePath);
      set({ diffContent: content, diffFile: filePath || null });
    } catch {
      set({ diffContent: '', diffFile: null });
    }
  },
}));
