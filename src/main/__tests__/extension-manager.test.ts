import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// Mock modules before importing the manager
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    rm: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('https', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('os', () => ({
  default: {
    homedir: () => '/mock-home',
  },
}));

import fs from 'fs/promises';
import { ExtensionManager } from '../extensions/manager';

describe('ExtensionManager', () => {
  let manager: ExtensionManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ExtensionManager();
  });

  describe('loadInstalled', () => {
    it('should create extensions directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));
      await manager.loadInstalled();
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.lyra/extensions'),
        { recursive: true }
      );
    });

    it('should load valid extensions from directory', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.toString().endsWith('extensions-state.json')) {
          return '{}';
        }
        if (filePath.toString().endsWith('package.json')) {
          return JSON.stringify({
            name: 'test-ext',
            displayName: 'Test Extension',
            version: '1.0.0',
            description: 'A test extension',
            author: 'Tester',
            type: 'plugin',
            'lyra-extension': true,
            main: 'index.js',
          });
        }
        throw new Error('file not found');
      });
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test-ext', isDirectory: () => true } as any,
      ]);

      await manager.loadInstalled();
      const installed = manager.getInstalled();
      expect(installed).toHaveLength(1);
      expect(installed[0].id).toBe('test-ext');
      expect(installed[0].displayName).toBe('Test Extension');
      expect(installed[0].enabled).toBe(true);
    });

    it('should skip directories without lyra-extension flag', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.toString().endsWith('extensions-state.json')) return '{}';
        if (filePath.toString().endsWith('package.json')) {
          return JSON.stringify({ name: 'not-an-ext', version: '1.0.0' });
        }
        throw new Error('not found');
      });
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'not-an-ext', isDirectory: () => true } as any,
      ]);

      await manager.loadInstalled();
      expect(manager.getInstalled()).toHaveLength(0);
    });

    it('should skip non-directory entries', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockResolvedValueOnce('{}');
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'some-file.json', isDirectory: () => false } as any,
      ]);

      await manager.loadInstalled();
      expect(manager.getInstalled()).toHaveLength(0);
    });

    it('should respect disabled state from state file', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.toString().endsWith('extensions-state.json')) {
          return JSON.stringify({ 'test-ext': { enabled: false } });
        }
        if (filePath.toString().endsWith('package.json')) {
          return JSON.stringify({
            name: 'test-ext',
            displayName: 'Test',
            version: '1.0.0',
            description: '',
            author: '',
            type: 'plugin',
            'lyra-extension': true,
          });
        }
        throw new Error('not found');
      });
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'test-ext', isDirectory: () => true } as any,
      ]);

      await manager.loadInstalled();
      const installed = manager.getInstalled();
      expect(installed[0].enabled).toBe(false);
    });
  });

  describe('getInstalled', () => {
    it('should return empty array when nothing is installed', () => {
      expect(manager.getInstalled()).toEqual([]);
    });
  });

  describe('search', () => {
    it('should return empty results when nothing matches', () => {
      expect(manager.search('nonexistent')).toEqual([]);
    });
  });

  describe('enable / disable', () => {
    it('should throw when enabling a non-installed extension', async () => {
      await expect(manager.enable('nonexistent')).rejects.toThrow('not installed');
    });

    it('should throw when disabling a non-installed extension', async () => {
      await expect(manager.disable('nonexistent')).rejects.toThrow('not installed');
    });
  });

  describe('uninstall', () => {
    it('should throw when uninstalling a non-installed extension', async () => {
      await expect(manager.uninstall('nonexistent')).rejects.toThrow('not installed');
    });
  });

  describe('getReadme', () => {
    it('should return null for non-installed extension', async () => {
      const result = await manager.getReadme('nonexistent');
      expect(result).toBeNull();
    });
  });
});
