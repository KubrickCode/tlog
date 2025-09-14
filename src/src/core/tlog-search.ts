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
  return `"${rgPath}" --json "${RIPGREP_SEARCH_PATTERN}" "${workspacePath}" -g "${NODE_MODULES_EXCLUDE_PATTERN}"`;
};

export const parseRipgrepResults = (stdout: string): ParsedRipgrepResult[] => {
  return stdout
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map(parseJsonLine)
    .filter((result): result is ParsedRipgrepResult => result !== null);
};

const parseJsonLine = (line: string): ParsedRipgrepResult | null => {
  try {
    const json = JSON.parse(line);

    if (json.type !== "match") return null;

    const { path, lines, line_number } = json.data;
    const matchData = json.data.submatches?.[0];

    if (!path || !lines || !line_number || !matchData) return null;

    return {
      filePath: path.text,
      line: line_number - 1, // Convert to 0-based
      column: matchData.start,
      content: lines.text.trim(),
    };
  } catch (error) {
    return null;
  }
};
