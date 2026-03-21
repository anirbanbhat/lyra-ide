# Creating Custom Extensions

Lyra supports three types of extensions: themes, language packs, and plugins.

## Directory Structure

```
~/.lyra/extensions/
  my-extension/
    package.json
    index.js
    README.md
```

## Extension Manifest (package.json)

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "What this extension does",
  "author": "Your Name",
  "type": "theme",
  "lyra-extension": true,
  "main": "index.js",
  "contributes": {
    "themes": [
      {
        "id": "my-theme",
        "label": "My Theme",
        "path": "./themes/my-theme.json"
      }
    ]
  }
}
```

The key field is `"lyra-extension": true` — this tells Lyra to recognize the directory as an extension.

## Extension Types

- **theme**: Color themes (contributes `themes`)
- **language-pack**: Language support (contributes `languages`)
- **plugin**: General-purpose extensions

## Adding a README

Each extension should include a `README.md` in its directory. This README is displayed when users click the extension name in the Extensions panel.

## Publishing to Registry

Add your extension to `~/.lyra/extensions/registry.json` to make it browsable in the Extensions marketplace:

```json
{
  "version": 1,
  "extensions": [
    {
      "name": "my-extension",
      "displayName": "My Extension",
      "version": "1.0.0",
      "description": "What it does",
      "author": "Your Name",
      "type": "theme",
      "url": ""
    }
  ]
}
```

## Built-in Extensions

Lyra ships with the following default extension:

- **Markdown Preview** (`lyra-markdown-preview`) — Live Markdown preview with Mermaid diagram support and PDF export. Auto-installed on first run.
