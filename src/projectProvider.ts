import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectInfo, ProjectType, SortMode, PROJECT_TYPE_LABELS, getProjectTypeIcon, getPrimaryType } from './types';
import { ProjectScanner } from './projectScanner';
import { UsageTracker } from './usageTracker';
import { FavoritesManager } from './favorites';

export class ProjectTreeItem extends vscode.TreeItem {
  constructor(
    public readonly project: ProjectInfo,
    public readonly isFavorite: boolean,
    usageTracker: UsageTracker,
  ) {
    super(project.name, vscode.TreeItemCollapsibleState.None);

    const primaryType = getPrimaryType(project.types);
    const typeLabels = project.types.map(t => PROJECT_TYPE_LABELS[t]).join(', ');
    const usage = usageTracker.getRecord(project.path);

    this.description = typeLabels;
    this.tooltip = new vscode.MarkdownString(
      `**${project.name}**\n\n` +
      `$(folder) \`${project.path}\`\n\n` +
      `Types: ${typeLabels}\n\n` +
      `Opened: ${usage.openCount} time${usage.openCount !== 1 ? 's' : ''}` +
      (usage.lastOpened ? `\n\nLast: ${new Date(usage.lastOpened).toLocaleDateString()}` : ''),
    );
    this.tooltip.supportThemeIcons = true;

    this.iconPath = getProjectTypeIcon(primaryType);
    this.contextValue = isFavorite ? 'favoriteProject' : 'project';

    this.command = {
      command: 'projectCentral.openNewWindow',
      title: 'Open in New Window',
      arguments: [this],
    };

    this.resourceUri = vscode.Uri.file(project.path);
  }
}

export class RootFolderItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly rootPath: string,
    childCount: number,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);

    this.description = `${childCount} project${childCount !== 1 ? 's' : ''}`;
    this.iconPath = {
      light: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'icons', 'light', 'folder-root.svg')),
      dark: vscode.Uri.file(path.join(__dirname, '..', 'resources', 'icons', 'dark', 'folder-root.svg')),
    };
    this.contextValue = 'rootFolder';
  }
}

type TreeNode = RootFolderItem | ProjectTreeItem;

export class ProjectProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _projects: ProjectInfo[] = [];
  private _activeFilter: ProjectType[] = [];
  private readonly _scanner = new ProjectScanner();

  constructor(
    private readonly _usageTracker: UsageTracker,
    private readonly _favorites: FavoritesManager,
    private readonly _mode: 'projects' | 'favorites',
  ) {}

  get projects(): ProjectInfo[] {
    return this._projects;
  }

  async refresh(): Promise<void> {
    this._projects = await this._scanner.scanAll();
    this._loadFilterFromConfig();
    this._onDidChangeTreeData.fire();
  }

  setFilter(types: ProjectType[]): void {
    this._activeFilter = types;
    this._onDidChangeTreeData.fire();
  }

  fireChange(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (this._mode === 'favorites') {
      return this._getFavoriteChildren();
    }
    return this._getProjectChildren(element);
  }

  private _getFavoriteChildren(): ProjectTreeItem[] {
    const favPaths = new Set(this._favorites.getAll());
    return this._getFilteredProjects()
      .filter(p => favPaths.has(p.path))
      .sort((a, b) => this._sortCompare(a, b))
      .map(p => new ProjectTreeItem(p, true, this._usageTracker));
  }

  private _getProjectChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      // Root level: group by root folder
      const groups = this._groupByRoot(this._getFilteredProjects());
      const rootLabels = [...groups.keys()];

      if (rootLabels.length === 1) {
        // Single root: skip the grouping level, show projects directly
        const [, projects] = [...groups.entries()][0];
        return projects
          .sort((a, b) => this._sortCompare(a, b))
          .map(p => new ProjectTreeItem(p, this._favorites.isFavorite(p.path), this._usageTracker));
      }

      return rootLabels.map(label => {
        const projects = groups.get(label)!;
        const rootPath = projects[0].rootFolder;
        return new RootFolderItem(label, rootPath, projects.length);
      });
    }

    if (element instanceof RootFolderItem) {
      return this._getFilteredProjects()
        .filter(p => p.rootFolder === element.rootPath)
        .sort((a, b) => this._sortCompare(a, b))
        .map(p => new ProjectTreeItem(p, this._favorites.isFavorite(p.path), this._usageTracker));
    }

    return [];
  }

  private _getFilteredProjects(): ProjectInfo[] {
    if (this._activeFilter.length === 0) {
      return this._projects;
    }
    return this._projects.filter(p =>
      p.types.some(t => this._activeFilter.includes(t)),
    );
  }

  private _groupByRoot(projects: ProjectInfo[]): Map<string, ProjectInfo[]> {
    const map = new Map<string, ProjectInfo[]>();
    for (const p of projects) {
      const group = map.get(p.rootLabel) ?? [];
      group.push(p);
      map.set(p.rootLabel, group);
    }
    return map;
  }

  private _sortCompare(a: ProjectInfo, b: ProjectInfo): number {
    const mode = this._getSortMode();
    switch (mode) {
      case 'alphabet-asc':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'alphabet-desc':
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      case 'usage': {
        const usageA = this._usageTracker.getRecord(a.path).openCount;
        const usageB = this._usageTracker.getRecord(b.path).openCount;
        return usageB - usageA || a.name.localeCompare(b.name);
      }
      case 'last-opened': {
        const lastA = this._usageTracker.getRecord(a.path).lastOpened;
        const lastB = this._usageTracker.getRecord(b.path).lastOpened;
        return lastB - lastA || a.name.localeCompare(b.name);
      }
      default:
        return 0;
    }
  }

  private _getSortMode(): SortMode {
    return vscode.workspace.getConfiguration('projectCentral').get<SortMode>('sortBy', 'alphabet-asc');
  }

  private _loadFilterFromConfig(): void {
    const configured = vscode.workspace.getConfiguration('projectCentral')
      .get<string[]>('filterByType', []);
    this._activeFilter = configured
      .map(t => t as ProjectType)
      .filter(t => Object.values(ProjectType).includes(t));
  }
}
