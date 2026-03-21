import { create } from 'zustand';
import type { FileEntry } from '@shared/types/file-system.types';

interface FileTreeState {
  rootPath: string | null;
  rootEntries: FileEntry[];
  expandedPaths: Set<string>;
  loadedChildren: Record<string, FileEntry[]>;
  setRootPath: (path: string) => void;
  setRootEntries: (entries: FileEntry[]) => void;
  toggleExpanded: (path: string) => void;
  setChildren: (path: string, children: FileEntry[]) => void;
  isExpanded: (path: string) => boolean;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  rootPath: null,
  rootEntries: [],
  expandedPaths: new Set(),
  loadedChildren: {},

  setRootPath: (path) => set({ rootPath: path, rootEntries: [], expandedPaths: new Set(), loadedChildren: {} }),

  setRootEntries: (entries) => set({ rootEntries: entries }),

  toggleExpanded: (path) => {
    set(state => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedPaths: next };
    });
  },

  setChildren: (path, children) => {
    set(state => ({
      loadedChildren: { ...state.loadedChildren, [path]: children },
    }));
  },

  isExpanded: (path) => get().expandedPaths.has(path),
}));
