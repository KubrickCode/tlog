import * as vscode from "vscode";
import { TLOG_SNIPPET_TEMPLATE } from "./core/tlog-patterns";

export const handleInsertTlog = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor found");
    return;
  }

  const location = editor.selection.active;
  const snippet = new vscode.SnippetString(TLOG_SNIPPET_TEMPLATE);
  editor.insertSnippet(snippet, location);
};
