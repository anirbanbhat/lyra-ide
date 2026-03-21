import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc-channels';
import * as gitService from '../services/git.service';
import type { GitConfig } from '@shared/types/git.types';

export function registerGitIPC() {
  ipcMain.handle(IPC.GIT_STATUS, async (_event, cwd: string) => {
    return gitService.getStatus(cwd);
  });

  ipcMain.handle(IPC.GIT_STAGE, async (_event, cwd: string, files: string[]) => {
    await gitService.stage(cwd, files);
  });

  ipcMain.handle(IPC.GIT_UNSTAGE, async (_event, cwd: string, files: string[]) => {
    await gitService.unstage(cwd, files);
  });

  ipcMain.handle(IPC.GIT_COMMIT, async (_event, cwd: string, message: string) => {
    await gitService.commit(cwd, message);
  });

  ipcMain.handle(IPC.GIT_PUSH, async (_event, cwd: string) => {
    return gitService.push(cwd);
  });

  ipcMain.handle(IPC.GIT_PULL, async (_event, cwd: string) => {
    return gitService.pull(cwd);
  });

  ipcMain.handle(IPC.GIT_LOG, async (_event, cwd: string, count?: number) => {
    return gitService.log(cwd, count);
  });

  ipcMain.handle(IPC.GIT_DIFF, async (_event, cwd: string, filePath?: string) => {
    return gitService.diff(cwd, filePath);
  });

  ipcMain.handle(IPC.GIT_BRANCHES, async (_event, cwd: string) => {
    return gitService.getBranches(cwd);
  });

  ipcMain.handle(IPC.GIT_CHECKOUT, async (_event, cwd: string, branch: string) => {
    await gitService.checkout(cwd, branch);
  });

  ipcMain.handle(IPC.GIT_CREATE_BRANCH, async (_event, cwd: string, name: string) => {
    await gitService.createBranch(cwd, name);
  });

  ipcMain.handle(IPC.GIT_INIT, async (_event, cwd: string) => {
    await gitService.initRepo(cwd);
  });

  ipcMain.handle(IPC.GIT_GET_CONFIG, async (_event, cwd: string) => {
    return gitService.getConfig(cwd);
  });

  ipcMain.handle(IPC.GIT_SET_CONFIG, async (_event, cwd: string, config: GitConfig) => {
    await gitService.setConfig(cwd, config);
  });
}
