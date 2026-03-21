import { shell, BrowserWindow } from 'electron';
import http from 'http';
import { IPC } from '@shared/ipc-channels';

let callbackServer: http.Server | null = null;

export function openExternalUrl(url: string) {
  shell.openExternal(url);
}

/**
 * Starts a local HTTP server to receive OAuth callbacks.
 * When a request comes in with ?key=xxx, it sends the key back to the renderer
 * and shows a success page in the browser.
 */
export function startCallbackServer(
  port: number,
  onKey: (key: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      callbackServer.close();
    }

    callbackServer = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);

      // Serve the paste page
      if (url.pathname === '/auth/callback' || url.pathname === '/') {
        const key = url.searchParams.get('key');

        if (key) {
          // Key was passed as query param (for automated flows)
          onKey(key);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(getSuccessHTML());
          stopCallbackServer();
        } else {
          // Show paste page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(getPastePageHTML(port));
        }
      } else if (url.pathname === '/auth/submit' && req.method === 'POST') {
        // Handle form submission
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          const params = new URLSearchParams(body);
          const key = params.get('key')?.trim();
          if (key) {
            onKey(key);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getSuccessHTML());
            stopCallbackServer();
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body><h2>No key provided</h2><a href="/">Try again</a></body></html>');
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    callbackServer.listen(port, '127.0.0.1', () => {
      resolve();
    });

    callbackServer.on('error', reject);

    // Auto-close after 5 minutes
    setTimeout(() => stopCallbackServer(), 5 * 60 * 1000);
  });
}

export function stopCallbackServer() {
  if (callbackServer) {
    callbackServer.close();
    callbackServer = null;
  }
}

function getPastePageHTML(port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Lyra - API Key Setup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #1e1e2e;
      color: #cdd6f4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 480px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #89b4fa; }
    p { font-size: 14px; color: #a6adc8; margin-bottom: 24px; line-height: 1.6; }
    form { display: flex; flex-direction: column; gap: 12px; }
    input[type="password"] {
      padding: 12px 16px;
      background: #313244;
      border: 2px solid #45475a;
      border-radius: 8px;
      color: #cdd6f4;
      font-size: 14px;
      font-family: 'SF Mono', monospace;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: #89b4fa; }
    button {
      padding: 12px 24px;
      background: #89b4fa;
      color: #1e1e2e;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #74c7ec; }
    .hint { font-size: 12px; color: #6c7086; margin-top: 16px; }
    .hint a { color: #89b4fa; text-decoration: none; }
    .hint a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Lyra IDE</h1>
    <p>Paste your API key below. It will be securely sent to Lyra and this page will close.</p>
    <form action="/auth/submit" method="POST">
      <input type="password" name="key" placeholder="sk-ant-... or sk-..." autofocus required />
      <button type="submit">Connect to Lyra</button>
    </form>
    <p class="hint">
      Get your API key from:<br>
      <a href="https://console.anthropic.com/settings/keys" target="_blank">Anthropic Console</a> &middot;
      <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>
    </p>
  </div>
</body>
</html>`;
}

function getSuccessHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Lyra - Connected!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #1e1e2e;
      color: #cdd6f4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    h1 { color: #a6e3a1; margin-bottom: 8px; }
    p { color: #a6adc8; font-size: 14px; }
  </style>
</head>
<body>
  <div>
    <h1>Connected!</h1>
    <p>Your API key has been saved to Lyra. You can close this tab.</p>
    <script>setTimeout(() => window.close(), 3000);</script>
  </div>
</body>
</html>`;
}
