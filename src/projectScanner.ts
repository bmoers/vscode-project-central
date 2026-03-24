import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectInfo, ProjectType, PROJECT_TYPE_MARKERS, RootFolderConfig } from './types';

export class ProjectScanner {
  async scanAll(): Promise<ProjectInfo[]> {
    const config = vscode.workspace.getConfiguration('projectCentral');
    const rootFolders: RootFolderConfig[] = config.get('rootFolders', []);
    const allProjects: ProjectInfo[] = [];

    for (const rootConfig of rootFolders) {
      const expandedPath = this._expandHome(rootConfig.path);
      if (!fs.existsSync(expandedPath)) {
        continue;
      }

      const label = rootConfig.label || path.basename(expandedPath);
      const maxDepth = rootConfig.maxDepth ?? 1;
      const filterTypes = (rootConfig.projectTypes ?? [])
        .map(t => t as ProjectType)
        .filter(t => Object.values(ProjectType).includes(t));

      const projects = await this._scanDirectory(expandedPath, label, expandedPath, maxDepth, 0, filterTypes);
      allProjects.push(...projects);
    }

    return allProjects;
  }

  private async _scanDirectory(
    dir: string,
    rootLabel: string,
    rootFolder: string,
    maxDepth: number,
    currentDepth: number,
    filterTypes: ProjectType[],
  ): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return projects;
    }

    // Check if current directory is a project
    if (currentDepth > 0) {
      const detectedTypes = this._detectProjectTypes(dir, entries);
      if (detectedTypes.length > 0) {
        const matchesFilter = filterTypes.length === 0 || detectedTypes.some(t => filterTypes.includes(t));
        if (matchesFilter) {
          projects.push({
            name: path.basename(dir),
            path: dir,
            types: detectedTypes,
            rootFolder,
            rootLabel,
          });
        }
        // Found a project — don't recurse deeper into it
        return projects;
      }
    }

    // Recurse into subdirectories
    if (currentDepth < maxDepth) {
      const subdirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      for (const subdir of subdirs) {
        const subPath = path.join(dir, subdir.name);
        const subProjects = await this._scanDirectory(
          subPath, rootLabel, rootFolder, maxDepth, currentDepth + 1, filterTypes,
        );
        projects.push(...subProjects);
      }
    }

    return projects;
  }

  private _detectProjectTypes(dir: string, entries: fs.Dirent[]): ProjectType[] {
    const entryNames = new Set(entries.map(e => e.name));
    const detected: ProjectType[] = [];

    for (const [type, markers] of Object.entries(PROJECT_TYPE_MARKERS)) {
      for (const marker of markers) {
        if (entryNames.has(marker)) {
          detected.push(type as ProjectType);
          break;
        }
      }
    }

    return detected;
  }

  private _expandHome(p: string): string {
    if (p.startsWith('~/') || p === '~') {
      const home = process.env.HOME || process.env.USERPROFILE || '';
      return path.join(home, p.slice(2));
    }
    return p;
  }
}
