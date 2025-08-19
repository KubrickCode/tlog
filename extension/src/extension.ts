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
      const currentLine = editor.document.lineAt(position.line);
      const indentation = getIndentation(currentLine.text);

      const tlogSnippet = new vscode.SnippetString(
        `${indentation}console.log('[TLOG] \${1:message}');\${0}`
      );

      editor.insertSnippet(tlogSnippet, position);
    }
  );

  context.subscriptions.push(insertTlogCommand);
};

const getIndentation = (lineText: string): string => {
  const match = lineText.match(/^(\s*)/);
  return match ? match[1] : "";
};

export const deactivate = () => {};
