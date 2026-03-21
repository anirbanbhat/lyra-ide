import { create } from 'zustand';
import type { ExtensionInfo, RegistryEntry } from '@shared/types/extension.types';

type ExtensionView = 'installed' | 'browse';

interface ExtensionsState {
  installed: ExtensionInfo[];
  registry: RegistryEntry[];
  searchQuery: string;
  loading: boolean;
  activeView: ExtensionView;

  setActiveView: (view: ExtensionView) => void;
  setSearchQuery: (query: string) => void;
  fetchInstalled: () => Promise<void>;
  fetchRegistry: () => Promise<void>;
  install: (id: string) => Promise<void>;
  uninstall: (id: string) => Promise<void>;
  toggleEnabled: (id: string) => Promise<void>;
  isExtensionActive: (id: string) => boolean;
}

export const useExtensionsStore = create<ExtensionsState>((set, get) => ({
  installed: [],
  registry: [],
  searchQuery: '',
  loading: false,
  activeView: 'browse',

  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchInstalled: async () => {
    const installed = await window.lyra.extensions.listInstalled();
    set({ installed });
  },

  fetchRegistry: async () => {
    set({ loading: true });
    try {
      const registry = await window.lyra.extensions.listRegistry();
      set({ registry });
    } finally {
      set({ loading: false });
    }
  },

  install: async (id: string) => {
    set({ loading: true });
    try {
      await window.lyra.extensions.install(id);
      await get().fetchInstalled();
    } finally {
      set({ loading: false });
    }
  },

  uninstall: async (id: string) => {
    set({ loading: true });
    try {
      await window.lyra.extensions.uninstall(id);
      await get().fetchInstalled();
    } finally {
      set({ loading: false });
    }
  },

  isExtensionActive: (id: string) => {
    return get().installed.some(e => e.id === id && e.enabled);
  },

  toggleEnabled: async (id: string) => {
    const ext = get().installed.find(e => e.id === id);
    if (!ext) return;

    if (ext.enabled) {
      await window.lyra.extensions.disable(id);
    } else {
      await window.lyra.extensions.enable(id);
    }
    await get().fetchInstalled();
  },
}));
