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
        column: 5,
        content: 'console.log("[TLOG] test");',
        filePath: "/path/file.ts",
        line: 9, // 0-based
      });
    });

    test("returns empty array for non-match JSON", () => {
      const jsonInput = '{"type":"begin","data":{"path":{"text":"/path/file.ts"}}}';
      const result = parseRipgrepResults(jsonInput);

      expect(result).toHaveLength(0);
    });

    test("parses multi-line ripgrep JSON output", () => {
      const multiLineInput = `{"type":"begin"}
{"type":"match","data":{"path":{"text":"/path/file1.ts"},"lines":{"text":"  console.log(\\"[TLOG] first match\\");"},"line_number":5,"submatches":[{"start":2}]}}
{"type":"match","data":{"path":{"text":"/path/file2.ts"},"lines":{"text":"console.log(\\"[TLOG] second match\\");"},"line_number":12,"submatches":[{"start":0}]}}
{"type":"end","data":{"elapsed_total":{"secs":0,"nanos":123456}}}`;

      const result = parseRipgrepResults(multiLineInput);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        column: 2,
        content: 'console.log("[TLOG] first match");',
        filePath: "/path/file1.ts",
        line: 4, // 0-based
      });
      expect(result[1]).toEqual({
        column: 0,
        content: 'console.log("[TLOG] second match");',
        filePath: "/path/file2.ts",
        line: 11, // 0-based
      });
    });

    test("handles malformed JSON lines gracefully", () => {
      const malformedInput = `{"type":"begin"}
malformed-json-line
{"type":"match","data":{"path":{"text":"/path/file.ts"},"lines":{"text":"console.log(\\"[TLOG] test\\");"},"line_number":10,"submatches":[{"start":5}]}}
{"incomplete": json
{"type":"end"}`;

      const result = parseRipgrepResults(malformedInput);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        column: 5,
        content: 'console.log("[TLOG] test");',
        filePath: "/path/file.ts",
        line: 9,
      });
    });

    test("handles empty and whitespace-only input", () => {
      expect(parseRipgrepResults("")).toEqual([]);
      expect(parseRipgrepResults("   \n  \t  ")).toEqual([]);
      expect(parseRipgrepResults("\n\n\n")).toEqual([]);
    });
  });
});
