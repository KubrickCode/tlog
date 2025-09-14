import * as path from "path";
import { ParsedRipgrepResult } from "./tlog-search";

export type TlogItem = {
  filePath: string;
  line: number;
  column: number;
  content: string;
};

export type TlogFileGroup = {
  filePath: string;
  items: TlogItem[];
};

export type TlogDirectoryNode = {
  name: string;
  fullPath: string;
  children: Map<string, TlogDirectoryNode>;
  files: TlogFileGroup[];
};

export const groupTlogsByFile = (
  searchResults: string[],
  parseRipgrepResults: (content: string) => ParsedRipgrepResult[]
): TlogFileGroup[] => {
  const groups = new Map<string, TlogItem[]>();
  const parsedResults = parseRipgrepResults(searchResults.join("\n"));

  parsedResults.forEach((result) => {
    const tlogItem: TlogItem = {
      filePath: result.filePath,
      line: result.line,
      column: result.column,
      content: result.content,
    };

    if (!groups.has(result.filePath)) {
      groups.set(result.filePath, []);
    }
    groups.get(result.filePath)!.push(tlogItem);
  });

  return Array.from(groups.entries()).map(([filePath, items]) => ({
    filePath,
    items: items.sort((a, b) => a.line - b.line),
  }));
};

export const buildDirectoryTree = (
  groups: TlogFileGroup[],
  workspacePath: string
): TlogDirectoryNode => {
  const root: TlogDirectoryNode = {
    name: "",
    fullPath: workspacePath,
    children: new Map(),
    files: [],
  };

  groups.forEach((group) => {
    const relativePath = path.relative(workspacePath, group.filePath);
    const pathParts = relativePath.split(path.sep);

    const directoryParts = pathParts.slice(0, -1);

    let currentNode = root;
    let currentPath = workspacePath;

    directoryParts.forEach((part) => {
      currentPath = path.join(currentPath, part);
      if (!currentNode.children.has(part)) {
        currentNode.children.set(part, {
          name: part,
          fullPath: currentPath,
          children: new Map(),
          files: [],
        });
      }
      currentNode = currentNode.children.get(part)!;
    });

    currentNode.files.push(group);
  });

  return root;
};
