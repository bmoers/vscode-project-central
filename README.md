# Project Central

Browse, organize, and quickly open your projects — all from the VSCode sidebar.

Project Central scans one or more root directories, detects project types automatically, and presents them in a clean tree view with favorites, sorting, filtering, and usage tracking.

---

## Features

- **Activity Bar Icon** — A dedicated entry in the Activity Bar (left sidebar) with a hexagonal hub icon
- **Project Detection** — Automatically detects 7 project types based on marker files (see table below)
- **Favorites** — Star projects as favorites; they appear in a dedicated section at the top
- **Sorting** — 4 modes: Alphabetical (A-Z / Z-A), Most Opened, Recently Opened
- **Filtering** — Show only specific project types
- **Quick Open** — Keyboard shortcut `Cmd+Alt+P` (Mac) / `Ctrl+Alt+P` (Windows/Linux) to quickly open a project via fuzzy search
- **Multi-Root** — Multiple scan directories with individual labels and settings
- **Usage Tracking** — Counts how often each project is opened, persisted across sessions
- **Context Menu** — Right-click on a project for: Open in New/Current Window, Terminal, Copy Path, Reveal in Finder

### Detected Project Types

| Type | Detected by |
|------|-------------|
| Git | `.git` directory |
| VS Code | `.vscode` directory |
| IntelliJ | `.idea` directory |
| Node.js | `package.json` |
| Rust | `Cargo.toml` |
| Python | `pyproject.toml`, `setup.py`, or `requirements.txt` |
| Go | `go.mod` |

---

## Getting Started

### 1. Add a Root Folder

After installation, the sidebar is empty. There are **three ways** to add root folders:

#### Option A: Via the Sidebar (recommended)

1. Click the **Project Central** icon in the Activity Bar (left sidebar)
2. In the empty view, click the **"Add Root Folder"** button
3. Select the folder containing your projects (e.g. `~/Projects`)

#### Option B: Via the Command Palette

1. `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)
2. Type: `Project Central: Add Root Folder`
3. Select the folder

#### Option C: Directly in settings.json

1. `Cmd+Shift+P` → `Preferences: Open User Settings (JSON)`
2. Add the following block:

```jsonc
{
  "projectCentral.rootFolders": [
    {
      "path": "~/Projects",
      "maxDepth": 1
    }
  ]
}
```

---

## Configuration — All Settings in Detail

All settings are stored in VSCode's `settings.json` and are also accessible via the Settings UI.

### Where Can I Edit Settings?

| Method | How |
|--------|-----|
| **Settings UI** | `Cmd+,` (Mac) / `Ctrl+,` → Search for "Project Central" |
| **settings.json (User)** | `Cmd+Shift+P` → `Preferences: Open User Settings (JSON)` |
| **settings.json (Workspace)** | `Cmd+Shift+P` → `Preferences: Open Workspace Settings (JSON)` |

> **User Settings** apply globally to all VSCode windows. **Workspace Settings** apply only to the current workspace and override User Settings.

---

### `projectCentral.rootFolders`

**Type:** `Array of objects`
**Default:** `[]` (empty)

The central setting. Defines which directories are scanned for projects. Each entry has the following properties:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `path` | `string` | Yes | — | Absolute path to the directory. Supports `~` as the home directory. |
| `maxDepth` | `number` | No | `1` | How deep to scan. `1` = direct children only, `2` = also their subdirectories, etc. |
| `projectTypes` | `string[]` | No | `[]` (all) | Only show projects of these types. Empty = detect all types. Possible values: `"git"`, `"vscode"`, `"idea"`, `"node"`, `"rust"`, `"python"`, `"go"` |
| `label` | `string` | No | folder name | Display label for the group in the sidebar. If not set, the folder name is used. |

#### Examples

**Simple — one folder:**

```jsonc
"projectCentral.rootFolders": [
  {
    "path": "~/Projects"
  }
]
```

**Multiple folders with labels:**

```jsonc
"projectCentral.rootFolders": [
  {
    "path": "~/Projects/work",
    "label": "Work",
    "maxDepth": 2,
    "projectTypes": ["git", "node"]
  },
  {
    "path": "~/Projects/personal",
    "label": "Personal"
  },
  {
    "path": "~/go/src",
    "label": "Go Workspace",
    "projectTypes": ["go"]
  }
]
```

**XAMPP/Laragon users:**

```jsonc
"projectCentral.rootFolders": [
  {
    "path": "C:\\laragon\\www",
    "label": "Laragon Sites"
  }
]
```

> **Note:** When multiple root folders are configured, they are displayed as collapsible groups in the sidebar. With a single root folder, projects are shown directly without grouping.

---

### `projectCentral.sortBy`

**Type:** `string`
**Default:** `"alphabet-asc"`

Determines the sort order of projects in the sidebar.

| Value | Description |
|-------|-------------|
| `"alphabet-asc"` | Alphabetical A → Z |
| `"alphabet-desc"` | Alphabetical Z → A |
| `"usage"` | Most opened projects first. Projects you use frequently appear at the top. Ties are broken alphabetically. |
| `"last-opened"` | Recently opened projects first. The project you opened most recently appears at the top. |

#### How to Change

**Via Settings UI:**
`Cmd+,` → Search "Project Central Sort" → Select from dropdown

**Via settings.json:**

```jsonc
"projectCentral.sortBy": "usage"
```

**Via Sidebar button:**
Click the **Sort icon** in the Projects view toolbar → A QuickPick menu appears.

**Via Command Palette:**
`Cmd+Shift+P` → `Project Central: Sort Projects By...`

---

### `projectCentral.filterByType`

**Type:** `string[]`
**Default:** `[]` (empty = show all)

Filters the displayed projects by type. Only projects that have at least one of the specified types are shown.

**Possible values:** `"git"`, `"vscode"`, `"idea"`, `"node"`, `"rust"`, `"python"`, `"go"`

#### Filter Examples

**Show only Git and Node projects:**

```jsonc
"projectCentral.filterByType": ["git", "node"]
```

**Show all (default):**

```jsonc
"projectCentral.filterByType": []
```

#### How to Change the Filter

**Via Sidebar button:**
Click the **Filter icon** (funnel) in the toolbar → A multi-select QuickPick appears, select the desired types.

**Via Command Palette:**
`Cmd+Shift+P` → `Project Central: Filter by Project Type...`

**Via settings.json:**

```jsonc
"projectCentral.filterByType": ["python", "rust"]
```

> **Tip:** A project can have multiple types simultaneously. A Node.js project with Git has the types `["git", "node"]`. It will be shown as long as *any* of its types match the filter.

---

### `projectCentral.showFavorites`

**Type:** `boolean`
**Default:** `true`

Controls whether the **Favorites section** is displayed in the sidebar. The section only appears when at least one project is marked as a favorite AND this setting is `true`.

```jsonc
"projectCentral.showFavorites": true
```

Set to `false` to completely hide the Favorites section — favorite markings are preserved and will reappear when the setting is changed back to `true`.

---

### `projectCentral.confirmOpenInCurrentWindow`

**Type:** `boolean`
**Default:** `true`

When `true`, a confirmation dialog appears before opening a project in the **current window** (since unsaved changes could be lost).

```jsonc
"projectCentral.confirmOpenInCurrentWindow": true
```

Set to `false` if you don't need the confirmation and want to open projects directly in the current window.

> **Note:** This setting only affects "Open in Current Window". "Open in New Window" (the default click action) always opens a new window without prompting.

---

## Commands

All commands are accessible via the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`). Type "Project Central" to find them.

