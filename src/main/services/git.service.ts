import { execFile } from 'child_process';
import type { GitStatus, GitFileChange, GitLogEntry, GitConfig, GitBranch } from '@shared/types/git.types';

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        // Extract the meaningful error message from stderr
        const message = (stderr || '').trim() || (err as any).message || 'Git command failed';
        reject(new Error(message));
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function getStatus(cwd: string): Promise<GitStatus> {
  // Check if it's a repo
  try {
    await git(['rev-parse', '--git-dir'], cwd);
  } catch {
    return { isRepo: false, branch: '', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] };
  }

  let branch = '';
  let ahead = 0;
  let behind = 0;

  try {
    branch = (await git(['branch', '--show-current'], cwd)).trim();
  } catch {}

  try {
    const status = (await git(['status', '--branch', '--porcelain=v2'], cwd)).trim();
    for (const line of status.split('\n')) {
      const aheadMatch = line.match(/# branch\.ab \+(\d+) -(\d+)/);
      if (aheadMatch) {
        ahead = parseInt(aheadMatch[1], 10);
        behind = parseInt(aheadMatch[2], 10);
      }
    }
  } catch {}

  const staged: GitFileChange[] = [];
  const unstaged: GitFileChange[] = [];
  const untracked: GitFileChange[] = [];

  try {
    const porcelain = (await git(['status', '--porcelain'], cwd)).trim();
    if (porcelain) {
      for (const line of porcelain.split('\n')) {
        const indexStatus = line[0];
        const workStatus = line[1];
        const filePath = line.slice(3);

        if (indexStatus === '?') {
          untracked.push({ path: filePath, status: 'untracked', staged: false });
          continue;
        }

        if (indexStatus !== ' ' && indexStatus !== '?') {
          staged.push({ path: filePath, status: parseStatus(indexStatus), staged: true });
        }

        if (workStatus !== ' ' && workStatus !== '?') {
          unstaged.push({ path: filePath, status: parseStatus(workStatus), staged: false });
        }
      }
    }
  } catch {}

  return { isRepo: true, branch, ahead, behind, staged, unstaged, untracked };
}

function parseStatus(code: string): GitFileChange['status'] {
  switch (code) {
    case 'M': return 'modified';
    case 'A': return 'added';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    default: return 'modified';
  }
}

export async function stage(cwd: string, files: string[]): Promise<void> {
  await git(['add', ...files], cwd);
}

export async function unstage(cwd: string, files: string[]): Promise<void> {
  try {
    await git(['reset', 'HEAD', '--', ...files], cwd);
  } catch {
    // On repos with no commits, use rm --cached instead
    await git(['rm', '--cached', '--', ...files], cwd);
  }
}

export async function commit(cwd: string, message: string): Promise<void> {
  await git(['commit', '-m', message], cwd);
}

export async function push(cwd: string): Promise<string> {
  return await git(['push'], cwd);
}

export async function pull(cwd: string): Promise<string> {
  return await git(['pull'], cwd);
}

export async function log(cwd: string, count: number = 50): Promise<GitLogEntry[]> {
  try {
    const output = await git(
      ['log', `--max-count=${count}`, '--pretty=format:%H%n%h%n%s%n%an%n%ai%n---'],
      cwd
    );
    const entries: GitLogEntry[] = [];
    const trimmed = output.trim();
    if (!trimmed) return entries;
    const blocks = trimmed.split('\n---\n');
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 5) {
        entries.push({
          hash: lines[0],
          shortHash: lines[1],
          message: lines[2],
          author: lines[3],
          date: lines[4],
        });
      }
    }
    return entries;
  } catch (err) {
    // Empty repo with no commits — return empty list instead of throwing
    if (String(err).includes('does not have any commits')) {
      return [];
    }
    throw err;
  }
}

export async function diff(cwd: string, filePath?: string): Promise<string> {
  const args = ['diff'];
  if (filePath) args.push('--', filePath);
  return await git(args, cwd);
}

export async function getBranches(cwd: string): Promise<GitBranch[]> {
  try {
    const output = await git(['branch', '--format=%(refname:short) %(HEAD)'], cwd);
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const parts = line.trim().split(' ');
        const isCurrent = parts[parts.length - 1] === '*';
        const name = parts[0];
        return { name, current: isCurrent };
      });
  } catch {
    // Empty repo with no commits — no branches yet
    return [];
  }
}

export async function checkout(cwd: string, branch: string): Promise<void> {
  await git(['checkout', branch], cwd);
}

export async function createBranch(cwd: string, name: string): Promise<void> {
  await git(['checkout', '-b', name], cwd);
}

export async function initRepo(cwd: string): Promise<void> {
  await git(['init'], cwd);
}

export async function getConfig(cwd: string): Promise<GitConfig> {
  let userName = '';
  let userEmail = '';
  try { userName = (await git(['config', 'user.name'], cwd)).trim(); } catch {}
  try { userEmail = (await git(['config', 'user.email'], cwd)).trim(); } catch {}
  return { userName, userEmail };
}

export async function setConfig(cwd: string, config: GitConfig): Promise<void> {
  if (config.userName) {
    await git(['config', 'user.name', config.userName], cwd);
  }
  if (config.userEmail) {
    await git(['config', 'user.email', config.userEmail], cwd);
  }
}
