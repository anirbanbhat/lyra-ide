import { create } from 'zustand';

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabPath: string | null;
  openFile: (path: string, name: string, content: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  markSaved: (path: string) => void;
  getActiveTab: () => EditorTab | undefined;
}

function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', java: 'java',
    html: 'html', css: 'css', scss: 'scss', less: 'less',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', sh: 'shell', bash: 'shell', zsh: 'shell',
    sql: 'sql', graphql: 'graphql', xml: 'xml', svg: 'xml',
    c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
    rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
    dockerfile: 'dockerfile', makefile: 'makefile',
  };
  return map[ext] || 'plaintext';
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabPath: null,

  openFile: (path, name, content) => {
    const existing = get().tabs.find(t => t.path === path);
    if (existing) {
      set({ activeTabPath: path });
      return;
    }
    const tab: EditorTab = {
      path,
      name,
      content,
      isDirty: false,
      language: detectLanguage(name),
    };
    set(state => ({
      tabs: [...state.tabs, tab],
      activeTabPath: path,
    }));
  },

  closeTab: (path) => {
    set(state => {
      const newTabs = state.tabs.filter(t => t.path !== path);
      let newActive = state.activeTabPath;
      if (newActive === path) {
        const idx = state.tabs.findIndex(t => t.path === path);
        newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.path || null;
      }
      return { tabs: newTabs, activeTabPath: newActive };
    });
  },

  setActiveTab: (path) => set({ activeTabPath: path }),

  updateContent: (path, content) => {
    set(state => ({
      tabs: state.tabs.map(t =>
        t.path === path ? { ...t, content, isDirty: true } : t
      ),
    }));
  },

  markSaved: (path) => {
    set(state => ({
      tabs: state.tabs.map(t =>
        t.path === path ? { ...t, isDirty: false } : t
      ),
    }));
  },

  getActiveTab: () => {
    const state = get();
    return state.tabs.find(t => t.path === state.activeTabPath);
  },
}));
