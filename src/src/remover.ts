import * as vscode from "vscode";
import * as cp from "child_process";
import { buildRipgrepCommand, parseRipgrepResults } from "./core/tlog-search";

const TLOG_PATTERN = /console\.log\s*\(\s*.*\[TLOG\].*\)/i;
const CONFIRMATION_YES = "Yes";
const CONFIRMATION_NO = "No";
const RIPGREP_LINE_INDEX_OFFSET = 1;

type RemovalScope = "current" | "workspace";

export const handleRemoveAllTlogs = async () => {
  const scope = await askRemovalScope();
  if (!scope) return;

  if (scope === "current") {
    await removeFromCurrentFile();
    return;
  }

  await removeFromWorkspace();
};

const askRemovalScope = async (): Promise<RemovalScope | null> => {
  const options = [
    {
      label: "$(file) Current File Only",
      description: "Remove TLOGs from the currently active file",
      action: "current" as const,
    },
    {
      label: "$(folder) Entire Workspace",
      description: "Remove TLOGs from all files in the workspace",
      action: "workspace" as const,
    },
  ];

  const result = await vscode.window.showQuickPick(options, {
    placeHolder: "Choose scope for TLOG removal",
  });

  return result?.action || null;
};

const removeFromCurrentFile = async () => {
  const editor = getActiveEditor();
  if (!editor) return;

  const document = editor.document;
  const tlogLines = findTlogLinesInDocument(document);

  if (tlogLines.length === 0) {
    showNoTlogsFound("current file");
    return;
  }

  const confirmed = await confirmRemoval(tlogLines.length, "current file");
  if (!confirmed) return;

  const success = await deleteLinesFromDocument(document, tlogLines);
  showRemovalResult(success, tlogLines.length, "current file");
};

const removeFromWorkspace = async () => {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) return;

  vscode.window.showInformationMessage("Searching for TLOGs using Ripgrep...");

  try {
    const searchResults = await searchTlogsWithRipgrep(workspacePath);

    if (searchResults.length === 0) {
      showNoTlogsFound("workspace");
      return;
    }

    const confirmed = await confirmRemoval(searchResults.length, "workspace");
    if (!confirmed) return;

    const success = await deleteLinesFromSearchResults(searchResults);
    showRemovalResult(success, searchResults.length, "workspace");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Search failed: ${errorMessage}`);
  }
};

const getActiveEditor = (): vscode.TextEditor | null => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor found");
    return null;
  }
  return editor;
};

const findTlogLinesInDocument = (
  document: vscode.TextDocument
): vscode.Range[] => {
  const tlogLines: vscode.Range[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (TLOG_PATTERN.test(line.text)) {
      tlogLines.push(line.rangeIncludingLineBreak);
    }
  }

  return tlogLines;
};

const getWorkspacePath = (): string | null => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage("No workspace folder found");
    return null;
  }
  return folders[0].uri.fsPath;
};

const searchTlogsWithRipgrep = (workspacePath: string): Promise<string[]> => {
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
};

const confirmRemoval = async (
  count: number,
  scope: string
): Promise<boolean> => {
  const message = `Found ${count} TLOG statement(s) in ${scope}. Remove them?`;
  const result = await vscode.window.showWarningMessage(
    message,
    CONFIRMATION_YES,
    CONFIRMATION_NO
  );
  return result === CONFIRMATION_YES;
};

const deleteLinesFromDocument = async (
  document: vscode.TextDocument,
  ranges: vscode.Range[]
): Promise<boolean> => {
  const edit = new vscode.WorkspaceEdit();

  ranges.forEach((range) => {
    edit.delete(document.uri, range);
  });

  return await vscode.workspace.applyEdit(edit);
};

const deleteLinesFromSearchResults = async (
  searchResults: string[]
): Promise<boolean> => {
  const edit = new vscode.WorkspaceEdit();
  const fileLineMap = parseSearchResults(searchResults);

  for (const [filePath, lineNumbers] of fileLineMap.entries()) {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);

    const sortedLineNumbers = [...lineNumbers].sort((a, b) => b - a);

    sortedLineNumbers.forEach((lineNumber) => {
      const range = document.lineAt(lineNumber).rangeIncludingLineBreak;
      edit.delete(uri, range);
    });
  }

  return await vscode.workspace.applyEdit(edit);
};

const parseSearchResults = (results: string[]): Map<string, number[]> => {
  const fileLineMap = new Map<string, number[]>();

  results.forEach((line) => {
    const parts = line.split(":");
    if (parts.length < 2) return;

    const filePath = parts[0];
    const lineNumberStr = parts[1];
    const lineNumber = parseInt(lineNumberStr, 10);

    if (isNaN(lineNumber)) return;

    const zeroBasedLineNumber = lineNumber - RIPGREP_LINE_INDEX_OFFSET;

    if (!fileLineMap.has(filePath)) {
      fileLineMap.set(filePath, []);
    }

    const existingLines = fileLineMap.get(filePath);
    if (existingLines) {
      existingLines.push(zeroBasedLineNumber);
    }
  });

  return fileLineMap;
};

const showNoTlogsFound = (scope: string) => {
  vscode.window.showInformationMessage(`No TLOG statements found in ${scope}`);
};

const showRemovalResult = (success: boolean, count: number, scope: string) => {
  if (success) {
    vscode.window.showInformationMessage(
      `Removed ${count} TLOG statement(s) from ${scope}`
    );
    return;
  }

  vscode.window.showErrorMessage("Failed to remove TLOG statements");
};
