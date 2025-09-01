import * as vscode from "vscode";
import { TlogItem, TlogTreeDataProvider } from "./tlog-tree-provider";

export const handleOpenTlogLocation = (item: TlogItem) => {
  openFileAtLocation(item.filePath, item.line, item.column);
};

export const handleRefreshTlogTree = (treeProvider: TlogTreeDataProvider) => {
  treeProvider.refresh();
  vscode.window.showInformationMessage("TLOG Explorer refreshed");
};

const openFileAtLocation = async (
  filePath: string,
  line: number,
  column: number
) => {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);

    const position = new vscode.Position(line, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open file: ${error}`);
  }
};
