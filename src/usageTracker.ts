import * as vscode from 'vscode';
import { UsageRecord } from './types';

const STORAGE_KEY = 'projectCentral.usageData';

export class UsageTracker {
  private _data: Record<string, UsageRecord> = {};

  constructor(private readonly _globalState: vscode.Memento) {
    this._load();
  }

  recordOpen(projectPath: string): void {
    const existing = this._data[projectPath] ?? { openCount: 0, lastOpened: 0 };
    existing.openCount++;
    existing.lastOpened = Date.now();
    this._data[projectPath] = existing;
    this._save();
  }

  getRecord(projectPath: string): UsageRecord {
    return this._data[projectPath] ?? { openCount: 0, lastOpened: 0 };
  }

  getAllRecords(): Record<string, UsageRecord> {
    return { ...this._data };
  }

  private _load(): void {
    this._data = this._globalState.get<Record<string, UsageRecord>>(STORAGE_KEY, {});
  }

  private _save(): void {
    this._globalState.update(STORAGE_KEY, this._data);
  }
}
