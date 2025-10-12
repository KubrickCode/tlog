import { ParsedRipgrepResult } from "./tlog-search";
import { groupTlogsByFile, buildDirectoryTree, TlogFileGroup } from "./tree-builder";

describe("Tree Builder Functions", () => {
  describe("groupTlogsByFile", () => {
    test("groups TLOGs by file correctly", () => {
      const searchResults = ["result1", "result2"];
      const mockParseFunction = (): ParsedRipgrepResult[] => [
        {
          column: 5,
          content: 'console.log("[TLOG] first");',
          filePath: "/path/file1.ts",
          line: 10,
        },
        {
          column: 5,
          content: 'console.log("[TLOG] second");',
          filePath: "/path/file1.ts",
          line: 20,
        },
        {
          column: 3,
          content: 'console.log("[TLOG] third");',
          filePath: "/path/file2.ts",
          line: 15,
        },
      ];

      const groups = groupTlogsByFile(searchResults, mockParseFunction);

      expect(groups).toHaveLength(2);
      expect(groups[0].filePath).toBe("/path/file1.ts");
      expect(groups[0].items).toHaveLength(2);
      expect(groups[0].items[0].line).toBe(10);
      expect(groups[0].items[1].line).toBe(20);
      expect(groups[1].filePath).toBe("/path/file2.ts");
      expect(groups[1].items).toHaveLength(1);
    });

    test("returns empty array when no results", () => {
      const searchResults: string[] = [];
      const mockParseFunction = (): ParsedRipgrepResult[] => [];

      const groups = groupTlogsByFile(searchResults, mockParseFunction);

      expect(groups).toHaveLength(0);
    });

    test("handles single file with multiple TLOGs", () => {
      const searchResults = ["result1"];
      const mockParseFunction = (): ParsedRipgrepResult[] => [
        {
          column: 0,
          content: 'console.log("[TLOG] first");',
          filePath: "/path/single.ts",
          line: 5,
        },
        {
          column: 0,
          content: 'console.log("[TLOG] second");',
          filePath: "/path/single.ts",
          line: 10,
        },
        {
          column: 0,
          content: 'console.log("[TLOG] third");',
          filePath: "/path/single.ts",
          line: 15,
        },
      ];

      const groups = groupTlogsByFile(searchResults, mockParseFunction);

      expect(groups).toHaveLength(1);
      expect(groups[0].filePath).toBe("/path/single.ts");
      expect(groups[0].items).toHaveLength(3);
      expect(groups[0].items[0].line).toBe(5);
      expect(groups[0].items[1].line).toBe(10);
      expect(groups[0].items[2].line).toBe(15);
    });

    test("sorts TLOG items by line number", () => {
      const searchResults = ["result1"];
      const mockParseFunction = (): ParsedRipgrepResult[] => [
        {
          column: 0,
          content: 'console.log("[TLOG] third");',
          filePath: "/path/file.ts",
          line: 20,
        },
        {
          column: 0,
          content: 'console.log("[TLOG] first");',
          filePath: "/path/file.ts",
          line: 5,
        },
        {
          column: 0,
          content: 'console.log("[TLOG] second");',
          filePath: "/path/file.ts",
          line: 10,
        },
      ];

      const groups = groupTlogsByFile(searchResults, mockParseFunction);

      expect(groups).toHaveLength(1);
      expect(groups[0].items).toHaveLength(3);
      expect(groups[0].items[0].line).toBe(5);
      expect(groups[0].items[1].line).toBe(10);
      expect(groups[0].items[2].line).toBe(20);
    });
  });

  describe("buildDirectoryTree", () => {
    test("builds directory tree from file groups", () => {
      const groups: TlogFileGroup[] = [
        {
          filePath: "/root/src/file1.ts",
          items: [],
        },
        {
          filePath: "/root/src/utils/file2.ts",
          items: [],
        },
        {
          filePath: "/root/lib/file3.ts",
          items: [],
        },
      ];

      const tree = buildDirectoryTree(groups, "/root");

      expect(tree.name).toBe("");
      expect(tree.fullPath).toBe("/root");
      expect(tree.children.has("src")).toBe(true);
      expect(tree.children.has("lib")).toBe(true);

      const srcNode = tree.children.get("src")!;
      expect(srcNode.children.has("utils")).toBe(true);
      expect(srcNode.files).toHaveLength(1);
      expect(srcNode.files[0].filePath).toBe("/root/src/file1.ts");

      const utilsNode = srcNode.children.get("utils")!;
      expect(utilsNode.files).toHaveLength(1);
      expect(utilsNode.files[0].filePath).toBe("/root/src/utils/file2.ts");

      const libNode = tree.children.get("lib")!;
      expect(libNode.files).toHaveLength(1);
      expect(libNode.files[0].filePath).toBe("/root/lib/file3.ts");
    });

    test("handles empty groups array", () => {
      const groups: TlogFileGroup[] = [];
      const tree = buildDirectoryTree(groups, "/root");

      expect(tree.name).toBe("");
      expect(tree.fullPath).toBe("/root");
      expect(tree.children.size).toBe(0);
      expect(tree.files).toHaveLength(0);
    });

    test("handles single file in root directory", () => {
      const groups: TlogFileGroup[] = [
        {
          filePath: "/root/main.ts",
          items: [],
        },
      ];

      const tree = buildDirectoryTree(groups, "/root");

      expect(tree.files).toHaveLength(1);
      expect(tree.files[0].filePath).toBe("/root/main.ts");
      expect(tree.children.size).toBe(0);
    });

    test("handles multiple files in same directory", () => {
      const groups: TlogFileGroup[] = [
        {
          filePath: "/root/src/file1.ts",
          items: [],
        },
        {
          filePath: "/root/src/file2.ts",
          items: [],
        },
        {
          filePath: "/root/src/file3.ts",
          items: [],
        },
      ];

      const tree = buildDirectoryTree(groups, "/root");

      expect(tree.children.has("src")).toBe(true);
      const srcNode = tree.children.get("src")!;
      expect(srcNode.files).toHaveLength(3);
      expect(srcNode.files.map((f) => f.filePath)).toEqual(
        expect.arrayContaining(["/root/src/file1.ts", "/root/src/file2.ts", "/root/src/file3.ts"])
      );
    });

    test("handles files at different directory levels", () => {
      const groups: TlogFileGroup[] = [
        {
          filePath: "/root/file.ts",
          items: [],
        },
        {
          filePath: "/root/src/nested/deep/file.ts",
          items: [],
        },
      ];

      const tree = buildDirectoryTree(groups, "/root");

      expect(tree.files).toHaveLength(1);
      expect(tree.files[0].filePath).toBe("/root/file.ts");

      expect(tree.children.has("src")).toBe(true);
      const srcNode = tree.children.get("src")!;
      expect(srcNode.children.has("nested")).toBe(true);
      const nestedNode = srcNode.children.get("nested")!;
      expect(nestedNode.children.has("deep")).toBe(true);
      const deepNode = nestedNode.children.get("deep")!;
      expect(deepNode.files).toHaveLength(1);
      expect(deepNode.files[0].filePath).toBe("/root/src/nested/deep/file.ts");
    });
  });
});
