import {
  processSearchResults,
  createFileLineMap,
  findTlogLinesInDocument,
} from "./remover";

describe("Remover Functions", () => {
  describe("processSearchResults", () => {
    test("processes ripgrep results correctly", () => {
      const searchResults = [
        '/path/to/file1.ts:10:5:console.log("[TLOG] test1");',
        '/path/to/file2.ts:20:3:console.log("[TLOG] test2");',
        '/path/to/file1.ts:30:8:console.log("[TLOG] test3");',
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

    test("ignores malformed lines", () => {
      const searchResults = [
        '/path/to/file1.ts:10:5:console.log("[TLOG] test");',
        "malformed-line-without-colon",
        '/path/to/file2.ts:not-a-number:3:console.log("[TLOG] test");',
        '/path/to/file3.ts:15:2:console.log("[TLOG] test");',
      ];

      const result = processSearchResults(searchResults);

      expect(result).toHaveLength(2);
      expect(result[0].filePath).toBe("/path/to/file1.ts");
      expect(result[1].filePath).toBe("/path/to/file3.ts");
    });

    test("ignores lines with extra colons in path", () => {
      const searchResults = [
        '/path/with:colons/file.ts:10:5:console.log("[TLOG] test");',
      ];

      const result = processSearchResults(searchResults);

      expect(result).toHaveLength(0);
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
