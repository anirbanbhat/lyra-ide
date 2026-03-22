// Mock the window.lyra API for renderer tests
const mockLyra = {
  extensions: {
    listInstalled: vi.fn().mockResolvedValue([]),
    listRegistry: vi.fn().mockResolvedValue([]),
    install: vi.fn().mockResolvedValue(undefined),
    uninstall: vi.fn().mockResolvedValue(undefined),
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
    getReadme: vi.fn().mockResolvedValue(''),
  },
  git: {
    status: vi.fn().mockResolvedValue({ isRepo: false, branch: '', ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [] }),
    stage: vi.fn().mockResolvedValue(undefined),
    unstage: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(''),
    pull: vi.fn().mockResolvedValue(''),
    log: vi.fn().mockResolvedValue([]),
    diff: vi.fn().mockResolvedValue(''),
    branches: vi.fn().mockResolvedValue([]),
    checkout: vi.fn().mockResolvedValue(undefined),
    createBranch: vi.fn().mockResolvedValue(undefined),
    init: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue({ userName: '', userEmail: '' }),
    setConfig: vi.fn().mockResolvedValue(undefined),
  },
  fs: {
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listDir: vi.fn().mockResolvedValue([]),
  },
};

Object.defineProperty(globalThis, 'window', {
  value: { lyra: mockLyra },
  writable: true,
});

export { mockLyra };
