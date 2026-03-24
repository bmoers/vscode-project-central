import * as vscode from 'vscode';

const STORAGE_KEY = 'projectCentral.favorites';

export class FavoritesManager {
  private _favorites: Set<string>;
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly _globalState: vscode.Memento) {
    const stored = this._globalState.get<string[]>(STORAGE_KEY, []);
    this._favorites = new Set(stored);
  }

  isFavorite(projectPath: string): boolean {
    return this._favorites.has(projectPath);
  }

  toggle(projectPath: string): boolean {
    if (this._favorites.has(projectPath)) {
      this._favorites.delete(projectPath);
    } else {
      this._favorites.add(projectPath);
    }
    this._save();
    this._onDidChange.fire();
    return this._favorites.has(projectPath);
  }

  remove(projectPath: string): void {
    this._favorites.delete(projectPath);
    this._save();
    this._onDidChange.fire();
  }

  getAll(): string[] {
    return [...this._favorites];
  }

  get count(): number {
    return this._favorites.size;
  }

  private _save(): void {
    this._globalState.update(STORAGE_KEY, [...this._favorites]);
  }
}
