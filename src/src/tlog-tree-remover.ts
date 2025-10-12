import * as vscode from "vscode";
import { TlogItem, TlogDirectoryNode } from "./core/tree-builder";
import {
  TlogDirectoryTreeItem,
  TlogFileTreeItem,
  TlogItemTreeItem,
  TlogTreeDataProvider,
} from "./tlog-tree-provider";
import { TLOG_PATTERN, CONFIRMATION_YES, CONFIRMATION_NO } from "./core/tlog-patterns";

export const handleRemoveFilesTlogs = async (
  fileItem: TlogFileTreeItem,
  treeProvider: TlogTreeDataProvider
) => {
  const filePath = fileItem.group.filePath;
  const tlogCount = fileItem.group.items.length;

  const confirmed = await vscode.window.showWarningMessage(
    `Remove ${tlogCount} TLOG(s) from ${fileItem.label}?`,
    CONFIRMATION_YES,
    CONFIRMATION_NO
  );

  if (confirmed !== CONFIRMATION_YES) return;

  try {
    const success = await removeFromFile(filePath);
    if (success) {
      vscode.window.showInformationMessage(`Removed ${tlogCount} TLOG(s) from ${fileItem.label}`);
      treeProvider.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to remove TLOGs");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error removing TLOGs: ${error}`);
  }
};

export const handleRemoveDirectoryTlogs = async (
  directoryItem: TlogDirectoryTreeItem,
  treeProvider: TlogTreeDataProvider
) => {
  const totalTlogs = getTotalTlogCount(directoryItem.node);

  const confirmed = await vscode.window.showWarningMessage(
    `Remove ${totalTlogs} TLOG(s) from ${directoryItem.directoryName} and all subdirectories?`,
    CONFIRMATION_YES,
    CONFIRMATION_NO
  );

  if (confirmed !== CONFIRMATION_YES) return;

  try {
    const filePaths = collectAllFilePaths(directoryItem.node);
    let removedCount = 0;

    for (const filePath of filePaths) {
      const success = await removeFromFile(filePath);
      if (success) {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      vscode.window.showInformationMessage(
        `Removed TLOGs from ${removedCount} file(s) in ${directoryItem.directoryName}`
      );
      treeProvider.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to remove TLOGs");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error removing TLOGs: ${error}`);
  }
};

export const handleRemoveSingleTlog = async (
  tlogItem: TlogItemTreeItem,
  treeProvider: TlogTreeDataProvider
) => {
  const confirmed = await vscode.window.showWarningMessage(
    `Remove this TLOG from line ${tlogItem.item.line + 1}?`,
    CONFIRMATION_YES,
    CONFIRMATION_NO
  );

  if (confirmed !== CONFIRMATION_YES) return;

  try {
    const success = await removeSingleTlogFromFile(tlogItem.item);
    if (success) {
      vscode.window.showInformationMessage("TLOG removed successfully");
      treeProvider.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to remove TLOG");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error removing TLOG: ${error}`);
  }
};

const removeFromFile = async (filePath: string): Promise<boolean> => {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const tlogLines = findTlogLinesInDocument(document);

    if (tlogLines.length === 0) return true;

    return await deleteLinesFromDocument(document, tlogLines);
  } catch (error) {
    console.error(`Failed to remove TLOGs from ${filePath}:`, error);
    return false;
  }
};

const removeSingleTlogFromFile = async (tlogItem: TlogItem): Promise<boolean> => {
  try {
    const uri = vscode.Uri.file(tlogItem.filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const line = document.lineAt(tlogItem.line);

    if (TLOG_PATTERN.test(line.text)) {
      const edit = new vscode.WorkspaceEdit();
      edit.delete(uri, line.rangeIncludingLineBreak);
      return await vscode.workspace.applyEdit(edit);
    }

    return false;
  } catch (error) {
    console.error(`Failed to remove single TLOG:`, error);
    return false;
  }
};

const findTlogLinesInDocument = (document: vscode.TextDocument): vscode.Range[] => {
  const tlogLines: vscode.Range[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (TLOG_PATTERN.test(line.text)) {
      tlogLines.push(line.rangeIncludingLineBreak);
    }
  }

  return tlogLines;
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

export const getTotalTlogCount = (node: TlogDirectoryNode): number => {
  let count = 0;

  count += node.files.reduce((sum, file) => sum + file.items.length, 0);

  for (const [, childNode] of node.children) {
    count += getTotalTlogCount(childNode);
  }

  return count;
};

export const collectAllFilePaths = (node: TlogDirectoryNode): string[] => {
  const filePaths: string[] = [];

  node.files.forEach((file) => {
    filePaths.push(file.filePath);
  });

  for (const [, childNode] of node.children) {
    filePaths.push(...collectAllFilePaths(childNode));
  }

  return filePaths;
};
