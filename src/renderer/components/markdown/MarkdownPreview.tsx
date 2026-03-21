import React, { useEffect, useRef, useState, useCallback } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#1e1e2e',
    primaryColor: '#89b4fa',
    primaryTextColor: '#cdd6f4',
    primaryBorderColor: '#45475a',
    lineColor: '#6c7086',
    secondaryColor: '#313244',
    tertiaryColor: '#45475a',
  },
});

interface MarkdownPreviewProps {
  content: string;
  fileName?: string;
}

export function MarkdownPreview({ content, fileName }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [exporting, setExporting] = useState(false);
  const mermaidCounter = useRef(0);

  // Parse markdown and extract mermaid blocks
  useEffect(() => {
    const parseContent = async () => {
      // Custom renderer to handle mermaid code blocks
      const renderer = new marked.Renderer();
      const originalCode = renderer.code;

      renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
        if (lang === 'mermaid') {
          const id = `mermaid-${++mermaidCounter.current}`;
          return `<div class="mermaid-container" data-mermaid-id="${id}" data-mermaid-code="${encodeURIComponent(text)}"></div>`;
        }
        // Syntax highlighting with colored code blocks
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
      };

      const parsed = await marked(content, { renderer, async: true });
      setHtml(parsed);
    };

    parseContent();
  }, [content]);

  // Render mermaid diagrams after HTML is set
  useEffect(() => {
    if (!containerRef.current || !html) return;

    const renderMermaid = async () => {
      const containers = containerRef.current?.querySelectorAll('.mermaid-container');
      if (!containers) return;

      for (const container of containers) {
        const el = container as HTMLElement;
        const code = decodeURIComponent(el.getAttribute('data-mermaid-code') || '');
        const id = el.getAttribute('data-mermaid-id') || 'mermaid-0';

        if (!code || el.querySelector('svg')) continue;

        try {
          const { svg } = await mermaid.render(id, code);
          el.innerHTML = `<div class="mermaid-svg">${svg}</div>`;
        } catch (err) {
          el.innerHTML = `<div class="mermaid-error">Mermaid error: ${String(err).slice(0, 100)}</div>`;
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timer);
  }, [html]);

  const handleExportPdf = useCallback(async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      const htmlContent = containerRef.current.innerHTML;
      const defaultName = fileName?.replace(/\.(md|markdown)$/i, '.pdf') || 'document.pdf';
      await window.lyra.markdown.exportPdf(htmlContent, defaultName);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [fileName]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preview</span>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          style={{
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            borderRadius: 4,
            border: 'none',
            cursor: exporting ? 'wait' : 'pointer',
          }}
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Preview content */}
      <div
        ref={containerRef}
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 24px',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text-primary)',
        }}
      />

      <style>{`
        .markdown-preview h1 {
          font-size: 28px;
          font-weight: 700;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
          margin: 24px 0 12px;
        }
        .markdown-preview h2 {
          font-size: 22px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
          padding-bottom: 6px;
          margin: 20px 0 10px;
        }
        .markdown-preview h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0 8px;
        }
        .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
          font-size: 15px;
          font-weight: 600;
          margin: 12px 0 6px;
        }
        .markdown-preview p {
          margin: 8px 0;
        }
        .markdown-preview code {
          background: var(--bg-surface);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 13px;
          font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
        }
        .markdown-preview pre {
          background: var(--bg-surface);
          padding: 14px 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;
          border: 1px solid var(--border);
        }
        .markdown-preview pre code {
          background: none;
          padding: 0;
          font-size: 13px;
          line-height: 1.5;
        }
        .markdown-preview blockquote {
          border-left: 4px solid var(--accent);
          margin: 12px 0;
          padding: 4px 16px;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border-radius: 0 4px 4px 0;
        }
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .markdown-preview th, .markdown-preview td {
          border: 1px solid var(--border);
          padding: 8px 12px;
          text-align: left;
        }
        .markdown-preview th {
          background: var(--bg-surface);
          font-weight: 600;
        }
        .markdown-preview img {
          max-width: 100%;
          border-radius: 4px;
        }
        .markdown-preview a {
          color: var(--accent);
          text-decoration: none;
        }
        .markdown-preview a:hover {
          text-decoration: underline;
        }
        .markdown-preview ul, .markdown-preview ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        .markdown-preview li {
          margin: 4px 0;
        }
        .markdown-preview hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 20px 0;
        }
        .markdown-preview .mermaid-container {
          margin: 16px 0;
          padding: 16px;
          background: var(--bg-surface);
          border-radius: 8px;
          border: 1px solid var(--border);
          text-align: center;
          overflow-x: auto;
        }
        .markdown-preview .mermaid-svg svg {
          max-width: 100%;
        }
        .markdown-preview .mermaid-error {
          color: var(--error);
          font-size: 12px;
          padding: 8px;
        }
        .markdown-preview input[type="checkbox"] {
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
}
