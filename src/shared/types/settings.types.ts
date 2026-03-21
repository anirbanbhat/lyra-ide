export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  terminalShell: string;
  activeAgentId: string | null;
  agentConfigs: Record<string, Record<string, unknown>>;
  sidebarWidth: number;
  terminalHeight: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
  tabSize: 2,
  wordWrap: false,
  terminalShell: '/bin/zsh',
  activeAgentId: null,
  agentConfigs: {},
  sidebarWidth: 260,
  terminalHeight: 250,
};
