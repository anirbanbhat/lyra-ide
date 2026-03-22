import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../store/editor.store';

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    useEditorStore.setState({ tabs: [], activeTabPath: null });
  });

  describe('openFile', () => {
    it('should open a new tab', () => {
      useEditorStore.getState().openFile('/src/index.ts', 'index.ts', 'const x = 1;');
      const state = useEditorStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].path).toBe('/src/index.ts');
      expect(state.tabs[0].name).toBe('index.ts');
      expect(state.tabs[0].content).toBe('const x = 1;');
      expect(state.tabs[0].isDirty).toBe(false);
      expect(state.activeTabPath).toBe('/src/index.ts');
    });

    it('should detect language from file extension', () => {
      useEditorStore.getState().openFile('/test.py', 'test.py', '');
      expect(useEditorStore.getState().tabs[0].language).toBe('python');

      useEditorStore.getState().openFile('/test.rs', 'test.rs', '');
      expect(useEditorStore.getState().tabs[1].language).toBe('rust');

      useEditorStore.getState().openFile('/test.go', 'test.go', '');
      expect(useEditorStore.getState().tabs[2].language).toBe('go');
    });

    it('should detect typescript for .ts and .tsx', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().openFile('/b.tsx', 'b.tsx', '');
      expect(useEditorStore.getState().tabs[0].language).toBe('typescript');
      expect(useEditorStore.getState().tabs[1].language).toBe('typescript');
    });

    it('should default to plaintext for unknown extensions', () => {
      useEditorStore.getState().openFile('/file.xyz', 'file.xyz', '');
      expect(useEditorStore.getState().tabs[0].language).toBe('plaintext');
    });

    it('should not duplicate tab if file is already open', () => {
      useEditorStore.getState().openFile('/src/a.ts', 'a.ts', 'content');
      useEditorStore.getState().openFile('/src/b.ts', 'b.ts', 'other');
      useEditorStore.getState().openFile('/src/a.ts', 'a.ts', 'content');
      const state = useEditorStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.activeTabPath).toBe('/src/a.ts');
    });

    it('should set newly opened tab as active', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().openFile('/b.ts', 'b.ts', '');
      expect(useEditorStore.getState().activeTabPath).toBe('/b.ts');
    });
  });

  describe('closeTab', () => {
    it('should remove the tab', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().closeTab('/a.ts');
      expect(useEditorStore.getState().tabs).toHaveLength(0);
    });

    it('should activate adjacent tab when closing active tab', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().openFile('/b.ts', 'b.ts', '');
      useEditorStore.getState().openFile('/c.ts', 'c.ts', '');
      useEditorStore.getState().setActiveTab('/b.ts');
      useEditorStore.getState().closeTab('/b.ts');
      // Should activate next available tab
      const state = useEditorStore.getState();
      expect(state.tabs).toHaveLength(2);
      expect(state.activeTabPath).not.toBeNull();
    });

    it('should set activeTabPath to null when closing last tab', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().closeTab('/a.ts');
      expect(useEditorStore.getState().activeTabPath).toBeNull();
    });

    it('should not change active tab when closing non-active tab', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', '');
      useEditorStore.getState().openFile('/b.ts', 'b.ts', '');
      useEditorStore.getState().closeTab('/a.ts');
      expect(useEditorStore.getState().activeTabPath).toBe('/b.ts');
    });
  });

  describe('updateContent', () => {
    it('should update content and mark tab as dirty', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', 'original');
      useEditorStore.getState().updateContent('/a.ts', 'modified');
      const tab = useEditorStore.getState().tabs[0];
      expect(tab.content).toBe('modified');
      expect(tab.isDirty).toBe(true);
    });
  });

  describe('markSaved', () => {
    it('should mark a dirty tab as not dirty', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', 'content');
      useEditorStore.getState().updateContent('/a.ts', 'changed');
      expect(useEditorStore.getState().tabs[0].isDirty).toBe(true);
      useEditorStore.getState().markSaved('/a.ts');
      expect(useEditorStore.getState().tabs[0].isDirty).toBe(false);
    });
  });

  describe('getActiveTab', () => {
    it('should return the active tab', () => {
      useEditorStore.getState().openFile('/a.ts', 'a.ts', 'content A');
      useEditorStore.getState().openFile('/b.ts', 'b.ts', 'content B');
      const active = useEditorStore.getState().getActiveTab();
      expect(active?.path).toBe('/b.ts');
      expect(active?.content).toBe('content B');
    });

    it('should return undefined when no tabs are open', () => {
      expect(useEditorStore.getState().getActiveTab()).toBeUndefined();
    });
  });
});
