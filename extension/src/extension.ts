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
  const text = document.getText();

  const tlogRegex = /^.*console\.log\(.*\[TLOG\].*\).*;?\s*$/gm;
  const matches = Array.from(text.matchAll(tlogRegex));

  if (matches.length === 0) {
    vscode.window.showInformationMessage(
      "No TLOG statements found in current file"
    );
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Found ${matches.length} TLOG statement(s) in current file. Remove them?`,
    "Yes",
    "No"
  );

  if (confirm !== "Yes") {
    return;
  }

  const newText = text.replace(tlogRegex, "");

  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(text.length)
  );
  edit.replace(document.uri, fullRange, newText);

  const success = await vscode.workspace.applyEdit(edit);

  if (success) {
    vscode.window.showInformationMessage(
      `Removed ${matches.length} TLOG statement(s) from current file`
    );
  } else {
    vscode.window.showErrorMessage("Failed to remove TLOG statements");
  }
};

const removeFromWorkspace = async () => {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showWarningMessage("No workspace folder found");
    return;
  }

  const files = await vscode.workspace.findFiles(
    "**/*.{js,ts,jsx,tsx,vue,svelte}",
    "**/node_modules/**"
  );

  let totalMatches = 0;
  const filesToEdit: {
    uri: vscode.Uri;
    newText: string;
    matchCount: number;
  }[] = [];

  for (const file of files) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const text = document.getText();

      const tlogRegex = /^.*console\.log\(.*\[TLOG\].*\).*;?\s*$/gm;
      const matches = Array.from(text.matchAll(tlogRegex));

      if (matches.length > 0) {
        const newText = text.replace(tlogRegex, "");
        filesToEdit.push({
          uri: file,
          newText: newText,
          matchCount: matches.length,
        });
        totalMatches += matches.length;
      }
    } catch (error) {
      console.error(`Error processing file ${file.fsPath}:`, error);
    }
  }

  if (totalMatches === 0) {
    vscode.window.showInformationMessage(
      "No TLOG statements found in workspace"
    );
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Found ${totalMatches} TLOG statement(s) in ${filesToEdit.length} file(s). Remove them all?`,
    "Yes",
    "No"
  );

  if (confirm !== "Yes") {
    return;
  }

  const edit = new vscode.WorkspaceEdit();

  for (const fileEdit of filesToEdit) {
    const document = await vscode.workspace.openTextDocument(fileEdit.uri);
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(fileEdit.uri, fullRange, fileEdit.newText);
  }

  const success = await vscode.workspace.applyEdit(edit);

  if (success) {
    vscode.window.showInformationMessage(
      `Removed ${totalMatches} TLOG statement(s) from ${filesToEdit.length} file(s)`
    );
  } else {
    vscode.window.showErrorMessage("Failed to remove TLOG statements");
  }
};

export const deactivate = () => {};
