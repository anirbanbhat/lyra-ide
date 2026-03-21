export interface TerminalSpawnOpts {
  cols?: number;
  rows?: number;
  cwd?: string;
  shell?: string;
}

export interface TerminalSession {
  id: string;
  title: string;
}
