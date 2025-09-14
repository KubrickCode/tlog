import { getTotalTlogCount, collectAllFilePaths } from "./tlog-tree-remover";
import { TlogDirectoryNode } from "./core/tree-builder";

describe("Tree Remover Functions", () => {
  describe("getTotalTlogCount", () => {
    test("counts TLOGs in directory with files only", () => {
      const node: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/file1.ts",
            items: [
              {
                filePath: "/root/src/file1.ts",
                line: 10,
                column: 5,
                content: 'console.log("[TLOG] test1");',
              },
              {
                filePath: "/root/src/file1.ts",
                line: 20,
                column: 5,
                content: 'console.log("[TLOG] test2");',
              },
            ],
          },
          {
            filePath: "/root/src/file2.ts",
            items: [
              {
                filePath: "/root/src/file2.ts",
                line: 15,
                column: 3,
                content: 'console.log("[TLOG] test3");',
              },
            ],
          },
        ],
      };

      const count = getTotalTlogCount(node);

      expect(count).toBe(3);
    });

    test("counts TLOGs recursively in nested directories", () => {
      const childNode: TlogDirectoryNode = {
        name: "utils",
        fullPath: "/root/src/utils",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/utils/helper.ts",
            items: [
              {
                filePath: "/root/src/utils/helper.ts",
                line: 5,
                column: 0,
                content: 'console.log("[TLOG] helper");',
              },
            ],
          },
        ],
      };

      const rootNode: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map([["utils", childNode]]),
        files: [
          {
            filePath: "/root/src/main.ts",
            items: [
              {
                filePath: "/root/src/main.ts",
                line: 10,
                column: 5,
                content: 'console.log("[TLOG] main");',
              },
            ],
          },
        ],
      };

      const count = getTotalTlogCount(rootNode);

      expect(count).toBe(2);
    });

    test("returns 0 for empty directory", () => {
      const node: TlogDirectoryNode = {
        name: "empty",
        fullPath: "/root/empty",
        children: new Map(),
        files: [],
      };

      const count = getTotalTlogCount(node);

      expect(count).toBe(0);
    });

    test("counts TLOGs in deeply nested directory structure", () => {
      const deepChildNode: TlogDirectoryNode = {
        name: "deep",
        fullPath: "/root/src/components/deep",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/components/deep/util.ts",
            items: [
              {
                filePath: "/root/src/components/deep/util.ts",
                line: 5,
                column: 0,
                content: 'console.log("[TLOG] deep");',
              },
            ],
          },
        ],
      };

      const childNode: TlogDirectoryNode = {
        name: "components",
        fullPath: "/root/src/components",
        children: new Map([["deep", deepChildNode]]),
        files: [
          {
            filePath: "/root/src/components/Button.ts",
            items: [
              {
                filePath: "/root/src/components/Button.ts",
                line: 10,
                column: 5,
                content: 'console.log("[TLOG] button");',
              },
            ],
          },
        ],
      };

      const rootNode: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map([["components", childNode]]),
        files: [
          {
            filePath: "/root/src/main.ts",
            items: [
              {
                filePath: "/root/src/main.ts",
                line: 1,
                column: 0,
                content: 'console.log("[TLOG] main");',
              },
            ],
          },
        ],
      };

      const count = getTotalTlogCount(rootNode);

      expect(count).toBe(3);
    });

    test("counts TLOGs when some files have no items", () => {
      const node: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/file1.ts",
            items: [
              {
                filePath: "/root/src/file1.ts",
                line: 10,
                column: 5,
                content: 'console.log("[TLOG] test1");',
              },
            ],
          },
          {
            filePath: "/root/src/file2.ts",
            items: [], // Empty items
          },
          {
            filePath: "/root/src/file3.ts",
            items: [
              {
                filePath: "/root/src/file3.ts",
                line: 5,
                column: 0,
                content: 'console.log("[TLOG] test3");',
              },
            ],
          },
        ],
      };

      const count = getTotalTlogCount(node);

      expect(count).toBe(2);
    });
  });

  describe("collectAllFilePaths", () => {
    test("collects file paths from directory with files only", () => {
      const node: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/file1.ts",
            items: [],
          },
          {
            filePath: "/root/src/file2.ts",
            items: [],
          },
        ],
      };

      const filePaths = collectAllFilePaths(node);

      expect(filePaths).toHaveLength(2);
      expect(filePaths).toContain("/root/src/file1.ts");
      expect(filePaths).toContain("/root/src/file2.ts");
    });

    test("collects file paths recursively from nested directories", () => {
      const childNode: TlogDirectoryNode = {
        name: "utils",
        fullPath: "/root/src/utils",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/utils/helper.ts",
            items: [],
          },
        ],
      };

      const rootNode: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map([["utils", childNode]]),
        files: [
          {
            filePath: "/root/src/main.ts",
            items: [],
          },
        ],
      };

      const filePaths = collectAllFilePaths(rootNode);

      expect(filePaths).toHaveLength(2);
      expect(filePaths).toContain("/root/src/main.ts");
      expect(filePaths).toContain("/root/src/utils/helper.ts");
    });

    test("returns empty array for directory with no files", () => {
      const node: TlogDirectoryNode = {
        name: "empty",
        fullPath: "/root/empty",
        children: new Map(),
        files: [],
      };

      const filePaths = collectAllFilePaths(node);

      expect(filePaths).toHaveLength(0);
    });

    test("collects file paths from complex nested structure", () => {
      const deepChildNode: TlogDirectoryNode = {
        name: "deep",
        fullPath: "/root/src/components/ui/deep",
        children: new Map(),
        files: [
          {
            filePath: "/root/src/components/ui/deep/Button.ts",
            items: [],
          },
        ],
      };

      const childNode: TlogDirectoryNode = {
        name: "ui",
        fullPath: "/root/src/components/ui",
        children: new Map([["deep", deepChildNode]]),
        files: [
          {
            filePath: "/root/src/components/ui/Input.ts",
            items: [],
          },
        ],
      };

      const componentsNode: TlogDirectoryNode = {
        name: "components",
        fullPath: "/root/src/components",
        children: new Map([["ui", childNode]]),
        files: [
          {
            filePath: "/root/src/components/Layout.ts",
            items: [],
          },
        ],
      };

      const rootNode: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map([["components", componentsNode]]),
        files: [
          {
            filePath: "/root/src/main.ts",
            items: [],
          },
          {
            filePath: "/root/src/utils.ts",
            items: [],
          },
        ],
      };

      const filePaths = collectAllFilePaths(rootNode);

      expect(filePaths).toHaveLength(5);
      expect(filePaths).toContain("/root/src/main.ts");
      expect(filePaths).toContain("/root/src/utils.ts");
      expect(filePaths).toContain("/root/src/components/Layout.ts");
      expect(filePaths).toContain("/root/src/components/ui/Input.ts");
      expect(filePaths).toContain("/root/src/components/ui/deep/Button.ts");
    });

    test("handles empty child directories", () => {
      const emptyChildNode: TlogDirectoryNode = {
        name: "empty",
        fullPath: "/root/src/empty",
        children: new Map(),
        files: [],
      };

      const rootNode: TlogDirectoryNode = {
        name: "src",
        fullPath: "/root/src",
        children: new Map([["empty", emptyChildNode]]),
        files: [
          {
            filePath: "/root/src/main.ts",
            items: [],
          },
        ],
      };

      const filePaths = collectAllFilePaths(rootNode);

      expect(filePaths).toHaveLength(1);
      expect(filePaths).toContain("/root/src/main.ts");
    });
  });
});
