import * as vscode from 'vscode';
import { ProjectProvider, ProjectTreeItem } from './projectProvider';
import { UsageTracker } from './usageTracker';
import { FavoritesManager } from './favorites';
import { ProjectType, PROJECT_TYPE_LABELS, SortMode } from './types';

let _projectsProvider: ProjectProvider;
let _favoritesProvider: ProjectProvider;

export function activate(context: vscode.ExtensionContext): void {
  const usageTracker = new UsageTracker(context.globalState);
  const favorites = new FavoritesManager(context.globalState);

  // Create two providers sharing the same data
  _projectsProvider = new ProjectProvider(usageTracker, favorites, 'projects');
  _favoritesProvider = new ProjectProvider(usageTracker, favorites, 'favorites');

  // Register tree views
  const projectsView = vscode.window.createTreeView('projectCentral.projects', {
    treeDataProvider: _projectsProvider,
    showCollapseAll: true,
  });

  const favoritesView = vscode.window.createTreeView('projectCentral.favorites', {
    treeDataProvider: _favoritesProvider,
  });

  context.subscriptions.push(projectsView, favoritesView);

  // Update context for conditional views
  const updateFavoritesContext = () => {
    const showFavs = vscode.workspace.getConfiguration('projectCentral').get('showFavorites', true);
    vscode.commands.executeCommand('setContext', 'projectCentral.hasFavorites', showFavs && favorites.count > 0);
  };

  const updateNoRootFoldersContext = () => {
    const rootFolders = vscode.workspace.getConfiguration('projectCentral').get<unknown[]>('rootFolders', []);
    vscode.commands.executeCommand('setContext', 'projectCentral.noRootFolders', rootFolders.length === 0);
  };

  // --- Commands ---

  const refreshAll = async () => {
    await _projectsProvider.refresh();
    await _favoritesProvider.refresh();
    updateFavoritesContext();
    updateNoRootFoldersContext();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.refresh', refreshAll),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.openNewWindow', async (item?: ProjectTreeItem) => {
      const projectPath = item?.project.path ?? await pickProject('Open in New Window');
      if (!projectPath) { return; }
      usageTracker.recordOpen(projectPath);
      _projectsProvider.fireChange();
      _favoritesProvider.fireChange();
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.openCurrentWindow', async (item?: ProjectTreeItem) => {
      const projectPath = item?.project.path ?? await pickProject('Open in Current Window');
      if (!projectPath) { return; }

      const confirm = vscode.workspace.getConfiguration('projectCentral').get('confirmOpenInCurrentWindow', true);
      if (confirm) {
        const answer = await vscode.window.showWarningMessage(
          `Open "${item?.project.name ?? projectPath}" in the current window? Unsaved changes may be lost.`,
          { modal: true },
          'Open',
        );
        if (answer !== 'Open') { return; }
      }

      usageTracker.recordOpen(projectPath);
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), false);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.toggleFavorite', (item?: ProjectTreeItem) => {
      if (!item) { return; }
      const isNowFav = favorites.toggle(item.project.path);
      _projectsProvider.fireChange();
      _favoritesProvider.fireChange();
      updateFavoritesContext();
      vscode.window.showInformationMessage(
        isNowFav
          ? `Added "${item.project.name}" to favorites`
          : `Removed "${item.project.name}" from favorites`,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.removeFavorite', (item?: ProjectTreeItem) => {
      if (!item) { return; }
      favorites.remove(item.project.path);
      _projectsProvider.fireChange();
      _favoritesProvider.fireChange();
      updateFavoritesContext();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.sortBy', async () => {
      const options: Array<{ label: string; value: SortMode; description?: string }> = [
        { label: '$(sort-precedence) Alphabetical A → Z', value: 'alphabet-asc' },
        { label: '$(sort-precedence) Alphabetical Z → A', value: 'alphabet-desc' },
        { label: '$(flame) Most Opened', value: 'usage' },
        { label: '$(history) Recently Opened', value: 'last-opened' },
      ];

      const current = vscode.workspace.getConfiguration('projectCentral').get<SortMode>('sortBy', 'alphabet-asc');
      const currentIdx = options.findIndex(o => o.value === current);
      if (currentIdx >= 0) {
        options[currentIdx].description = '(current)';
      }

      const picked = await vscode.window.showQuickPick(options, { placeHolder: 'Sort projects by...' });
      if (!picked) { return; }

      await vscode.workspace.getConfiguration('projectCentral').update('sortBy', picked.value, vscode.ConfigurationTarget.Global);
      _projectsProvider.fireChange();
      _favoritesProvider.fireChange();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.filterByType', async () => {
      const allTypes = Object.values(ProjectType);
      const currentFilter = vscode.workspace.getConfiguration('projectCentral').get<string[]>('filterByType', []);

      const items = allTypes.map(t => ({
        label: PROJECT_TYPE_LABELS[t],
        value: t,
        picked: currentFilter.includes(t),
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Filter by project type (select none to show all)',
        canPickMany: true,
      });

      if (!picked) { return; }

      const selectedTypes = picked.map(p => p.value);
      await vscode.workspace.getConfiguration('projectCentral').update('filterByType', selectedTypes, vscode.ConfigurationTarget.Global);
      _projectsProvider.setFilter(selectedTypes);
      _favoritesProvider.setFilter(selectedTypes);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.quickOpen', async () => {
      const projectPath = await pickProject('Quick Open Project');
      if (!projectPath) { return; }
      usageTracker.recordOpen(projectPath);
      _projectsProvider.fireChange();
      _favoritesProvider.fireChange();
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), true);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.addRootFolder', async () => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Root Folder',
        title: 'Add a root folder to scan for projects',
      });

      if (!uris || uris.length === 0) { return; }
      const folderPath = uris[0].fsPath;

      const config = vscode.workspace.getConfiguration('projectCentral');
      const rootFolders = config.get<unknown[]>('rootFolders', []);
      rootFolders.push({ path: folderPath, maxDepth: 1 });
      await config.update('rootFolders', rootFolders, vscode.ConfigurationTarget.Global);

      await refreshAll();
      vscode.window.showInformationMessage(`Added "${folderPath}" to Project Central.`);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.openInTerminal', (item?: ProjectTreeItem) => {
      if (!item) { return; }
      const terminal = vscode.window.createTerminal({
        name: item.project.name,
        cwd: item.project.path,
      });
      terminal.show();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.copyPath', (item?: ProjectTreeItem) => {
      if (!item) { return; }
      vscode.env.clipboard.writeText(item.project.path);
      vscode.window.showInformationMessage(`Copied: ${item.project.path}`);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectCentral.revealInFinder', (item?: ProjectTreeItem) => {
      if (!item) { return; }
      vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(item.project.path));
    }),
  );

  // --- Config change listener ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('projectCentral')) {
        refreshAll();
      }
    }),
  );

  // --- Favorites change listener ---
  context.subscriptions.push(
    favorites.onDidChange(() => {
      updateFavoritesContext();
    }),
  );

  // --- Helper: QuickPick for project selection ---
  async function pickProject(title: string): Promise<string | undefined> {
    const allProjects = _projectsProvider.projects;
    if (allProjects.length === 0) {
      vscode.window.showInformationMessage('No projects found. Add root folders in settings.');
      return undefined;
    }

    const favPaths = new Set(favorites.getAll());

    const items = allProjects
      .sort((a, b) => {
        // Favorites first, then alphabetical
        const aFav = favPaths.has(a.path) ? 0 : 1;
        const bFav = favPaths.has(b.path) ? 0 : 1;
        if (aFav !== bFav) { return aFav - bFav; }
        return a.name.localeCompare(b.name);
      })
      .map(p => ({
        label: `${favPaths.has(p.path) ? '$(star-full) ' : ''}${p.name}`,
        description: p.types.map(t => PROJECT_TYPE_LABELS[t]).join(', '),
        detail: p.path,
        path: p.path,
      }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: title,
      matchOnDescription: true,
      matchOnDetail: true,
    });

    return picked?.path;
  }

  // Initial load
  refreshAll();
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
