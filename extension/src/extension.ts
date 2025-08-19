import * as vscode from "vscode";

export const activate = (context: vscode.ExtensionContext) => {
  const insertTlogCommand = vscode.commands.registerCommand(
    "tlog.insertTlog",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showWarningMessage("No active editor found");
        return;
      }

      const position = editor.selection.active;

      const tlogSnippet = new vscode.SnippetString(
        `console.log('[TLOG] \${1:message}');\${0}`
      );

      editor.insertSnippet(tlogSnippet, position);
    }
  );

  context.subscriptions.push(insertTlogCommand);
};

export const deactivate = () => {};
