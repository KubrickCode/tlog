import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { rgPath } from "@vscode/ripgrep";

const RIPGREP_SEARCH_PATTERN = "console.log.*[TLOG]";
const NODE_MODULES_EXCLUDE_PATTERN = "!**/node_modules/**";

export interface TlogItem {
  filePath: string;
  line: number;
  column: number;
  content: string;
}

export interface TlogFileGroup {
  filePath: string;
  items: TlogItem[];
}

export class TlogTreeDataProvider implements vscode.TreeDataProvider<TlogTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TlogTreeItem | undefined | null | void> = new vscode.EventEmitter<TlogTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TlogTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private tlogGroups: TlogFileGroup[] = [];

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.scanTlogs().then((groups) => {
      this.tlogGroups = groups;
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TlogTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TlogTreeItem): Thenable<TlogTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.tlogGroups.map(group => new TlogFileTreeItem(group)));
    }

    if (element instanceof TlogFileTreeItem) {
      return Promise.resolve(element.group.items.map(item => new TlogItemTreeItem(item)));
    }

    return Promise.resolve([]);
  }

  private async scanTlogs(): Promise<TlogFileGroup[]> {
    const workspacePath = this.getWorkspacePath();
    if (!workspacePath) return [];

    try {
      const searchResults = await this.searchTlogsWithRipgrep(workspacePath);
      return this.groupTlogsByFile(searchResults);
    } catch (error) {
      console.error('Failed to scan TLOGs:', error);
      return [];
    }
  }

  private getWorkspacePath(): string | null {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return null;
    }
    return folders[0].uri.fsPath;
  }

  private searchTlogsWithRipgrep(workspacePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const command = `"${rgPath}" --vimgrep "${RIPGREP_SEARCH_PATTERN}" "${workspacePath}" -g "${NODE_MODULES_EXCLUDE_PATTERN}"`;

      cp.exec(command, (error, stdout, stderr) => {
        if (error && !stdout) {
          reject(new Error(stderr));
          return;
        }

        const results = stdout
          .trim()
          .split("\n")
          .filter((line) => line.length > 0);
        resolve(results);
      });
    });
  }

  private groupTlogsByFile(searchResults: string[]): TlogFileGroup[] {
    const groups = new Map<string, TlogItem[]>();

    searchResults.forEach((line) => {
      const parts = line.split(":");
      if (parts.length < 4) return;

      const filePath = parts[0];
      const lineNumber = parseInt(parts[1], 10);
      const columnNumber = parseInt(parts[2], 10);
      const content = parts.slice(3).join(":").trim();

      if (isNaN(lineNumber) || isNaN(columnNumber)) return;

      const tlogItem: TlogItem = {
        filePath,
        line: lineNumber - 1, // Convert to 0-based
        column: columnNumber - 1, // Convert to 0-based
        content
      };

      if (!groups.has(filePath)) {
        groups.set(filePath, []);
      }
      groups.get(filePath)!.push(tlogItem);
    });

    return Array.from(groups.entries()).map(([filePath, items]) => ({
      filePath,
      items: items.sort((a, b) => a.line - b.line)
    }));
  }
}

export abstract class TlogTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export class TlogFileTreeItem extends TlogTreeItem {
  constructor(public readonly group: TlogFileGroup) {
    super(
      path.basename(group.filePath),
      vscode.TreeItemCollapsibleState.Expanded
    );

    this.tooltip = group.filePath;
    this.description = `(${group.items.length})`;
    this.contextValue = 'tlogFile';
    this.iconPath = new vscode.ThemeIcon('file');
  }
}

export class TlogItemTreeItem extends TlogTreeItem {
  constructor(public readonly item: TlogItem) {
    const tlogContent = TlogItemTreeItem.extractTlogMessage(item.content);
    super(
      `Line ${item.line + 1}: ${tlogContent}`,
      vscode.TreeItemCollapsibleState.None
    );

    this.tooltip = item.content;
    this.contextValue = 'tlogItem';
    this.iconPath = new vscode.ThemeIcon('console');
    
    this.command = {
      command: 'tlog.openTlogLocation',
      title: 'Open TLOG Location',
      arguments: [item]
    };
  }

  private static extractTlogMessage(content: string): string {
    const match = content.match(/\[TLOG\]\s*(.+?)['"`\)]/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    const simpleMatch = content.match(/\[TLOG\]/);
    if (simpleMatch) {
      return content.substring(simpleMatch.index! + 6).trim().replace(/['"`\)\;]/g, '');
    }
    
    return content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
}