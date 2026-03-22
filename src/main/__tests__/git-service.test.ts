import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'child_process';

vi.mock('child_process', () => ({
  execFile: vi.fn(),
}));

// Helper to mock execFile responses
function mockGitCommand(stdout: string) {
  vi.mocked(execFile).mockImplementationOnce((_cmd, _args, _opts, cb: any) => {
    cb(null, stdout, '');
    return {} as any;
  });
}

function mockGitError(stderr: string) {
  vi.mocked(execFile).mockImplementationOnce((_cmd, _args, _opts, cb: any) => {
    const err = new Error(stderr);
    cb(err, '', stderr);
    return {} as any;
  });
}

// Import after mocking
import * as gitService from '../services/git.service';

describe('Git Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStatus', () => {
    it('should return isRepo=false when not a git repo', async () => {
      mockGitError('fatal: not a git repository');
      const status = await gitService.getStatus('/tmp/test');
      expect(status.isRepo).toBe(false);
      expect(status.branch).toBe('');
      expect(status.staged).toEqual([]);
    });

    it('should parse branch name and porcelain status', async () => {
      // rev-parse succeeds
      mockGitCommand('.git');
      // branch --show-current
      mockGitCommand('main\n');
      // status --branch --porcelain=v2
      mockGitCommand('# branch.ab +2 -1\n');
      // status --porcelain
      mockGitCommand('M  src/file.ts\n?? new-file.txt\n');

      const status = await gitService.getStatus('/tmp/test');
      expect(status.isRepo).toBe(true);
      expect(status.branch).toBe('main');
      expect(status.ahead).toBe(2);
      expect(status.behind).toBe(1);
      expect(status.staged).toHaveLength(1);
      expect(status.staged[0]).toEqual({ path: 'src/file.ts', status: 'modified', staged: true });
      expect(status.untracked).toHaveLength(1);
      expect(status.untracked[0].path).toBe('new-file.txt');
    });

    it('should parse added, deleted, and renamed statuses', async () => {
      mockGitCommand('.git');
      mockGitCommand('main\n');
      mockGitCommand('');
      mockGitCommand('A  added.ts\nD  deleted.ts\nR  renamed.ts\n');

      const status = await gitService.getStatus('/tmp/test');
      expect(status.staged).toHaveLength(3);
      expect(status.staged[0].status).toBe('added');
      expect(status.staged[1].status).toBe('deleted');
      expect(status.staged[2].status).toBe('renamed');
    });

    it('should parse unstaged modifications', async () => {
      mockGitCommand('.git');
      mockGitCommand('main\n');
      mockGitCommand('');
      // Porcelain format: XY PATH — space in X means not staged, M in Y means modified in worktree
      mockGitCommand(' M file.ts\n');

      const status = await gitService.getStatus('/tmp/test');
      // Space in index position means nothing staged
      expect(status.staged).toHaveLength(0);
      expect(status.unstaged).toHaveLength(1);
      expect(status.unstaged[0].path).toBe('file.ts');
      expect(status.unstaged[0].status).toBe('modified');
    });

    it('should handle empty porcelain output', async () => {
      mockGitCommand('.git');
      mockGitCommand('main\n');
      mockGitCommand('');
      mockGitCommand('');

      const status = await gitService.getStatus('/tmp/test');
      expect(status.staged).toEqual([]);
      expect(status.unstaged).toEqual([]);
      expect(status.untracked).toEqual([]);
    });
  });

  describe('log', () => {
    it('should parse git log output into entries', async () => {
      const logOutput = [
        'abc123def456789',
        'abc123d',
        'First commit',
        'Test Author',
        '2024-01-01 12:00:00 +0000',
        '---',
        'def456abc789012',
        'def456a',
        'Second commit',
        'Test Author',
        '2024-01-02 12:00:00 +0000',
        '---',
      ].join('\n');
      mockGitCommand(logOutput);

      const entries = await gitService.log('/tmp/test', 50);
      expect(entries).toHaveLength(2);
      expect(entries[0].hash).toBe('abc123def456789');
      expect(entries[0].shortHash).toBe('abc123d');
      expect(entries[0].message).toBe('First commit');
      expect(entries[0].author).toBe('Test Author');
      expect(entries[1].message).toBe('Second commit');
    });

    it('should return empty array for empty repo', async () => {
      mockGitError('fatal: your current branch does not have any commits yet');
      const entries = await gitService.log('/tmp/test');
      expect(entries).toEqual([]);
    });

    it('should return empty array for empty output', async () => {
      mockGitCommand('');
      const entries = await gitService.log('/tmp/test');
      expect(entries).toEqual([]);
    });
  });

  describe('getBranches', () => {
    it('should parse branch list', async () => {
      mockGitCommand('main *\nfeature \ndevelop \n');
      const branches = await gitService.getBranches('/tmp/test');
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({ name: 'main', current: true });
      expect(branches[1]).toEqual({ name: 'feature', current: false });
    });

    it('should return empty array on error (empty repo)', async () => {
      mockGitError('fatal: not a valid object name');
      const branches = await gitService.getBranches('/tmp/test');
      expect(branches).toEqual([]);
    });
  });

  describe('stage', () => {
    it('should call git add with file paths', async () => {
      mockGitCommand('');
      await gitService.stage('/tmp/test', ['file1.ts', 'file2.ts']);
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['add', 'file1.ts', 'file2.ts'],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('unstage', () => {
    it('should try git reset HEAD first', async () => {
      mockGitCommand('');
      await gitService.unstage('/tmp/test', ['file.ts']);
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['reset', 'HEAD', '--', 'file.ts'],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should fall back to git rm --cached on empty repo', async () => {
      mockGitError('fatal: Failed to resolve HEAD');
      mockGitCommand('');
      await gitService.unstage('/tmp/test', ['file.ts']);
      expect(execFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('commit', () => {
    it('should call git commit with message', async () => {
      mockGitCommand('');
      await gitService.commit('/tmp/test', 'feat: add feature');
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['commit', '-m', 'feat: add feature'],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('getConfig', () => {
    it('should return user name and email', async () => {
      mockGitCommand('Test User\n');
      mockGitCommand('test@example.com\n');
      const config = await gitService.getConfig('/tmp/test');
      expect(config.userName).toBe('Test User');
      expect(config.userEmail).toBe('test@example.com');
    });

    it('should return empty strings when config is not set', async () => {
      mockGitError('');
      mockGitError('');
      const config = await gitService.getConfig('/tmp/test');
      expect(config.userName).toBe('');
      expect(config.userEmail).toBe('');
    });
  });

  describe('setConfig', () => {
    it('should set both user.name and user.email', async () => {
      mockGitCommand('');
      mockGitCommand('');
      await gitService.setConfig('/tmp/test', { userName: 'Test', userEmail: 'test@test.com' });
      expect(execFile).toHaveBeenCalledTimes(2);
    });

    it('should skip setting empty values', async () => {
      await gitService.setConfig('/tmp/test', { userName: '', userEmail: '' });
      expect(execFile).not.toHaveBeenCalled();
    });
  });

  describe('diff', () => {
    it('should call git diff for a specific file', async () => {
      mockGitCommand('diff output');
      const result = await gitService.diff('/tmp/test', 'file.ts');
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['diff', '--', 'file.ts'],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result).toBe('diff output');
    });

    it('should call git diff without file path for all changes', async () => {
      mockGitCommand('all diffs');
      const result = await gitService.diff('/tmp/test');
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['diff'],
        expect.any(Object),
        expect.any(Function)
      );
      expect(result).toBe('all diffs');
    });
  });

  describe('initRepo', () => {
    it('should call git init', async () => {
      mockGitCommand('Initialized empty Git repository');
      await gitService.initRepo('/tmp/test');
      expect(execFile).toHaveBeenCalledWith(
        'git',
        ['init'],
        expect.any(Object),
        expect.any(Function)
      );
    });
  });
});
