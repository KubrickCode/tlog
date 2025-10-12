# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**CRITICAL**

- Always follow the .claude/WORK_RULES.md document when working.
- Always update CLAUDE.md and README.md when completing large-scale tasks. Ignore minor changes.

## Project Overview

TLOG is a VS Code extension for managing temporary console.log statements with [TLOG] prefix. It provides:
- Quick insertion with keyboard shortcuts
- Tree view explorer for visualizing TLOGs
- Bulk and granular removal capabilities
- Real-time file watching and auto-refresh

## Development Commands

### Working Directory
All commands run from `/workspaces/tlog/src` directory.

### Testing
```bash
cd src && yarn test                    # Run all tests
cd src && yarn test <file>.test.ts     # Run specific test file
cd src && yarn test --coverage         # Run with coverage report
```

### Linting
```bash
cd src && yarn lint                    # Check for lint issues
cd src && yarn lint:fix                # Auto-fix lint issues
```

### Building & Packaging
```bash
yarn package                           # Build .vsix extension package (outputs to versions/)
yarn install-package                   # Install built extension to VS Code
```

### Publishing
```bash
yarn vsce-publish                      # Publish to VS Code Marketplace
yarn ovsx-publish                      # Publish to Open VSX Registry
```

## Architecture

### Core Components

**Extension Entry Point** (`src/main.ts`)
- Registers commands and tree view provider
- Manages extension lifecycle (activate/deactivate)
- Wires up all command handlers

**Tree Provider** (`tlog-tree-provider.ts`)
- Implements VS Code TreeDataProvider interface
- Manages tree state and refresh logic
- Integrates file watcher for auto-refresh

**Search System** (`core/tlog-search.ts`)
- Uses ripgrep (@vscode/ripgrep) for fast TLOG detection
- Pattern: `console.log.*[TLOG]`
- Excludes node_modules
- Returns structured results with file path, line, column, content

**Tree Builder** (`core/tree-builder.ts`)
- Groups TLOG items by file
- Builds hierarchical directory tree structure
- Types: `TlogItem`, `TlogFileGroup`, `TlogDirectoryNode`

**Command Handlers**
- `inserter.ts`: Inserts TLOG snippet at cursor
- `remover.ts`: Bulk removal (file/workspace scope)
- `tlog-tree-remover.ts`: Granular removal (single/file/directory)
- `tlog-navigator.ts`: Navigation and refresh logic
- `file-watcher.ts`: Auto-refresh on file changes

### Data Flow

1. **Detection**: ripgrep scans workspace → raw results
2. **Parsing**: JSON parsing → `ParsedRipgrepResult[]`
3. **Grouping**: Group by file → `TlogFileGroup[]`
4. **Tree Building**: Build directory hierarchy → `TlogDirectoryNode`
5. **Rendering**: VS Code TreeView displays structure

### Tree Item Types

- `TlogDirectoryTreeItem`: Folder node with total TLOG count
- `TlogFileTreeItem`: File node with TLOG count
- `TlogItemTreeItem`: Individual TLOG with line number and message preview

## TypeScript Guidelines

- Use `type` instead of `interface` (enforced by ESLint)
- Arrow functions for standalone functions, regular methods in classes
- Avoid `any` type (ESLint allows but discouraged per WORK_RULES.md)
- Unused vars must start with `_` to avoid ESLint errors

## Linting Rules

- Import order: alphabetical (eslint-plugin-import)
- Sort classes, interfaces, object types, objects alphabetically (eslint-plugin-perfectionist)
- Type definitions enforced as `type` not `interface`

## Testing

- Framework: Jest with ts-jest preset
- Mocks: VS Code API mocked in `__mocks__/vscode.js`
- Coverage excludes: test files, main.ts
- Test files: `*.test.ts` pattern

## Key Patterns

**Ripgrep Command Construction**
```typescript
buildRipgrepCommand(workspacePath: string): string
// Returns shell command with JSON output format
```

**Tree Refresh Pattern**
```typescript
refresh() {
  this.scanTlogs()
    .then(groups => buildDirectoryTree(groups, workspacePath))
    .then(() => this._onDidChangeTreeData.fire())
}
```

**File Watcher Integration**
- Watches workspace for file changes
- Debounces refresh to avoid excessive updates
- Automatically disposed on extension deactivation
