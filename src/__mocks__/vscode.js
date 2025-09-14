// Mock VSCode API for testing
const vscode = {
  window: {
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
    })),
  },
  workspace: {
    workspaceFolders: [],
    findFiles: jest.fn(),
    openTextDocument: jest.fn(),
    onDidChangeTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  TreeItem: class {
    constructor(label, collapsibleState) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  EventEmitter: class {
    constructor() {
      this.event = jest.fn();
      this.fire = jest.fn();
    }
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path, scheme: "file" })),
    parse: jest.fn(),
  },
  Position: class {
    constructor(line, character) {
      this.line = line;
      this.character = character;
    }
  },
  Range: class {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  },
  TextEdit: {
    delete: jest.fn(),
  },
};

module.exports = vscode;
