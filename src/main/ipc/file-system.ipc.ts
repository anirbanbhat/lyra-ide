import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC } from '@shared/ipc-channels';
import type { FileEntry, FileStat } from '@shared/types/file-system.types';

export function registerFileSystemIPC() {
  ipcMain.handle(IPC.FS_READ_FILE, async (_event, filePath: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  });

  ipcMain.handle(IPC.FS_WRITE_FILE, async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  ipcMain.handle(IPC.FS_LIST_DIR, async (_event, dirPath: string): Promise<FileEntry[]> => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;
      if (entry.name === 'node_modules') continue;

      result.push({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
      });
    }

    return result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  ipcMain.handle(IPC.FS_STAT, async (_event, filePath: string): Promise<FileStat> => {
    const stat = await fs.stat(filePath);
    return {
      size: stat.size,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      modified: stat.mtimeMs,
      created: stat.birthtimeMs,
    };
  });

  ipcMain.handle(IPC.FS_OPEN_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.FS_OPEN_FOLDER_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.FS_SAVE_DIALOG, async (_event, defaultPath?: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showSaveDialog(win, {
      defaultPath,
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  ipcMain.handle(IPC.FS_CREATE_FILE, async (_event, filePath: string) => {
    await fs.writeFile(filePath, '', 'utf-8');
  });

  ipcMain.handle(IPC.FS_CREATE_DIR, async (_event, dirPath: string) => {
    await fs.mkdir(dirPath, { recursive: true });
  });

  ipcMain.handle(IPC.FS_DELETE, async (_event, targetPath: string) => {
    await fs.rm(targetPath, { recursive: true });
  });

  ipcMain.handle(IPC.FS_RENAME, async (_event, oldPath: string, newPath: string) => {
    await fs.rename(oldPath, newPath);
  });

  ipcMain.handle(IPC.FS_COPY, async (_event, srcPath: string, destPath: string) => {
    await fs.cp(srcPath, destPath, { recursive: true });
  });

  ipcMain.handle(
    IPC.FS_NEW_PROJECT,
    async (_event, projectName: string, parentDir: string, template: string) => {
      const projectDir = path.join(parentDir, projectName);

      // Create the project directory
      await fs.mkdir(projectDir, { recursive: true });

      // Scaffold based on template
      if (template === 'blank') {
        await fs.writeFile(
          path.join(projectDir, 'README.md'),
          `# ${projectName}\n\nA new project created with Lyra IDE.\n`,
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, '.gitignore'),
          'node_modules/\ndist/\n.DS_Store\n.env\n',
          'utf-8'
        );
      } else if (template === 'node') {
        await fs.writeFile(
          path.join(projectDir, 'package.json'),
          JSON.stringify(
            {
              name: projectName.toLowerCase().replace(/\s+/g, '-'),
              version: '1.0.0',
              description: '',
              main: 'src/index.js',
              scripts: {
                start: 'node src/index.js',
                test: 'echo "Error: no test specified" && exit 1',
              },
              keywords: [],
              license: 'MIT',
            },
            null,
            2
          ),
          'utf-8'
        );
        await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(projectDir, 'src', 'index.js'),
          "console.log('Hello from Lyra!');\n",
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'README.md'),
          `# ${projectName}\n\nA Node.js project created with Lyra IDE.\n`,
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, '.gitignore'),
          'node_modules/\ndist/\n.DS_Store\n.env\n',
          'utf-8'
        );
      } else if (template === 'typescript') {
        await fs.writeFile(
          path.join(projectDir, 'package.json'),
          JSON.stringify(
            {
              name: projectName.toLowerCase().replace(/\s+/g, '-'),
              version: '1.0.0',
              description: '',
              main: 'dist/index.js',
              scripts: {
                build: 'tsc',
                start: 'node dist/index.js',
                dev: 'tsc --watch',
              },
              keywords: [],
              license: 'MIT',
              devDependencies: { typescript: '^5.7.0' },
            },
            null,
            2
          ),
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'tsconfig.json'),
          JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2022',
                module: 'commonjs',
                strict: true,
                outDir: './dist',
                rootDir: './src',
                esModuleInterop: true,
                skipLibCheck: true,
              },
              include: ['src/**/*'],
            },
            null,
            2
          ),
          'utf-8'
        );
        await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(projectDir, 'src', 'index.ts'),
          "const message: string = 'Hello from Lyra!';\nconsole.log(message);\n",
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'README.md'),
          `# ${projectName}\n\nA TypeScript project created with Lyra IDE.\n`,
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, '.gitignore'),
          'node_modules/\ndist/\n.DS_Store\n.env\n',
          'utf-8'
        );
      } else if (template === 'python') {
        await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(projectDir, 'src', 'main.py'),
          'def main():\n    print("Hello from Lyra!")\n\nif __name__ == "__main__":\n    main()\n',
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'requirements.txt'),
          '# Add your dependencies here\n',
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'README.md'),
          `# ${projectName}\n\nA Python project created with Lyra IDE.\n`,
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, '.gitignore'),
          '__pycache__/\n*.pyc\n.venv/\nvenv/\n.env\ndist/\n.DS_Store\n',
          'utf-8'
        );
      } else if (template === 'html') {
        await fs.writeFile(
          path.join(projectDir, 'index.html'),
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello from Lyra!</h1>
  <script src="script.js"></script>
</body>
</html>
`,
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'style.css'),
          'body {\n  font-family: system-ui, sans-serif;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n}\n',
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'script.js'),
          "console.log('Hello from Lyra!');\n",
          'utf-8'
        );
        await fs.writeFile(
          path.join(projectDir, 'README.md'),
          `# ${projectName}\n\nAn HTML/CSS/JS project created with Lyra IDE.\n`,
          'utf-8'
        );
      }

      return projectDir;
    }
  );
}
