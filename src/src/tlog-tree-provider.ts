import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { buildRipgrepCommand, parseRipgrepResults } from "./core/tlog-search";
import { TlogFileWatcher } from "./file-watcher";

export type TlogItem = {
  filePath: string;
  line: number;
  column: number;
  content: string;
};

export type TlogFileGroup = {
  filePath: string;
  items: TlogItem[];
};

export type TlogDirectoryNode = {
  name: string;
  fullPath: string;
  children: Map<string, TlogDirectoryNode>;
  files: TlogFileGroup[];
};

export class TlogTreeDataProvider
  implements vscode.TreeDataProvider<TlogTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TlogTreeItem | undefined | null | void
  > = new vscode.EventEmitter<TlogTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TlogTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private rootNode: TlogDirectoryNode | null = null;
  private workspacePath: string = "";
  private fileWatcher: TlogFileWatcher;

  constructor() {
    this.fileWatcher = new TlogFileWatcher(() => this.refresh());
    this.refresh();
    this.setupAutoRefresh();
  }

  refresh(): void {
    this.scanTlogs().then((groups) => {
      this.rootNode = this.buildDirectoryTree(groups);
      this._onDidChangeTreeData.fire();
    });
  }

  private setupAutoRefresh(): void {
    const workspacePath = this.getWorkspacePath();
    if (workspacePath) {
      this.fileWatcher.start(workspacePath);
    }
  }

  dispose(): void {
    this.fileWatcher.dispose();
  }

  getTreeItem(element: TlogTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TlogTreeItem): Thenable<TlogTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootChildren());
    }

    if (element instanceof TlogDirectoryTreeItem) {
      return Promise.resolve(this.getDirectoryChildren(element.node));
    }

    if (element instanceof TlogFileTreeItem) {
      return Promise.resolve(
        element.group.items.map((item) => new TlogItemTreeItem(item))
      );
    }

    return Promise.resolve([]);
  }

  private getRootChildren(): TlogTreeItem[] {
    if (!this.rootNode) return [];

    const children: TlogTreeItem[] = [];

    for (const [name, node] of this.rootNode.children) {
      children.push(new TlogDirectoryTreeItem(name, node));
    }

    for (const fileGroup of this.rootNode.files) {
      children.push(new TlogFileTreeItem(fileGroup));
    }

    return children.sort((a, b) => {
      if (a instanceof TlogDirectoryTreeItem && b instanceof TlogFileTreeItem)
        return -1;
      if (a instanceof TlogFileTreeItem && b instanceof TlogDirectoryTreeItem)
        return 1;
      return a.label!.localeCompare(b.label!);
    });
  }

  private getDirectoryChildren(node: TlogDirectoryNode): TlogTreeItem[] {
    const children: TlogTreeItem[] = [];

    for (const [name, childNode] of node.children) {
      children.push(new TlogDirectoryTreeItem(name, childNode));
    }

    for (const fileGroup of node.files) {
      children.push(new TlogFileTreeItem(fileGroup));
    }

    return children.sort((a, b) => {
      if (a instanceof TlogDirectoryTreeItem && b instanceof TlogFileTreeItem)
        return -1;
      if (a instanceof TlogFileTreeItem && b instanceof TlogDirectoryTreeItem)
        return 1;
      return a.label!.localeCompare(b.label!);
    });
  }

  private buildDirectoryTree(groups: TlogFileGroup[]): TlogDirectoryNode {
    const root: TlogDirectoryNode = {
      name: "",
      fullPath: this.workspacePath,
      children: new Map(),
      files: [],
    };

    groups.forEach((group) => {
      const relativePath = path.relative(this.workspacePath, group.filePath);
      const pathParts = relativePath.split(path.sep);

      let currentNode = root;
      let currentPath = this.workspacePath;

      pathParts.forEach((part) => {
        currentPath = path.join(currentPath, part);
        if (!currentNode.children.has(part)) {
          currentNode.children.set(part, {
            name: part,
            fullPath: currentPath,
            children: new Map(),
            files: [],
          });
        }
        currentNode = currentNode.children.get(part)!;
      });

      currentNode.files.push(group);
    });

    return root;
  }

  private async scanTlogs(): Promise<TlogFileGroup[]> {
    const workspacePath = this.getWorkspacePath();
    if (!workspacePath) return [];

    this.workspacePath = workspacePath;

    try {
      const searchResults = await this.searchTlogsWithRipgrep(workspacePath);
      return this.groupTlogsByFile(searchResults);
    } catch (error) {
      console.error("Failed to scan TLOGs:", error);
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
      const command = buildRipgrepCommand(workspacePath);

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
    const parsedResults = parseRipgrepResults(searchResults.join("\n"));

    parsedResults.forEach((result) => {
      const tlogItem: TlogItem = {
        filePath: result.filePath,
        line: result.line,
        column: result.column,
        content: result.content,
      };

      if (!groups.has(result.filePath)) {
        groups.set(result.filePath, []);
      }
      groups.get(result.filePath)!.push(tlogItem);
    });

    return Array.from(groups.entries()).map(([filePath, items]) => ({
      filePath,
      items: items.sort((a, b) => a.line - b.line),
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

export class TlogDirectoryTreeItem extends TlogTreeItem {
  constructor(
    public readonly directoryName: string,
    public readonly node: TlogDirectoryNode
  ) {
    const totalTlogs = TlogDirectoryTreeItem.getTotalTlogCount(node);
    super(directoryName, vscode.TreeItemCollapsibleState.Collapsed);

    this.tooltip = node.fullPath;
    this.description = `(${totalTlogs})`;
    this.contextValue = "tlogDirectory";
    this.iconPath = vscode.ThemeIcon.Folder;
  }

  private static getTotalTlogCount(node: TlogDirectoryNode): number {
    let count = 0;

    // Count TLOGs in files in this directory
    count += node.files.reduce((sum, file) => sum + file.items.length, 0);

    // Count TLOGs in subdirectories
    for (const [, childNode] of node.children) {
      count += TlogDirectoryTreeItem.getTotalTlogCount(childNode);
    }

    return count;
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
    this.contextValue = "tlogFile";
    this.iconPath = new vscode.ThemeIcon("file");
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
    this.contextValue = "tlogItem";
    this.iconPath = new vscode.ThemeIcon("console");

    this.command = {
      command: "tlog.openTlogLocation",
      title: "Open TLOG Location",
      arguments: [item],
    };
  }

  private static extractTlogMessage(content: string): string {
    const match = content.match(/\[TLOG\]\s*(.+?)['"`\)]/);
    if (match && match[1]) {
      return match[1].trim();
    }

    const simpleMatch = content.match(/\[TLOG\]/);
    if (simpleMatch) {
      return content
        .substring(simpleMatch.index! + 6)
        .trim()
        .replace(/['"`\)\;]/g, "");
    }

    return content.substring(0, 50) + (content.length > 50 ? "..." : "");
  }
}
