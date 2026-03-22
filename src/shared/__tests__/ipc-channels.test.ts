import { describe, it, expect } from 'vitest';
import { IPC } from '../ipc-channels';

describe('IPC Channels', () => {
  it('should export all file system channels', () => {
    expect(IPC.FS_READ_FILE).toBe('fs:read-file');
    expect(IPC.FS_WRITE_FILE).toBe('fs:write-file');
    expect(IPC.FS_LIST_DIR).toBe('fs:list-dir');
    expect(IPC.FS_OPEN_DIALOG).toBe('fs:open-dialog');
    expect(IPC.FS_DELETE).toBe('fs:delete');
    expect(IPC.FS_RENAME).toBe('fs:rename');
    expect(IPC.FS_NEW_PROJECT).toBe('fs:new-project');
    expect(IPC.FS_CREATE_FILE).toBe('fs:create-file');
    expect(IPC.FS_CREATE_DIR).toBe('fs:create-dir');
  });

  it('should export all terminal channels', () => {
    expect(IPC.TERMINAL_SPAWN).toBe('terminal:spawn');
    expect(IPC.TERMINAL_WRITE).toBe('terminal:write');
    expect(IPC.TERMINAL_RESIZE).toBe('terminal:resize');
    expect(IPC.TERMINAL_KILL).toBe('terminal:kill');
    expect(IPC.TERMINAL_DATA).toBe('terminal:data');
    expect(IPC.TERMINAL_EXIT).toBe('terminal:exit');
  });

  it('should export all agent channels', () => {
    expect(IPC.AGENT_LIST).toBe('agent:list');
    expect(IPC.AGENT_SEND).toBe('agent:send');
    expect(IPC.AGENT_STREAM).toBe('agent:stream');
    expect(IPC.AGENT_STREAM_END).toBe('agent:stream-end');
    expect(IPC.AGENT_STOP).toBe('agent:stop');
  });

  it('should export all git channels', () => {
    expect(IPC.GIT_STATUS).toBe('git:status');
    expect(IPC.GIT_STAGE).toBe('git:stage');
    expect(IPC.GIT_UNSTAGE).toBe('git:unstage');
    expect(IPC.GIT_COMMIT).toBe('git:commit');
    expect(IPC.GIT_PUSH).toBe('git:push');
    expect(IPC.GIT_PULL).toBe('git:pull');
    expect(IPC.GIT_LOG).toBe('git:log');
    expect(IPC.GIT_DIFF).toBe('git:diff');
    expect(IPC.GIT_BRANCHES).toBe('git:branches');
    expect(IPC.GIT_CHECKOUT).toBe('git:checkout');
    expect(IPC.GIT_CREATE_BRANCH).toBe('git:create-branch');
    expect(IPC.GIT_INIT).toBe('git:init');
    expect(IPC.GIT_GET_CONFIG).toBe('git:get-config');
    expect(IPC.GIT_SET_CONFIG).toBe('git:set-config');
  });

  it('should export all extension channels', () => {
    expect(IPC.EXT_LIST_INSTALLED).toBe('ext:list-installed');
    expect(IPC.EXT_LIST_REGISTRY).toBe('ext:list-registry');
    expect(IPC.EXT_SEARCH).toBe('ext:search');
    expect(IPC.EXT_INSTALL).toBe('ext:install');
    expect(IPC.EXT_UNINSTALL).toBe('ext:uninstall');
    expect(IPC.EXT_ENABLE).toBe('ext:enable');
    expect(IPC.EXT_DISABLE).toBe('ext:disable');
    expect(IPC.EXT_README).toBe('ext:readme');
  });

  it('should export settings channels', () => {
    expect(IPC.SETTINGS_GET).toBe('settings:get');
    expect(IPC.SETTINGS_SET).toBe('settings:set');
    expect(IPC.SETTINGS_GET_ALL).toBe('settings:get-all');
  });

  it('should have unique channel values', () => {
    const values = Object.values(IPC);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('should follow namespace:action naming convention', () => {
    for (const value of Object.values(IPC)) {
      expect(value).toMatch(/^[a-z]+:[a-z][-a-z]*$/);
    }
  });
});
