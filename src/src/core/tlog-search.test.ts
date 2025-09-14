import { buildRipgrepCommand, parseRipgrepResults } from "./tlog-search";

describe("TLOG Search Functions", () => {
  describe("buildRipgrepCommand", () => {
    test("builds correct ripgrep command for workspace path", () => {
      const workspacePath = "/home/user/project";
      const command = buildRipgrepCommand(workspacePath);

      expect(command).toContain("console.log.*[TLOG]");
      expect(command).toContain(workspacePath);
      expect(command).toContain("!**/node_modules/**");
      expect(command).toContain("--json");
    });

    test("handles empty workspace path", () => {
      const workspacePath = "";
      const command = buildRipgrepCommand(workspacePath);

      expect(command).toContain('""');
      expect(command).toContain("console.log.*[TLOG]");
      expect(command).toContain("!**/node_modules/**");
      expect(command).toContain("--json");
    });
  });

  describe("parseRipgrepResults", () => {
    test("parses valid JSON match result", () => {
      const jsonInput =
        '{"type":"match","data":{"path":{"text":"/path/file.ts"},"lines":{"text":"console.log(\\"[TLOG] test\\");"},"line_number":10,"submatches":[{"start":5}]}}';
      const result = parseRipgrepResults(jsonInput);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        filePath: "/path/file.ts",
        line: 9, // 0-based
        column: 5,
        content: 'console.log("[TLOG] test");',
      });
    });

    test("returns empty array for non-match JSON", () => {
      const jsonInput =
        '{"type":"begin","data":{"path":{"text":"/path/file.ts"}}}';
      const result = parseRipgrepResults(jsonInput);

      expect(result).toHaveLength(0);
    });
  });
});
