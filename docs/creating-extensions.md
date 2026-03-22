# Creating Custom Extensions

Lyra supports three types of extensions: themes, language packs, and plugins. Each extension lives in its own Git repository and is discovered through the [Lyra Extensions Registry](https://github.com/anirbanbhat/lyra-extensions-registry).

## Quick Start

1. Create a new Git repository for your extension
2. Add a `package.json` with `"lyra-extension": true`
3. Register it in the [extensions registry](https://github.com/anirbanbhat/lyra-extensions-registry)

## Extension Repository Structure

```
your-extension/
  package.json       # Must contain "lyra-extension": true
  index.js           # Entry point (for plugins)
  README.md          # Displayed in the Lyra marketplace
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

Each extension should include a `README.md` in its root directory. This README is displayed when users click the extension name in the Extensions panel, rendered as formatted Markdown with full preview support.

## How Installation Works

When a user installs your extension from the marketplace:

1. Lyra looks up your extension in the registry
2. If your entry has a `repository` field, Lyra runs `git clone --depth 1` to download your extension into `~/.lyra/extensions/<name>/`
3. If no `repository` is provided, Lyra creates a scaffold with basic files
4. The `.git` directory is removed after cloning (extensions don't need version control locally)

## Registering Your Extension

To make your extension discoverable in the Lyra marketplace, you need to add it to the [Lyra Extensions Registry](https://github.com/anirbanbhat/lyra-extensions-registry).

### Step 1: Prepare Your Extension Repository

Make sure your extension repo is public on GitHub and contains a valid `package.json` with `"lyra-extension": true`.

### Step 2: Fork the Registry

Fork [anirbanbhat/lyra-extensions-registry](https://github.com/anirbanbhat/lyra-extensions-registry) on GitHub.

### Step 3: Add Your Entry

Edit `registry.json` and add your extension to the `extensions` array:

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "A brief description of what it does",
  "author": "Your Name",
  "type": "plugin",
  "url": "",
  "repository": "https://github.com/your-username/my-extension.git"
}
```

| Field         | Required | Description                                                    |
|---------------|----------|----------------------------------------------------------------|
| `name`        | Yes      | Unique identifier (lowercase, hyphens). Must match your `package.json` `name`. |
| `displayName` | Yes      | Human-readable name shown in the marketplace.                  |
| `version`     | Yes      | Semver version string.                                         |
| `description` | Yes      | Short description (one sentence).                              |
| `author`      | Yes      | Author name or organization.                                   |
| `type`        | Yes      | One of: `theme`, `language-pack`, `plugin`.                    |
| `url`         | Yes      | Homepage or documentation URL (can be empty string).           |
| `repository`  | No       | Git clone URL. If provided, Lyra clones the repo on install.   |

### Step 4: Submit a Pull Request

Open a pull request to the main registry repo. Once merged, your extension will appear in every Lyra user's marketplace.

## Updating Your Extension

When you push updates to your extension repository, users who install (or reinstall) your extension will get the latest version. To update the version number shown in the marketplace, submit a PR to the registry updating the `version` field.

## Local Development

During development, you can install your extension locally without registering it:

```bash
cd ~/.lyra/extensions
git clone https://github.com/your-username/my-extension.git
```

Restart Lyra and your extension will appear in the installed extensions list.

## Built-in Extensions

Lyra ships with the following default extension:

- **Markdown Preview** (`lyra-markdown-preview`) — Live Markdown preview with Mermaid diagram support and PDF export. Auto-installed on first run.
