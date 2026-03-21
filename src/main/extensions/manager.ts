import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EXTENSIONS_DIR } from '@shared/constants';
import type { ExtensionInfo, ExtensionManifest, RegistryEntry } from '@shared/types/extension.types';

interface ExtensionState {
  enabled: boolean;
}

export class ExtensionManager {
  private extensionsDir = path.join(os.homedir(), EXTENSIONS_DIR);
  private statePath = path.join(os.homedir(), EXTENSIONS_DIR, 'extensions-state.json');
  private registryPath = path.join(os.homedir(), EXTENSIONS_DIR, 'registry.json');
  private installed = new Map<string, { manifest: ExtensionManifest; enabled: boolean; path: string }>();

  private static DEFAULT_EXTENSIONS = ['lyra-markdown-preview'];

  async ensureDefaults(): Promise<void> {
    for (const id of ExtensionManager.DEFAULT_EXTENSIONS) {
      if (!this.installed.has(id)) {
        try {
          await this.install(id);
        } catch {
          // Ignore if install fails (e.g. registry not ready)
        }
      }
    }
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

  private static DEFAULT_REGISTRY_ENTRIES: RegistryEntry[] = [
    {
      name: 'lyra-monokai',
      displayName: 'Monokai Theme',
      version: '1.0.0',
      description: 'Classic Monokai color theme for Lyra',
      author: 'Lyra Community',
      type: 'theme',
      url: '',
    },
    {
      name: 'lyra-vim-keys',
      displayName: 'Vim Keybindings',
      version: '1.0.0',
      description: 'Vim-style keyboard shortcuts',
      author: 'Lyra Community',
      type: 'plugin',
      url: '',
    },
    {
      name: 'lyra-python-pack',
      displayName: 'Python Language Pack',
      version: '1.0.0',
      description: 'Enhanced Python support with linting and formatting',
      author: 'Lyra Community',
      type: 'language-pack',
      url: '',
    },
    {
      name: 'lyra-markdown-preview',
      displayName: 'Markdown Preview',
      version: '1.0.0',
      description: 'Live Markdown preview with Mermaid diagram support and PDF export',
      author: 'Lyra',
      type: 'plugin',
      url: '',
    },
  ];

  async loadRegistry(): Promise<RegistryEntry[]> {
    let existing: RegistryEntry[] = [];

    try {
      const content = await fs.readFile(this.registryPath, 'utf-8');
      const data = JSON.parse(content);
      existing = data.extensions || [];
    } catch {
      // No registry file yet
    }

    // Merge: add any default entries missing from the existing registry
    const existingNames = new Set(existing.map(e => e.name));
    let updated = false;
    for (const entry of ExtensionManager.DEFAULT_REGISTRY_ENTRIES) {
      if (!existingNames.has(entry.name)) {
        existing.push(entry);
        updated = true;
      }
    }

    // Write back if we added new defaults (or created fresh)
    if (updated || existing.length === 0) {
      await fs.mkdir(this.extensionsDir, { recursive: true });
      await fs.writeFile(
        this.registryPath,
        JSON.stringify({ version: 1, extensions: existing }, null, 2),
        'utf-8'
      );
    }

    return existing;
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
    // Load registry to find the extension
    const registry = await this.loadRegistry();
    const entry = registry.find(e => e.name === id);
    if (!entry) {
      throw new Error(`Extension "${id}" not found in registry`);
    }

    const extDir = path.join(this.extensionsDir, id);

    // Create a scaffold extension directory with a valid manifest
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
    // Generate a default README
    const readme = `# ${entry.displayName}\n\n${entry.description}\n\n- **Version**: ${entry.version}\n- **Author**: ${entry.author}\n- **Type**: ${entry.type}\n\n## Usage\n\nThis extension was installed from the Lyra registry.\n`;
    await fs.writeFile(path.join(extDir, 'README.md'), readme, 'utf-8');

    // Reload installed extensions
    await this.loadInstalled();
  }

  async uninstall(id: string): Promise<void> {
    const ext = this.installed.get(id);
    if (!ext) throw new Error(`Extension "${id}" is not installed`);

    await fs.rm(ext.path, { recursive: true });
    this.installed.delete(id);

    // Update state file
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
      // No README found — return a generated one from manifest
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
