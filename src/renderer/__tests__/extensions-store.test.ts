import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockLyra } from './setup';
import { useExtensionsStore } from '../store/extensions.store';

describe('Extensions Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExtensionsStore.setState({
      installed: [],
      registry: [],
      searchQuery: '',
      loading: false,
      activeView: 'browse',
    });
  });

  describe('setActiveView', () => {
    it('should switch between installed and browse views', () => {
      useExtensionsStore.getState().setActiveView('installed');
      expect(useExtensionsStore.getState().activeView).toBe('installed');
      useExtensionsStore.getState().setActiveView('browse');
      expect(useExtensionsStore.getState().activeView).toBe('browse');
    });
  });

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      useExtensionsStore.getState().setSearchQuery('markdown');
      expect(useExtensionsStore.getState().searchQuery).toBe('markdown');
    });
  });

  describe('fetchInstalled', () => {
    it('should fetch and set installed extensions', async () => {
      const mockInstalled = [
        { id: 'ext-1', displayName: 'Ext 1', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: true, installed: true },
      ];
      mockLyra.extensions.listInstalled.mockResolvedValueOnce(mockInstalled);

      await useExtensionsStore.getState().fetchInstalled();
      expect(useExtensionsStore.getState().installed).toEqual(mockInstalled);
    });
  });

  describe('fetchRegistry', () => {
    it('should fetch registry and manage loading state', async () => {
      const mockRegistry = [
        { name: 'ext-1', displayName: 'Ext 1', version: '1.0.0', description: '', author: '', type: 'plugin' as const, url: '' },
      ];
      mockLyra.extensions.listRegistry.mockResolvedValueOnce(mockRegistry);

      await useExtensionsStore.getState().fetchRegistry();
      expect(useExtensionsStore.getState().registry).toEqual(mockRegistry);
      expect(useExtensionsStore.getState().loading).toBe(false);
    });

    it('should set loading to false even on error', async () => {
      mockLyra.extensions.listRegistry.mockRejectedValueOnce(new Error('network error'));

      try {
        await useExtensionsStore.getState().fetchRegistry();
      } catch {}
      expect(useExtensionsStore.getState().loading).toBe(false);
    });
  });

  describe('install', () => {
    it('should call install and refresh installed list', async () => {
      mockLyra.extensions.install.mockResolvedValueOnce(undefined);
      mockLyra.extensions.listInstalled.mockResolvedValueOnce([
        { id: 'new-ext', displayName: 'New', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: true, installed: true },
      ]);

      await useExtensionsStore.getState().install('new-ext');
      expect(mockLyra.extensions.install).toHaveBeenCalledWith('new-ext');
      expect(useExtensionsStore.getState().installed).toHaveLength(1);
      expect(useExtensionsStore.getState().loading).toBe(false);
    });
  });

  describe('uninstall', () => {
    it('should call uninstall and refresh installed list', async () => {
      mockLyra.extensions.uninstall.mockResolvedValueOnce(undefined);
      mockLyra.extensions.listInstalled.mockResolvedValueOnce([]);

      await useExtensionsStore.getState().uninstall('ext-1');
      expect(mockLyra.extensions.uninstall).toHaveBeenCalledWith('ext-1');
      expect(useExtensionsStore.getState().installed).toEqual([]);
    });
  });

  describe('toggleEnabled', () => {
    it('should disable an enabled extension', async () => {
      useExtensionsStore.setState({
        installed: [{ id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: true, installed: true }],
      });
      mockLyra.extensions.listInstalled.mockResolvedValueOnce([
        { id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: false, installed: true },
      ]);

      await useExtensionsStore.getState().toggleEnabled('ext-1');
      expect(mockLyra.extensions.disable).toHaveBeenCalledWith('ext-1');
    });

    it('should enable a disabled extension', async () => {
      useExtensionsStore.setState({
        installed: [{ id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: false, installed: true }],
      });
      mockLyra.extensions.listInstalled.mockResolvedValueOnce([
        { id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: true, installed: true },
      ]);

      await useExtensionsStore.getState().toggleEnabled('ext-1');
      expect(mockLyra.extensions.enable).toHaveBeenCalledWith('ext-1');
    });

    it('should do nothing for non-installed extension', async () => {
      await useExtensionsStore.getState().toggleEnabled('nonexistent');
      expect(mockLyra.extensions.enable).not.toHaveBeenCalled();
      expect(mockLyra.extensions.disable).not.toHaveBeenCalled();
    });
  });

  describe('isExtensionActive', () => {
    it('should return true for enabled installed extension', () => {
      useExtensionsStore.setState({
        installed: [{ id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: true, installed: true }],
      });
      expect(useExtensionsStore.getState().isExtensionActive('ext-1')).toBe(true);
    });

    it('should return false for disabled extension', () => {
      useExtensionsStore.setState({
        installed: [{ id: 'ext-1', displayName: 'Ext', version: '1.0.0', description: '', author: '', type: 'plugin' as const, enabled: false, installed: true }],
      });
      expect(useExtensionsStore.getState().isExtensionActive('ext-1')).toBe(false);
    });

    it('should return false for non-installed extension', () => {
      expect(useExtensionsStore.getState().isExtensionActive('unknown')).toBe(false);
    });
  });
});
