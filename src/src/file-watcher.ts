import * as vscode from "vscode";
import * as path from "path";

export class TlogFileWatcher {
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private saveListener: vscode.Disposable | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private onRefreshCallback: () => void;

  constructor(onRefresh: () => void) {
    this.onRefreshCallback = onRefresh;
  }

  start(workspacePath: string): void {
    this.dispose();

    this.saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
      if (this.shouldProcessFile(document.fileName)) {
        this.debouncedRefresh();
      }
    });

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        workspacePath,
        "**/*.{js,ts,jsx,tsx,vue,py,java,c,cpp,cs,php,rb,go,rs,swift,kt,dart}"
      ),
      false, // onCreate
      true, // onChange
      false // onDelete
    );

    this.fileWatcher.onDidCreate((uri) => {
      if (this.shouldProcessFile(uri.fsPath)) {
        this.debouncedRefresh();
      }
    });

    this.fileWatcher.onDidDelete((uri) => {
      if (this.shouldProcessFile(uri.fsPath)) {
        this.debouncedRefresh();
      }
    });
  }

  private shouldProcessFile(filePath: string): boolean {
    return shouldProcessFile(filePath);
  }

  private debouncedRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    this.refreshTimeout = setTimeout(() => {
      this.onRefreshCallback();
      this.refreshTimeout = null;
    }, 300);
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }

    if (this.saveListener) {
      this.saveListener.dispose();
      this.saveListener = null;
    }

    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }
}

export const shouldProcessFile = (filePath: string): boolean => {
  const excludePatterns = [
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    "out",
    "coverage",
    ".next",
    ".nuxt",
    ".cache",
    "tmp",
    "temp",
  ];

  return !excludePatterns.some(
    (pattern) =>
      filePath.includes(path.sep + pattern + path.sep) ||
      filePath.endsWith(path.sep + pattern)
  );
};
