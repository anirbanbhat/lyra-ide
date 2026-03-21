import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs/promises';
import { IPC } from '@shared/ipc-channels';

export function registerMarkdownIPC() {
  ipcMain.handle(IPC.MD_EXPORT_PDF, async (_event, htmlContent: string, defaultName?: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return null;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName || 'document.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) return null;

    // Create a hidden window to render the HTML and print to PDF
    const pdfWin = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const wrappedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
    }
    h1 { font-size: 28px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    h2 { font-size: 22px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    h3 { font-size: 18px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
    img { max-width: 100%; }
    .mermaid-svg { max-width: 100%; overflow: auto; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

    await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(wrappedHtml)}`);

    // Wait a moment for mermaid SVGs to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfData = await pdfWin.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'default' },
    });

    await fs.writeFile(result.filePath, pdfData);
    pdfWin.close();

    return result.filePath;
  });
}
