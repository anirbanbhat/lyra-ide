export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  modified?: number;
  children?: FileEntry[];
}

export interface FileStat {
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modified: number;
  created: number;
}

export interface FSWatchEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
}
