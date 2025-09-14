import { rgPath } from "@vscode/ripgrep";

export type ParsedRipgrepResult = {
  filePath: string;
  line: number;
  column: number;
  content: string;
};

const RIPGREP_SEARCH_PATTERN = "console.log.*[TLOG]";
const NODE_MODULES_EXCLUDE_PATTERN = "!**/node_modules/**";

export const buildRipgrepCommand = (workspacePath: string): string => {
  return `"${rgPath}" --vimgrep "${RIPGREP_SEARCH_PATTERN}" "${workspacePath}" -g "${NODE_MODULES_EXCLUDE_PATTERN}"`;
};

export const parseRipgrepResults = (stdout: string): ParsedRipgrepResult[] => {
  return stdout
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map(parseResultLine)
    .filter((result): result is ParsedRipgrepResult => result !== null);
};

const parseResultLine = (line: string): ParsedRipgrepResult | null => {
  const parts = line.split(":");
  if (parts.length < 4) return null;

  const filePath = parts[0];
  const lineNumber = parseInt(parts[1], 10);
  const columnNumber = parseInt(parts[2], 10);
  const content = parts.slice(3).join(":").trim();

  if (isNaN(lineNumber) || isNaN(columnNumber)) return null;

  return {
    filePath,
    line: lineNumber - 1, // Convert to 0-based
    column: columnNumber - 1, // Convert to 0-based
    content,
  };
};
