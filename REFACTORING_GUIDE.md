# TLOG Extension Testable Refactoring Guide

> This document guides **minimal refactoring** of the VSCode TLOG extension to make unit testing possible.
> Avoid over-abstraction and premature optimization - focus only on separating **business logic that actually needs testing**.

## 📋 Current Structure Analysis

### File Structure

```
src/src/
├── main.ts                 # Extension entry point (no testing needed)
├── inserter.ts            # TLOG insertion (simple, testable)
├── remover.ts             # TLOG removal (complex, hard to test)
├── tlog-tree-provider.ts  # Tree view provider (complex, hard to test)
├── tlog-tree-remover.ts   # Tree item removal (lots of duplicate logic)
├── tlog-navigator.ts      # TLOG location navigation (simple)
└── file-watcher.ts        # File change detection (independent)
```

## 🎯 Testing Barriers Identified

### ❌ Problem 1: Direct VSCode API calls (47 locations)

- `vscode.window.showWarningMessage()` etc. mixed with business logic
- Hard to mock

### ❌ Problem 2: Direct external process execution (2 locations)

- `cp.exec(ripgrep)` calls mixed with search logic
- Test instability due to external dependencies

### ❌ Problem 3: Duplicated logic

- Same pattern matching logic in `remover.ts` and `tlog-tree-remover.ts`
- Same ripgrep execution logic in `remover.ts` and `tlog-tree-provider.ts`

### ❌ Problem 4: Functions doing too many things

- `removeFromWorkspace()`: search + parsing + UI + file modification
- `scanTlogs()`: search + parsing + error handling

## 🧪 Minimal Refactoring Plan

> **Principle**: Separate only the parts that are hard to test, keep everything else as-is

### Priority 1️⃣: Remove Duplicate Code (ensure test stability)

#### 1.1 Unify TLOG Search Logic ✅ COMPLETED

**Problem**: Duplicate ripgrep execution code in `remover.ts` and `tlog-tree-provider.ts`

- [x] Create `src/core/tlog-search.ts` (simple functions only)

  ```typescript
  // Pure functions only - easy to test
  export const buildRipgrepCommand = (workspacePath: string): string => {
    const PATTERN = "console.log.*[TLOG]";
    const EXCLUDE = "!**/node_modules/**";
    return `"${rgPath}" --vimgrep "${PATTERN}" "${workspacePath}" -g "${EXCLUDE}"`;
  };

  export const parseRipgrepResults = (stdout: string): ParsedResult[] => {
    return stdout
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map(parseResultLine)
      .filter((result) => result !== null);
  };

  const parseResultLine = (line: string): ParsedResult | null => {
    const parts = line.split(":");
    if (parts.length < 4) return null;
    // parsing logic...
  };
  ```

#### 1.2 Unify TLOG Pattern Matching ✅ COMPLETED

**Problem**: Same regex pattern duplicated across multiple files

- [x] Consolidate identical constants from each file → merge into one

  ```typescript
  // src/core/tlog-patterns.ts
  export const TLOG_PATTERN = /console\.log\s*\(\s*.*\[TLOG\].*\)/i;
  export const TLOG_SNIPPET_TEMPLATE = `console.log('[TLOG] \${1:message}');\${0}`;
  export const CONFIRMATION_YES = "Yes";
  export const CONFIRMATION_NO = "No";
  ```

### Priority 2️⃣: Split Large Functions (make testable)

#### 2.1 Split `removeFromWorkspace()` in `remover.ts` ✨ High priority ✅ COMPLETED

**Problem**: Search + parsing + UI + file modification all in one function

- [x] Separate into pure functions (keep VSCode API as-is)

  ```typescript
  // Testable pure function
  export const processSearchResults = (stdout: string) => {
    // Only parsing logic - easy to test
  };

  export const createFileLineMap = (results: string[]) => {
    // Only Map creation logic - easy to test
  };

  // Keep VSCode API calls as-is (don't test these)
  const removeFromWorkspace = async () => {
    // UI logic stays as-is
    const stdout = await executeRipgrep(); // as-is
    const results = processSearchResults(stdout); // pure function call
    // UI logic stays as-is
  };
  ```

#### 2.2 Split `scanTlogs()` in `tlog-tree-provider.ts` ✨ High priority

**Problem**: Same issue - too many responsibilities in one function

- [ ] Separate into pure functions

  ```typescript
  // Pure functions
  export const groupTlogsByFile = (searchResults: string[]) => {
    // Only grouping logic - easy to test
  };

  export const buildDirectoryTree = (groups: TlogFileGroup[]) => {
    // Only tree structure creation logic - easy to test
  };
  ```

