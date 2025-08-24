import * as vscode from "vscode";
import { handleInsertTlog } from "./inserter";
import { handleRemoveAllTlogs } from "./remover";

export const activate = (context: vscode.ExtensionContext) => {
  const insertCommand = vscode.commands.registerCommand(
    "tlog.insertTlog",
    handleInsertTlog
  );
  const removeCommand = vscode.commands.registerCommand(
    "tlog.removeAllTlogs",
    handleRemoveAllTlogs
  );

  context.subscriptions.push(insertCommand, removeCommand);
};

export const deactivate = () => {};
