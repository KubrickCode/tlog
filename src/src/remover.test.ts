import {
  processSearchResults,
  createFileLineMap,
  findTlogLinesInDocument,
} from "./remover";

describe("Remover Functions", () => {
  describe("processSearchResults", () => {
    test("processes ripgrep JSON results correctly", () => {
      const searchResults = [
        '{"type":"match","data":{"path":{"text":"/path/to/file1.ts"},"lines":{"text":"console.log(\\"[TLOG] test1\\");"},"line_number":10,"submatches":[{"start":5}]}}',
        '{"type":"match","data":{"path":{"text":"/path/to/file2.ts"},"lines":{"text":"console.log(\\"[TLOG] test2\\");"},"line_number":20,"submatches":[{"start":3}]}}',
        '{"type":"match","data":{"path":{"text":"/path/to/file1.ts"},"lines":{"text":"console.log(\\"[TLOG] test3\\");"},"line_number":30,"submatches":[{"start":8}]}}',
      ];

      const result = processSearchResults(searchResults);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        filePath: "/path/to/file1.ts",
        lineNumber: 9, // 0-based
      });
      expect(result[1]).toEqual({
        filePath: "/path/to/file2.ts",
        lineNumber: 19, // 0-based
      });
      expect(result[2]).toEqual({
        filePath: "/path/to/file1.ts",
        lineNumber: 29, // 0-based
      });
    });

    test("ignores malformed JSON lines", () => {
      const searchResults = [
        '{"type":"match","data":{"path":{"text":"/path/to/file1.ts"},"lines":{"text":"console.log(\\"[TLOG] test\\");"},"line_number":10,"submatches":[{"start":5}]}}',
        "malformed-json-line",
        '{"type":"begin"}',
        '{"type":"match","data":{"path":{"text":"/path/to/file3.ts"},"lines":{"text":"console.log(\\"[TLOG] test\\");"},"line_number":15,"submatches":[{"start":2}]}}',
      ];

      const result = processSearchResults(searchResults);

      expect(result).toHaveLength(2);
      expect(result[0].filePath).toBe("/path/to/file1.ts");
      expect(result[1].filePath).toBe("/path/to/file3.ts");
    });

    test("ignores non-match JSON types", () => {
      const searchResults = [
        '{"type":"begin"}',
        '{"type":"match","data":{"path":{"text":"/path/to/file1.ts"},"lines":{"text":"console.log(\\"[TLOG] test\\");"},"line_number":10,"submatches":[{"start":5}]}}',
        '{"type":"end"}',
      ];

      const result = processSearchResults(searchResults);

      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe("/path/to/file1.ts");
    });
  });

  describe("createFileLineMap", () => {
    test("creates file-line map from processed results", () => {
      const processedResults = [
        { filePath: "/path/file1.ts", lineNumber: 10 },
        { filePath: "/path/file1.ts", lineNumber: 20 },
        { filePath: "/path/file2.ts", lineNumber: 5 },
        { filePath: "/path/file1.ts", lineNumber: 15 },
      ];

      const fileLineMap = createFileLineMap(processedResults);

      expect(fileLineMap.size).toBe(2);
      expect(fileLineMap.get("/path/file1.ts")).toEqual([10, 20, 15]);
      expect(fileLineMap.get("/path/file2.ts")).toEqual([5]);
    });

    test("handles empty processed results", () => {
      const processedResults: Array<{ filePath: string; lineNumber: number }> =
        [];

      const fileLineMap = createFileLineMap(processedResults);

      expect(fileLineMap.size).toBe(0);
    });

    test("handles duplicate line numbers for same file", () => {
      const processedResults = [
        { filePath: "/path/file1.ts", lineNumber: 10 },
        { filePath: "/path/file1.ts", lineNumber: 10 },
        { filePath: "/path/file1.ts", lineNumber: 20 },
      ];

      const fileLineMap = createFileLineMap(processedResults);

      expect(fileLineMap.size).toBe(1);
      expect(fileLineMap.get("/path/file1.ts")).toEqual([10, 10, 20]);
    });

    test("maintains order of processed results", () => {
      const processedResults = [
        { filePath: "/path/file1.ts", lineNumber: 30 },
        { filePath: "/path/file1.ts", lineNumber: 10 },
        { filePath: "/path/file1.ts", lineNumber: 20 },
      ];

      const fileLineMap = createFileLineMap(processedResults);

      expect(fileLineMap.get("/path/file1.ts")).toEqual([30, 10, 20]);
    });
  });

  describe("findTlogLinesInDocument", () => {
    test("finds TLOG lines in document", () => {
      const mockDocument = {
        lineCount: 5,
        lineAt: jest.fn((index: number) => ({
          text: [
            'console.log("regular message");',
            'console.log("[TLOG] debug message");',
            "const x = 1;",
            'console.log("[TLOG] another message");',
            'console.log("final message");',
          ][index],
          rangeIncludingLineBreak: {
            start: { line: index, character: 0 },
            end: { line: index + 1, character: 0 },
          },
        })),
      };

      const result = findTlogLinesInDocument(mockDocument as any);

      expect(result).toHaveLength(2);
      expect(result[0].start.line).toBe(1);
      expect(result[1].start.line).toBe(3);
    });

    test("returns empty array when no TLOG lines found", () => {
      const mockDocument = {
        lineCount: 3,
        lineAt: jest.fn((index: number) => ({
          text: [
            'console.log("regular message");',
            "const x = 1;",
            'console.log("another message");',
          ][index],
          rangeIncludingLineBreak: {
            start: { line: index, character: 0 },
            end: { line: index + 1, character: 0 },
          },
        })),
      };

      const result = findTlogLinesInDocument(mockDocument as any);

      expect(result).toHaveLength(0);
    });

    test("handles empty document", () => {
      const mockDocument = {
        lineCount: 0,
        lineAt: jest.fn(),
      };

      const result = findTlogLinesInDocument(mockDocument as any);

      expect(result).toHaveLength(0);
    });
  });
});