### Priority 3️⃣: Consolidate Duplicate Logic (only when necessary)

#### 3.1 Remove duplicates in `tlog-tree-remover.ts` ✨ Medium priority

**Problem**: Duplicate file processing logic with `remover.ts`

- [ ] Extract only common functions (no complex structural changes)

  ```typescript
  // src/core/file-operations.ts
  export const findTlogLinesInDocument = (document: any) => {
    // Simple line finding logic
  };

  export const deleteLinesFromDocument = (document: any, ranges: any[]) => {
    // Simple deletion logic
  };
  ```

#### 3.2 Remove Constant Duplicates ✨ Low priority

**Clean up only currently duplicated constants** (minimize new file creation)

- [ ] `RIPGREP_SEARCH_PATTERN`: in `remover.ts` and `tlog-tree-provider.ts`
- [ ] `TLOG_PATTERN`: in `remover.ts` and `tlog-tree-remover.ts`

**Method**: Export from one file and import in others

```typescript
// Export from tlog-tree-provider.ts
export const RIPGREP_SEARCH_PATTERN = "console.log.*[TLOG]";

// Import in remover.ts
import { RIPGREP_SEARCH_PATTERN } from "./tlog-tree-provider";
```

## 🧪 Test Writing Order

> **Principle**: Test only pure functions with business logic. Don't test VSCode API calls.

### Step 1: Pure Function Tests ✨ Start immediately

#### 1.1 TLOG Pattern Matching Tests

- [ ] `src/core/__tests__/tlog-patterns.test.ts`

  ```typescript
  describe("TLOG Pattern Matching", () => {
    test("TLOG pattern matches correctly", () => {
      expect(TLOG_PATTERN.test('console.log("[TLOG] test");')).toBe(true);
    });

    test("Regular console.log should not match", () => {
      expect(TLOG_PATTERN.test('console.log("test");')).toBe(false);
    });
  });
  ```

#### 1.2 Ripgrep Result Parsing Tests

- [ ] `src/core/__tests__/tlog-search.test.ts`

  ```typescript
  describe("Ripgrep Result Parsing", () => {
    test("Normal result parsing", () => {
      const stdout = '/path/file.ts:10:5:console.log("[TLOG] test");';
      const result = parseRipgrepResults(stdout);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        filePath: "/path/file.ts",
        line: 9, // 0-based
        column: 4, // 0-based
        content: 'console.log("[TLOG] test");',
      });
    });
  });
  ```

### Step 2: Data Processing Logic Tests ✨ After Step 1 complete

#### 2.1 Directory Tree Building Tests

- [ ] `src/core/__tests__/tree-builder.test.ts`

  ```typescript
  describe("Directory Tree Building", () => {
    test("Convert flat file list to tree structure", () => {
      const groups = [
        { filePath: "/root/src/file1.ts", items: [] },
        { filePath: "/root/src/utils/file2.ts", items: [] },
      ];
      const tree = buildDirectoryTree(groups);
      expect(tree.children.has("src")).toBe(true);
    });
  });
  ```

### Step 3: File Processing Logic Tests ✨ Only if needed

- [ ] Line finding tests using Mock VSCode Document
- [ ] File path processing logic tests

## 📊 Test Writing Guidelines

### ✅ What TO Test

- **Pure functions**: Functions with clear input → output
- **Business logic**: TLOG pattern matching, file parsing, tree structure creation
- **Data transformation**: String parsing, array/object conversion logic
- **Algorithms**: Sorting, filtering, grouping logic

### ❌ What NOT to Test

- **VSCode API calls**: `vscode.window.showMessage()` etc.
- **File system access**: Actual file reading/writing
- **External processes**: ripgrep execution
- **UI components**: TreeView, QuickPick etc.

### 🧪 Minimal Test Environment Setup

- [ ] Add Jest to `package.json`

  ```json
  {
    "devDependencies": {
      "jest": "^29.0.0",
      "@types/jest": "^29.0.0",
      "ts-jest": "^29.0.0"
    },
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch"
    }
  }
  ```

- [ ] Basic `jest.config.js` setup

  ```javascript
  module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.test.ts"],
    collectCoverageFrom: [
      "src/core/**/*.ts", // Only measure coverage for pure functions
      "!src/**/*.test.ts",
    ],
  };
  ```

## ✅ Completed Refactoring (Progress Update)

### 🎯 Priority 1.1: TLOG Search Logic Unification - COMPLETED

