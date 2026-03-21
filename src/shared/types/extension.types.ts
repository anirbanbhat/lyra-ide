export type ExtensionType = 'theme' | 'language-pack' | 'plugin';

export interface ExtensionManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  type: ExtensionType;
  'lyra-extension': true;
  main?: string;
  contributes?: {
    themes?: Array<{ id: string; label: string; path: string }>;
    languages?: Array<{ id: string; extensions: string[]; path: string }>;
  };
}

export interface ExtensionInfo {
  id: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  type: ExtensionType;
  enabled: boolean;
  installed: boolean;
  path?: string;
}

export interface RegistryEntry {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  type: ExtensionType;
  url: string;
}
