import * as vscode from "vscode";
import { handleInsertTlog } from "./inserter";
import { handleRemoveAllTlogs } from "./remover";
import { TlogTreeDataProvider } from "./tlog-tree-provider";
import { handleOpenTlogLocation, handleRefreshTlogTree } from "./tlog-navigator";

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

  const treeView = vscode.window.createTreeView('tlogExplorer', {
    treeDataProvider: tlogTreeProvider,
    showCollapseAll: true
  });

  context.subscriptions.push(
    insertCommand,
    removeCommand,
    openLocationCommand,
    refreshTreeCommand,
    treeView
  );
};

export const deactivate = () => {};
