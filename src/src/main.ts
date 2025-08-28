import * as vscode from "vscode";
import { handleInsertTlog } from "./inserter";
import { handleRemoveAllTlogs } from "./remover";
import { TlogTreeDataProvider } from "./tlog-tree-provider";
import { handleOpenTlogLocation, handleRefreshTlogTree } from "./tlog-navigator";
import { handleRemoveFilesTlogs, handleRemoveDirectoryTlogs, handleRemoveSingleTlog } from "./tlog-tree-remover";

export const activate = (context: vscode.ExtensionContext) => {
  const tlogTreeProvider = new TlogTreeDataProvider();
  
  const insertCommand = vscode.commands.registerCommand(
    "tlog.insertTlog",
    handleInsertTlog
  );
  const removeCommand = vscode.commands.registerCommand(
    "tlog.removeAllTlogs",
    handleRemoveAllTlogs
  );
  const openLocationCommand = vscode.commands.registerCommand(
    "tlog.openTlogLocation",
    handleOpenTlogLocation
  );
  const refreshTreeCommand = vscode.commands.registerCommand(
    "tlog.refreshTlogTree",
    () => handleRefreshTlogTree(tlogTreeProvider)
  );
  const removeFileTlogsCommand = vscode.commands.registerCommand(
    "tlog.removeFilesTlogs",
    (fileItem) => handleRemoveFilesTlogs(fileItem, tlogTreeProvider)
  );
  const removeDirectoryTlogsCommand = vscode.commands.registerCommand(
    "tlog.removeDirectoryTlogs",
    (directoryItem) => handleRemoveDirectoryTlogs(directoryItem, tlogTreeProvider)
  );
  const removeSingleTlogCommand = vscode.commands.registerCommand(
    "tlog.removeSingleTlog",
    (tlogItem) => handleRemoveSingleTlog(tlogItem, tlogTreeProvider)
  );

  const treeView = vscode.window.createTreeView('tlogExplorer', {
    treeDataProvider: tlogTreeProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    insertCommand,
    removeCommand,
    openLocationCommand,
    refreshTreeCommand,
    removeFileTlogsCommand,
    removeDirectoryTlogsCommand,
    removeSingleTlogCommand,
    treeView
  );
};

export const deactivate = () => {};