**Created**: `/src/core/tlog-search.ts`

**Implemented Functions**:

- `buildRipgrepCommand(workspacePath: string): string` - Pure command building function
- `parseRipgrepResults(stdout: string): ParsedRipgrepResult[]` - Pure parsing function
- `ParsedRipgrepResult` type definition

**Updated Files**:

- ✅ `remover.ts`: Removed duplicate constants, now uses `buildRipgrepCommand()`
- ✅ `tlog-tree-provider.ts`: Removed duplicate constants, now uses both functions

**Benefits Achieved**:

- 🚫 Eliminated duplicate RIPGREP_SEARCH_PATTERN and NODE_MODULES_EXCLUDE_PATTERN
- 🧪 Created pure functions ready for unit testing
- 🔧 Centralized ripgrep logic maintenance

### 🎯 Priority 1.2: TLOG Pattern Matching Unification - COMPLETED

**Created**: `/src/core/tlog-patterns.ts`

**Implemented Constants**:

- `TLOG_PATTERN` - Unified regex pattern for TLOG detection
- `TLOG_SNIPPET_TEMPLATE` - Template for TLOG insertion
- `CONFIRMATION_YES`, `CONFIRMATION_NO` - UI confirmation constants

**Updated Files**:

- ✅ `remover.ts`: Removed duplicate constants, now imports from patterns file
- ✅ `tlog-tree-remover.ts`: Removed duplicate constants, now imports from patterns file
- ✅ `inserter.ts`: Moved template constant to centralized location

**Benefits Achieved**:

- 🚫 Eliminated duplicate TLOG_PATTERN across multiple files
- 🚫 Eliminated duplicate UI confirmation constants
- 🧪 Centralized all TLOG-related patterns and constants
- 🔧 Single source of truth for pattern modifications

### 🎯 Priority 2.1: Split removeFromWorkspace() Function - COMPLETED

**Created**: Pure functions in `/src/remover.ts`

**Implemented Functions**:

- `processSearchResults(searchResults: string[]): Array<{filePath: string, lineNumber: number}>` - Pure search result parsing function
- `createFileLineMap(processedResults: Array<{filePath: string, lineNumber: number}>): Map<string, number[]>` - Pure file-line mapping function

**Updated Files**:

- ✅ `remover.ts`: Extracted pure business logic functions while keeping VSCode API calls intact

**Benefits Achieved**:

- 🧪 Created testable pure functions for search result processing
- 🔧 Separated business logic from VSCode API dependencies
- 🚀 Maintained 100% existing functionality
- 📝 Added clear separation between pure functions and UI logic

---

## 🚀 Actual Work Order (Realistic Plan)

### 📅 Week 1: Foundation Work (2-3 days)

**Day 1**: Start with duplicate removal

- [ ] Create `src/core/tlog-patterns.ts` → consolidate constants
- [x] Create `src/core/tlog-search.ts` → consolidate ripgrep logic ✅ COMPLETED
- [ ] Set up test environment (Jest)

**Day 2**: Pure function separation

- [x] Extract `processSearchResults()` function from `remover.ts` ✅ COMPLETED
- [x] Extract `createFileLineMap()` function from `remover.ts` ✅ COMPLETED
- [ ] Extract `groupTlogsByFile()` function from `tlog-tree-provider.ts`
- [ ] Write tests for pure functions

### 📅 Week 2: Cleanup remaining issues (if needed)

**Optional** (only if time permits and deemed necessary):

- [ ] Remove duplicate logic in `tlog-tree-remover.ts`
- [ ] Separate configuration in `file-watcher.ts` (only if testing needed)

## 📝 Core Principles

### ✅ DO (What to do)

- **Remove duplicate code**: If same logic exists in 2+ places, consolidate
- **Separate pure functions**: Only separate logic with clear input→output
- **Incremental changes**: One thing at a time, maintain functionality
- **Test only business logic**: VSCode API calls are not tested

### ❌ DON'T (What not to do)

- **Over-abstraction**: Interfaces, dependency injection, complex patterns
- **Premature optimization**: Performance improvement is not the goal
- **New structure introduction**: Class hierarchies, service layers, etc.
- **Separate constant files**: Unless used in multiple places, keep at top of file

### 🎯 Success Criteria

- [ ] 100% existing functionality works
- [ ] 80%+ duplicate code removed
- [ ] 90%+ unit test coverage for pure functions
- [ ] 0 new bugs

---

> 💡 **Key Point**: This guide aims to create a "testable structure". The goal is **maximum effect with minimal refactoring**, not complex architectural changes.
