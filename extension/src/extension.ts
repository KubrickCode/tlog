import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export const activate = (context: vscode.ExtensionContext) => {
  console.log("tlog extension is now active!");

  const provider = vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescript"],
    {
      provideCompletionItems: () => {
        const completionItem = new vscode.CompletionItem(
          "tlog",
          vscode.CompletionItemKind.Method
        );
        completionItem.insertText = new vscode.SnippetString("tlog($1)");
        completionItem.documentation = new vscode.MarkdownString(
          "Transient log - temporary logging that can be easily removed"
        );

        return [completionItem];
      },
    },
    "."
  );

  context.subscriptions.push(provider);

  const setupSuccess = createInternalTlogSetup(context);

  if (setupSuccess) {
    setupTlogTerminalProfile(context);

    vscode.window
      .showInformationMessage(
        '✅ tlog extension activated! Use "JavaScript (tlog enabled)" terminal profile for console.tlog support.',
        "Open tlog Terminal"
      )
      .then((selection) => {
        if (selection === "Open tlog Terminal") {
          openTlogTerminal(context);
        }
      });
  }
};

const createInternalTlogSetup = (context: vscode.ExtensionContext): boolean => {
  const setupFilePath = path.join(context.extensionPath, "tlog-runtime.js");

  const setupCode = `// tlog runtime - auto loaded
  if (!console.tlog) {
    console.tlog = (...args) => {
      console.log('[TLOG]', ...args);
    };
    console.log('✅ console.tlog method loaded!');
  }
  `;

  try {
    fs.writeFileSync(setupFilePath, setupCode);
    console.log("✅ tlog-runtime.js created at:", setupFilePath);
    return true;
  } catch (error) {
    console.error("failed to create tlog runtime file:", error);
    return false;
  }
};

const setupTlogTerminalProfile = (context: vscode.ExtensionContext) => {
  const config = vscode.workspace.getConfiguration();
  const tlogRuntimePath = path.join(context.extensionPath, "tlog-runtime.js");

  const currentProfiles =
    config.get("terminal.integrated.profiles.linux") || {};

  const tlogProfile = {
    ...currentProfiles,
    "JavaScript (tlog enabled)": {
      path: "bash",
      env: {
        NODE_OPTIONS: `--require "${tlogRuntimePath}"`,
      },
      icon: "debug-alt",
    },
  };

  config.update(
    "terminal.integrated.profiles.linux",
    tlogProfile,
    vscode.ConfigurationTarget.Global
  );

  console.log("✅ tlog terminal profile registered");
};

const openTlogTerminal = (context: vscode.ExtensionContext) => {
  const terminal = vscode.window.createTerminal({
    name: "tlog Terminal",
    env: {
      NODE_OPTIONS: `--require "${path.join(
        context.extensionPath,
        "tlog-runtime.js"
      )}"`,
    },
  });

  terminal.show();
  terminal.sendText(
    'echo "✅ tlog terminal ready! console.tlog() is now available."'
  );
};

export const deactivate = () => {};