| Command | Description | Available in |
|---------|-------------|--------------|
| **Quick Open Project** | Opens a fuzzy-search dropdown with all projects. Favorites appear first. | Command Palette, Keybinding `Cmd+Alt+P` |
| **Refresh Projects** | Re-scans all root folders. Also happens automatically on config changes. | Command Palette, Sidebar Toolbar |
| **Toggle Favorite** | Stars/unstars a project as favorite. | Right-click on project, Inline button (star) |
| **Remove from Favorites** | Removes a project from favorites. | Right-click in Favorites view |
| **Sort Projects By...** | Opens a QuickPick with sort options. | Command Palette, Sidebar Toolbar |
| **Filter by Project Type...** | Opens a multi-select with project types. | Command Palette, Sidebar Toolbar |
| **Open in New Window** | Opens the project in a new VSCode window. | Right-click, Single-click on project |
| **Open in Current Window** | Opens the project in the current window (with optional confirmation). | Right-click on project |
| **Add Root Folder** | Opens a folder dialog to add a new root folder. | Command Palette, Welcome view |
| **Open in Terminal** | Opens a new terminal in the project directory. | Right-click on project |
| **Copy Path** | Copies the absolute project path to the clipboard. | Right-click on project |
| **Reveal in Finder / Explorer** | Opens the project folder in the OS file manager. | Right-click on project |

---

## Keyboard Shortcuts

| Action | Mac | Windows / Linux |
|--------|-----|-----------------|
| Quick Open Project | `Cmd+Alt+P` | `Ctrl+Alt+P` |

To customize the shortcut: `Cmd+K Cmd+S` → Search for "Project Central Quick Open" → Assign a new shortcut.

---

## Data Storage

| Data | Stored in | Persistence |
|------|-----------|-------------|
| Root Folders, Sort, Filter | `settings.json` (User or Workspace) | Editable via Settings UI / JSON |
| Favorites | VSCode `globalState` | Automatic, survives updates and reinstalls |
| Usage Data (Open Count, Last Opened) | VSCode `globalState` | Automatic, survives updates and reinstalls |

> `globalState` is VSCode's internal key-value store per extension. The data lives in your VSCode profile and is not written to files you can edit directly.

---

## Full Settings Example

A typical `settings.json` configuration:

```jsonc
{
  // ── Project Central ──────────────────────────────────────

  // Three project folders with different settings
  "projectCentral.rootFolders": [
    {
      "path": "~/Projects/work",
      "label": "Work",
      "maxDepth": 2,
      "projectTypes": ["git"]
    },
    {
      "path": "~/Projects/personal",
      "label": "Personal"
    },
    {
      "path": "~/go/src/github.com/myuser",
      "label": "Go",
      "projectTypes": ["go"]
    }
  ],

  // Most frequently used projects first
  "projectCentral.sortBy": "usage",

  // Show only Git and Node projects (empty = all)
  "projectCentral.filterByType": [],

  // Show the Favorites section
  "projectCentral.showFavorites": true,

  // Confirmation dialog for "Open in Current Window"
  "projectCentral.confirmOpenInCurrentWindow": true
}
```

---

## Development

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Test the extension: Press F5 in VSCode
# → Launches the Extension Development Host
```

---

## Credits

Inspired by:

- [Projects Browser](https://github.com/matteomorlack/projects-browser-vscode-extension) by Matteo Morlack
- [Project Hub](https://github.com/mrmryb/vscode-project-hub) by mrmryb

## License

MIT
