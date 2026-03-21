import os from 'os';
import type { TerminalSpawnOpts } from '@shared/types/terminal.types';

// node-pty is a native module — require it at runtime so Vite doesn't try to bundle it
let pty: any;
try {
  pty = require('node-pty');
} catch (err) {
  console.warn('node-pty not available, terminal will not work:', err);
}

interface TerminalInstance {
  id: string;
  ptyProcess: any;
  title: string;
}

class TerminalService {
  private terminals = new Map<string, TerminalInstance>();
  private counter = 0;

  spawn(
    opts: TerminalSpawnOpts,
    onData: (id: string, data: string) => void,
    onExit: (id: string, code: number) => void
  ): string | null {
    if (!pty) {
      console.error('node-pty is not available');
      return null;
    }

    const id = `terminal-${++this.counter}`;
    const shell = opts.shell || process.env.SHELL || '/bin/zsh';
    const cwd = opts.cwd || os.homedir();

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: opts.cols || 80,
      rows: opts.rows || 24,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        LANG: process.env.LANG || 'en_US.UTF-8',
      },
    });

    const terminal: TerminalInstance = {
      id,
      ptyProcess,
      title: shell.split('/').pop() || 'terminal',
    };

    this.terminals.set(id, terminal);

    ptyProcess.onData((data: string) => {
      onData(id, data);
    });

    ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      this.terminals.delete(id);
      onExit(id, exitCode);
    });

    return id;
  }

  write(id: string, data: string) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.ptyProcess.write(data);
    }
  }

  resize(id: string, cols: number, rows: number) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.ptyProcess.resize(cols, rows);
    }
  }

  kill(id: string) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.ptyProcess.kill();
      this.terminals.delete(id);
    }
  }

  killAll() {
    for (const [id] of this.terminals) {
      this.kill(id);
    }
  }
}

export const terminalService = new TerminalService();
