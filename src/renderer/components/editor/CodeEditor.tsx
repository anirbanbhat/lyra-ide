import React, { useRef, useEffect, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco workers to use local bundled workers (not CDN)
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

// Define Catppuccin Mocha theme once
monaco.editor.defineTheme('lyra-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'cba6f7' },
    { token: 'string', foreground: 'a6e3a1' },
    { token: 'number', foreground: 'fab387' },
    { token: 'type', foreground: '89dceb' },
    { token: 'type.identifier', foreground: '89dceb' },
    { token: 'function', foreground: '89b4fa' },
    { token: 'variable', foreground: 'cdd6f4' },
    { token: 'variable.predefined', foreground: 'f38ba8' },
    { token: 'operator', foreground: '94e2d5' },
    { token: 'delimiter', foreground: '9399b2' },
    { token: 'delimiter.bracket', foreground: '9399b2' },
    { token: 'tag', foreground: 'cba6f7' },
    { token: 'attribute.name', foreground: '89b4fa' },
    { token: 'attribute.value', foreground: 'a6e3a1' },
    { token: 'constant', foreground: 'fab387' },
    { token: 'regexp', foreground: 'f38ba8' },
  ],
  colors: {
    'editor.background': '#1e1e2e',
    'editor.foreground': '#cdd6f4',
    'editor.lineHighlightBackground': '#313244',
    'editor.selectionBackground': '#45475a',
    'editorCursor.foreground': '#f5e0dc',
    'editorLineNumber.foreground': '#6c7086',
    'editorLineNumber.activeForeground': '#cdd6f4',
    'editor.inactiveSelectionBackground': '#31324480',
    'editorIndentGuide.background': '#31324480',
    'editorIndentGuide.activeBackground1': '#45475a',
    'editorWidget.background': '#181825',
    'editorWidget.border': '#313244',
    'editorSuggestWidget.background': '#181825',
    'editorSuggestWidget.border': '#313244',
    'editorSuggestWidget.selectedBackground': '#45475a',
    'input.background': '#313244',
    'input.border': '#45475a',
    'input.foreground': '#cdd6f4',
    'scrollbarSlider.background': '#45475a80',
    'scrollbarSlider.hoverBackground': '#585b70',
    'scrollbarSlider.activeBackground': '#6c7086',
    'minimap.background': '#181825',
    'editorGutter.background': '#1e1e2e',
    'editorBracketMatch.background': '#45475a50',
    'editorBracketMatch.border': '#89b4fa',
  },
});

// Register Python completion and hover providers (once globally)
let pythonProvidersRegistered = false;

function registerPythonProviders() {
  if (pythonProvidersRegistered) return;
  pythonProvidersRegistered = true;

  // Completion provider
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', ' '],
    async provideCompletionItems(model, position) {
      try {
        const filePath = (model as any).uri?.path || 'untitled.py';
        const content = model.getValue();
        const items = await window.lyra.python.completions(filePath, content, position.lineNumber, position.column - 1);
        if (!items || items.length === 0) return { suggestions: [] };

        const kindMap: Record<string, monaco.languages.CompletionItemKind> = {
          function: monaco.languages.CompletionItemKind.Function,
          method: monaco.languages.CompletionItemKind.Method,
          variable: monaco.languages.CompletionItemKind.Variable,
          class: monaco.languages.CompletionItemKind.Class,
          module: monaco.languages.CompletionItemKind.Module,
          keyword: monaco.languages.CompletionItemKind.Keyword,
          property: monaco.languages.CompletionItemKind.Property,
          field: monaco.languages.CompletionItemKind.Field,
          snippet: monaco.languages.CompletionItemKind.Snippet,
        };

        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: items.map((item: any) => ({
            label: item.label,
            kind: kindMap[item.kind] || monaco.languages.CompletionItemKind.Text,
            detail: item.detail || '',
            documentation: item.documentation || '',
            insertText: item.insertText || item.label,
            range,
          })),
        };
      } catch {
        return { suggestions: [] };
      }
    },
  });

  // Hover provider
  monaco.languages.registerHoverProvider('python', {
    async provideHover(model, position) {
      try {
        const filePath = (model as any).uri?.path || 'untitled.py';
        const content = model.getValue();
        const info = await window.lyra.python.hover(filePath, content, position.lineNumber, position.column - 1);
        if (!info) return null;
        return {
          contents: [{ value: info.contents }],
        };
      } catch {
        return null;
      }
    },
  });

  // Definition provider (Cmd+Click / F12)
  monaco.languages.registerDefinitionProvider('python', {
    async provideDefinition(model, position) {
      try {
        const filePath = (model as any).uri?.path || 'untitled.py';
        const content = model.getValue();
        const def = await window.lyra.python.gotoDef(filePath, content, position.lineNumber, position.column - 1);
        if (!def) return null;
        return {
          uri: monaco.Uri.file(def.file),
          range: {
            startLineNumber: def.line,
            startColumn: def.column + 1,
            endLineNumber: def.line,
            endColumn: def.column + 1,
          },
        };
      } catch {
        return null;
      }
    },
  });

  // Reference provider
  monaco.languages.registerReferenceProvider('python', {
    async provideReferences(model, position) {
      try {
        const filePath = (model as any).uri?.path || 'untitled.py';
        const content = model.getValue();
        const refs = await window.lyra.python.findRefs(filePath, content, position.lineNumber, position.column - 1);
        if (!refs || refs.length === 0) return [];
        return refs.map((ref: any) => ({
          uri: monaco.Uri.file(ref.file),
          range: {
            startLineNumber: ref.line,
            startColumn: ref.column + 1,
            endLineNumber: ref.line,
            endColumn: ref.column + 1,
          },
        }));
      } catch {
        return [];
      }
    },
  });
}

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
  filePath?: string;
}

export function CodeEditor({ content, language, onChange, filePath }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);

  // Register Python providers on first Python file
  useEffect(() => {
    if (language === 'python') {
      registerPythonProviders();
    }
  }, [language]);

  // Keep onChange ref current without re-creating editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value: content,
      language,
      theme: 'lyra-dark',
      fontSize: 14,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'off',
      renderWhitespace: 'selection',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 12, bottom: 12 },
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showMethods: true,
        showFunctions: true,
        showVariables: true,
        showClasses: true,
      },
      quickSuggestions: true,
      parameterHints: { enabled: true },
      formatOnPaste: true,
      linkedEditing: true,
    });

    editorRef.current = editor;

    const disposable = editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChangeRef.current(value);
    });

    editor.focus();

    return () => {
      disposable.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []); // Mount once — content and language are set per-tab via key prop

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
