import * as vscode from 'vscode';

export enum ProjectType {
  Git = 'git',
  VSCode = 'vscode',
  IntelliJ = 'idea',
  Node = 'node',
  Rust = 'rust',
  Python = 'python',
  Go = 'go',
}

export interface RootFolderConfig {
  path: string;
  maxDepth?: number;
  projectTypes?: string[];
  label?: string;
}

export interface ProjectInfo {
  name: string;
  path: string;
  types: ProjectType[];
  rootFolder: string;
  rootLabel: string;
}

export interface UsageRecord {
  openCount: number;
  lastOpened: number; // timestamp
}

export type SortMode = 'alphabet-asc' | 'alphabet-desc' | 'usage' | 'last-opened';

export const PROJECT_TYPE_MARKERS: Record<ProjectType, string[]> = {
  [ProjectType.Git]: ['.git'],
  [ProjectType.VSCode]: ['.vscode'],
  [ProjectType.IntelliJ]: ['.idea'],
  [ProjectType.Node]: ['package.json'],
  [ProjectType.Rust]: ['Cargo.toml'],
  [ProjectType.Python]: ['pyproject.toml', 'setup.py', 'requirements.txt'],
  [ProjectType.Go]: ['go.mod'],
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [ProjectType.Git]: 'Git',
  [ProjectType.VSCode]: 'VS Code',
  [ProjectType.IntelliJ]: 'IntelliJ',
  [ProjectType.Node]: 'Node.js',
  [ProjectType.Rust]: 'Rust',
  [ProjectType.Python]: 'Python',
  [ProjectType.Go]: 'Go',
};

export function getProjectTypeIcon(type: ProjectType): vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri } {
  const iconMap: Record<string, string> = {
    git: 'git',
    node: 'node',
    python: 'python',
    rust: 'rust',
    go: 'go',
  };

  const iconName = iconMap[type];
  if (iconName) {
    return {
      light: vscode.Uri.file(__dirname + `/../resources/icons/light/${iconName}.svg`),
      dark: vscode.Uri.file(__dirname + `/../resources/icons/dark/${iconName}.svg`),
    };
  }

  // Fallback to codicons for types without custom icons
  switch (type) {
    case ProjectType.VSCode: return new vscode.ThemeIcon('code');
    case ProjectType.IntelliJ: return new vscode.ThemeIcon('beaker');
    default: return new vscode.ThemeIcon('folder');
  }
}

export function getPrimaryType(types: ProjectType[]): ProjectType {
  // Priority: language-specific > tooling > generic
  const priority: ProjectType[] = [
    ProjectType.Rust, ProjectType.Go, ProjectType.Python, ProjectType.Node,
    ProjectType.IntelliJ, ProjectType.VSCode, ProjectType.Git,
  ];
  for (const p of priority) {
    if (types.includes(p)) { return p; }
  }
  return types[0] ?? ProjectType.Git;
}
