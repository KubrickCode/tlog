import { shouldProcessFile } from "./file-watcher";

describe("File Watcher Functions", () => {
  describe("shouldProcessFile", () => {
    test("returns true for regular source files", () => {
      expect(shouldProcessFile("/project/src/main.ts")).toBe(true);
      expect(shouldProcessFile("/project/lib/utils.js")).toBe(true);
      expect(shouldProcessFile("/project/app/components/Button.tsx")).toBe(
        true
      );
    });

    test("returns false for excluded directories", () => {
      expect(shouldProcessFile("/project/node_modules/package/index.js")).toBe(
        false
      );
      expect(shouldProcessFile("/project/.git/config")).toBe(false);
      expect(shouldProcessFile("/project/.vscode/settings.json")).toBe(false);
      expect(shouldProcessFile("/project/dist/bundle.js")).toBe(false);
      expect(shouldProcessFile("/project/build/output.js")).toBe(false);
      expect(shouldProcessFile("/project/out/main.js")).toBe(false);
      expect(shouldProcessFile("/project/coverage/report.html")).toBe(false);
      expect(shouldProcessFile("/project/.next/app/page.js")).toBe(false);
      expect(shouldProcessFile("/project/.nuxt/components/button.vue")).toBe(
        false
      );
      expect(shouldProcessFile("/project/.cache/data.json")).toBe(false);
      expect(shouldProcessFile("/project/tmp/temp.js")).toBe(false);
      expect(shouldProcessFile("/project/temp/cache.js")).toBe(false);
    });

    test("returns false for files ending with excluded directory names", () => {
      expect(shouldProcessFile("/project/some/deep/node_modules")).toBe(false);
      expect(shouldProcessFile("/project/path/to/.git")).toBe(false);
      expect(shouldProcessFile("/project/nested/dist")).toBe(false);
    });

    test("returns true for files in nested non-excluded directories", () => {
      expect(shouldProcessFile("/project/src/utils/helpers.ts")).toBe(true);
      expect(shouldProcessFile("/project/app/api/handlers.js")).toBe(true);
      expect(shouldProcessFile("/project/packages/ui/Button.tsx")).toBe(true);
    });

    test("handles Windows-style path separators", () => {
      expect(shouldProcessFile("C:/project/src/main.ts")).toBe(true);
      expect(
        shouldProcessFile("C:/project/node_modules/package/index.js")
      ).toBe(false);
      expect(shouldProcessFile("C:/project/.git/config")).toBe(false);
    });

    test("handles case sensitivity in directory names", () => {
      expect(shouldProcessFile("/project/Node_Modules/package/index.js")).toBe(
        true
      );
      expect(shouldProcessFile("/project/.GIT/config")).toBe(true);
      expect(shouldProcessFile("/project/.vscode-test/config.json")).toBe(true);
      expect(shouldProcessFile("/project/.vscode/Settings.json")).toBe(false);
    });

    test("handles root directory and single-level paths", () => {
      expect(shouldProcessFile("/main.ts")).toBe(true);
      expect(shouldProcessFile("/node_modules/package/index.js")).toBe(false);
      expect(shouldProcessFile("/.git")).toBe(false);
    });

    test("handles deeply nested excluded directories", () => {
      expect(
        shouldProcessFile("/project/src/deep/nested/node_modules/lib/index.js")
      ).toBe(false);
      expect(
        shouldProcessFile("/project/src/deep/nested/.git/hooks/pre-commit")
      ).toBe(false);
      expect(shouldProcessFile("/project/src/deep/nested/dist/bundle.js")).toBe(
        false
      );
    });
  });
});
