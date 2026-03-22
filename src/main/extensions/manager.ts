import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import https from 'https';
import { execFile } from 'child_process';
import { EXTENSIONS_DIR, REGISTRY_URL } from '@shared/constants';
import type { ExtensionInfo, ExtensionManifest, RegistryEntry } from '@shared/types/extension.types';
import { extensionHost } from './host';

interface ExtensionState {
  enabled: boolean;
}

function fetchJSON(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Lyra-IDE' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function gitClone(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('git', ['clone', '--depth', '1', url, dest], (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

export class ExtensionManager {
  private extensionsDir = path.join(os.homedir(), EXTENSIONS_DIR);
  private statePath = path.join(os.homedir(), EXTENSIONS_DIR, 'extensions-state.json');
  private registryCachePath = path.join(os.homedir(), EXTENSIONS_DIR, 'registry.json');
  private installed = new Map<string, { manifest: ExtensionManifest; enabled: boolean; path: string }>();

  private static DEFAULT_EXTENSIONS = ['lyra-markdown-preview'];

  // Bundled fallback entries — merged into registry when remote + cache don't have them
  private static BUILTIN_REGISTRY: RegistryEntry[] = [
    {
      name: 'lyra-markdown-preview',
      displayName: 'Markdown Preview',
      version: '1.0.0',
      description: 'Live Markdown preview with Mermaid diagram support and PDF export',
      author: 'Lyra',
      type: 'plugin',
      url: '',
      repository: 'https://github.com/anirbanbhat/lyra-markdown-preview.git',
    },
    {
      name: 'lyra-vim-keys',
      displayName: 'Vim Keybindings',
      version: '1.0.0',
      description: 'Vim-style keyboard shortcuts for the editor',
      author: 'Lyra Community',
      type: 'plugin',
      url: '',
      repository: 'https://github.com/anirbanbhat/lyra-vim-keys.git',
    },
    {
      name: 'lyra-python-extension',
      displayName: 'Python',
      version: '1.0.0',
      description: 'Full Python language support: IntelliSense, linting, formatting, debugging, testing, environments, and refactoring',
      author: 'Lyra',
      type: 'plugin',
      url: '',
      repository: 'https://github.com/anirbanbhat/lyra-python-extension.git',
    },
  ];

  async ensureDefaults(): Promise<void> {
    for (const id of ExtensionManager.DEFAULT_EXTENSIONS) {
      if (!this.installed.has(id)) {
        try {
          await this.install(id);
        } catch {
          // Ignore — will retry on next launch
        }
      }
    }
  }

  async activateAll(): Promise<void> {
    for (const [id, ext] of this.installed) {
      if (ext.enabled && ext.manifest.main) {
        await extensionHost.activate(id, ext.path, ext.manifest.main);
      }
    }
  }

  async activateExtension(id: string): Promise<void> {
    const ext = this.installed.get(id);
    if (ext?.enabled && ext.manifest.main) {
      await extensionHost.activate(id, ext.path, ext.manifest.main);
    }
  }

  async deactivateExtension(id: string): Promise<void> {
    await extensionHost.deactivate(id);
  }

  async loadInstalled(): Promise<void> {
    this.installed.clear();

    try {
      await fs.access(this.extensionsDir);
    } catch {
      await fs.mkdir(this.extensionsDir, { recursive: true });
      return;
    }

    const state = await this.loadState();
    const entries = await fs.readdir(this.extensionsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const extDir = path.join(this.extensionsDir, entry.name);
      const pkgPath = path.join(extDir, 'package.json');

      try {
        const content = await fs.readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);

        if (!pkg['lyra-extension']) continue;

        const manifest: ExtensionManifest = {
          name: pkg.name,
          displayName: pkg.displayName || pkg.name,
          version: pkg.version || '0.0.0',
          description: pkg.description || '',
          author: pkg.author || 'Unknown',
          type: pkg.type || 'plugin',
          'lyra-extension': true,
          main: pkg.main,
          contributes: pkg.contributes,
        };

        const enabled = state[manifest.name]?.enabled ?? true;
        this.installed.set(manifest.name, { manifest, enabled, path: extDir });
      } catch {
        // Skip invalid extensions
      }
    }
  }

  getInstalled(): ExtensionInfo[] {
    return Array.from(this.installed.values()).map(({ manifest, enabled, path: extPath }) => ({
      id: manifest.name,
      displayName: manifest.displayName,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      type: manifest.type,
      enabled,
      installed: true,
      path: extPath,
    }));
  }

  async loadRegistry(): Promise<RegistryEntry[]> {
    let entries: RegistryEntry[] = [];

    // 1. Try fetching from remote registry
    try {
      const data = await fetchJSON(REGISTRY_URL) as { extensions?: RegistryEntry[] };
      entries = data.extensions || [];
    } catch {
      // Remote unavailable — fall through to cache
    }

    // 2. Try local cache if remote failed
    if (entries.length === 0) {
      try {
        const content = await fs.readFile(this.registryCachePath, 'utf-8');
        const data = JSON.parse(content);
        entries = data.extensions || [];
      } catch {
        // No cache
      }
    }

    // 3. Always merge builtin entries so they are available regardless of remote/cache
    const existingNames = new Set(entries.map(e => e.name));
    for (const entry of ExtensionManager.BUILTIN_REGISTRY) {
      if (!existingNames.has(entry.name)) {
        entries.push(entry);
      }
    }

    // Save merged result as cache
    if (entries.length > 0) {
      await fs.mkdir(this.extensionsDir, { recursive: true });
      await fs.writeFile(this.registryCachePath, JSON.stringify({ version: 1, extensions: entries }, null, 2), 'utf-8');
    }

    return entries;
  }

  search(query: string): ExtensionInfo[] {
    const q = query.toLowerCase();
    return this.getInstalled().filter(
      ext =>
        ext.displayName.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.id.toLowerCase().includes(q)
    );
  }

  async install(id: string): Promise<void> {
    const registry = await this.loadRegistry();
    const entry = registry.find(e => e.name === id);
    if (!entry) {
      throw new Error(`Extension "${id}" not found in registry`);
    }

    const extDir = path.join(this.extensionsDir, id);

    // If the extension has a git repository, clone it
    if (entry.repository) {
      try {
        // Remove existing dir if present (e.g. failed previous install)
        try { await fs.rm(extDir, { recursive: true }); } catch {}
        await gitClone(entry.repository, extDir);
        // Remove .git directory — we don't need version control inside the extension
        try { await fs.rm(path.join(extDir, '.git'), { recursive: true }); } catch {}
        await this.loadInstalled();
        return;
      } catch {
        // Git clone failed — fall through to scaffold install
      }
    }

    // Scaffold install (for extensions without a repo URL)
    await fs.mkdir(extDir, { recursive: true });
    const manifest = {
      name: entry.name,
      displayName: entry.displayName,
      version: entry.version,
      description: entry.description,
      author: entry.author,
      type: entry.type,
      'lyra-extension': true,
      main: 'index.js',
    };
    await fs.writeFile(path.join(extDir, 'package.json'), JSON.stringify(manifest, null, 2), 'utf-8');
    await fs.writeFile(path.join(extDir, 'index.js'), '// Extension entry point\nmodule.exports = {};\n', 'utf-8');
    const readme = `# ${entry.displayName}\n\n${entry.description}\n\n- **Version**: ${entry.version}\n- **Author**: ${entry.author}\n- **Type**: ${entry.type}\n\n## Usage\n\nThis extension was installed from the Lyra registry.\n`;
    await fs.writeFile(path.join(extDir, 'README.md'), readme, 'utf-8');

    await this.loadInstalled();
  }

  async uninstall(id: string): Promise<void> {
    const ext = this.installed.get(id);
    if (!ext) throw new Error(`Extension "${id}" is not installed`);

    await fs.rm(ext.path, { recursive: true });
    this.installed.delete(id);

    const state = await this.loadState();
    delete state[id];
    await this.saveState(state);
  }

  async enable(id: string): Promise<void> {
    const ext = this.installed.get(id);
    if (!ext) throw new Error(`Extension "${id}" is not installed`);

    ext.enabled = true;
    const state = await this.loadState();
    state[id] = { enabled: true };
    await this.saveState(state);
  }

  async disable(id: string): Promise<void> {
    const ext = this.installed.get(id);
    if (!ext) throw new Error(`Extension "${id}" is not installed`);

    ext.enabled = false;
    const state = await this.loadState();
    state[id] = { enabled: false };
    await this.saveState(state);
  }

  async getReadme(id: string): Promise<string | null> {
    const ext = this.installed.get(id);
    if (!ext) return null;
    const readmePath = path.join(ext.path, 'README.md');
    try {
      return await fs.readFile(readmePath, 'utf-8');
    } catch {
      const m = ext.manifest;
      return `# ${m.displayName}\n\n${m.description}\n\n- **Version**: ${m.version}\n- **Author**: ${m.author}\n- **Type**: ${m.type}\n`;
    }
  }

  private async loadState(): Promise<Record<string, ExtensionState>> {
    try {
      const content = await fs.readFile(this.statePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async saveState(state: Record<string, ExtensionState>): Promise<void> {
    await fs.mkdir(this.extensionsDir, { recursive: true });
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), 'utf-8');
  }
}
