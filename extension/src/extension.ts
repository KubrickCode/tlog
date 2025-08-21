import * as vscode from "vscode";
import * as cp from "child_process";
import { rgPath } from "@vscode/ripgrep";

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

  const removeAllTlogsCommand = vscode.commands.registerCommand(
    "tlog.removeAllTlogs",
    async () => {
      const result = await vscode.window.showQuickPick(
        [
          {
            label: "$(file) Current File Only",
            description: "Remove TLOGs from the currently active file",
            action: "current",
          },
          {
            label: "$(folder) Entire Workspace",
            description: "Remove TLOGs from all files in the workspace",
            action: "workspace",
          },
        ],
        {
          placeHolder: "Choose scope for TLOG removal",
        }
      );

      if (!result) {
        return;
      }

      if (result.action === "current") {
        await removeFromCurrentFile();
      } else if (result.action === "workspace") {
        await removeFromWorkspace();
      }
    }
  );

  context.subscriptions.push(insertTlogCommand, removeAllTlogsCommand);
};

const removeFromCurrentFile = async () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showWarningMessage("No active editor found");
    return;
  }

  const document = editor.document;
  const edit = new vscode.WorkspaceEdit();
  const linesToDelete: vscode.Range[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const tlogRegex = /console\.log\s*\(\s*.*\[TLOG\].*\)/i;

    if (tlogRegex.test(line.text)) {
      linesToDelete.push(line.rangeIncludingLineBreak);
    }
  }

  if (linesToDelete.length === 0) {
    vscode.window.showInformationMessage(
      "No TLOG statements found in current file"
    );
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Found ${linesToDelete.length} TLOG statement(s) in current file. Remove them?`,
    "Yes",
    "No"
  );

  if (confirm !== "Yes") {
    return;
  }

  for (const range of linesToDelete) {
    edit.delete(document.uri, range);
  }

  const success = await vscode.workspace.applyEdit(edit);

  if (success) {
    vscode.window.showInformationMessage(
      `Removed ${linesToDelete.length} TLOG statement(s) from current file`
    );
  } else {
    vscode.window.showErrorMessage("Failed to remove TLOG statements");
  }
};

const removeFromWorkspace = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage("No workspace folder found");
    return;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  const searchTerm = "console.log.*[TLOG]";
  const command = `"${rgPath}" --vimgrep "${searchTerm}" "${workspacePath}" -g "!**/node_modules/**"`;

  vscode.window.showInformationMessage("Searching for TLOGs using Ripgrep...");

  cp.exec(command, async (error, stdout, stderr) => {
    if (error && !stdout) {
      vscode.window.showErrorMessage(`Ripgrep execution failed: ${stderr}`);
      return;
    }

    const results = stdout.trim().split("\n");
    if (results.length === 0 || results[0] === "") {
      vscode.window.showInformationMessage(
        "No TLOG statements found in workspace"
      );
      return;
    }

    const confirm = await vscode.window.showWarningMessage(
      `Found ${results.length} TLOG statement(s). Remove them all?`,
      "Yes",
      "No"
    );

    if (confirm !== "Yes") {
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    const fileLineMap = new Map<string, number[]>();

    results.forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const filePath = parts[0];
        const lineNumber = parseInt(parts[1], 10) - 1;

        if (!fileLineMap.has(filePath)) {
          fileLineMap.set(filePath, []);
        }
        fileLineMap.get(filePath)?.push(lineNumber);
      }
    });

    for (const [filePath, lineNumbers] of fileLineMap.entries()) {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);

      lineNumbers.sort((a, b) => b - a);

      for (const lineNumber of lineNumbers) {
        const range = document.lineAt(lineNumber).rangeIncludingLineBreak;
        edit.delete(uri, range);
      }
    }

    const success = await vscode.workspace.applyEdit(edit);

    if (success) {
      vscode.window.showInformationMessage(
        `Removed ${results.length} TLOG statement(s)`
      );
    } else {
      vscode.window.showErrorMessage("Failed to remove TLOG statements");
    }
  });
};

export const deactivate = () => {};
