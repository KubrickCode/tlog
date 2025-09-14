import { TLOG_PATTERN, TLOG_SNIPPET_TEMPLATE } from "./tlog-patterns";

describe("TLOG Pattern Matching", () => {
  describe("TLOG_PATTERN regex", () => {
    test("matches console.log with [TLOG] prefix", () => {
      expect(TLOG_PATTERN.test('console.log("[TLOG] test message");')).toBe(
        true
      );
    });

    test("does not match regular console.log without [TLOG]", () => {
      expect(TLOG_PATTERN.test('console.log("regular message");')).toBe(false);
    });

    test("matches with extra whitespace around parentheses", () => {
      expect(TLOG_PATTERN.test('console.log  (  "[TLOG] test"  );')).toBe(true);
    });

    test("matches case insensitive", () => {
      expect(TLOG_PATTERN.test('Console.Log("[tlog] test");')).toBe(true);
    });

    test("matches with different quote types", () => {
      expect(TLOG_PATTERN.test("console.log('[TLOG] test');")).toBe(true);
    });

    test("does not match without console.log", () => {
      expect(TLOG_PATTERN.test('log("[TLOG] test");')).toBe(false);
    });

    test("does not match with incomplete TLOG tag", () => {
      expect(TLOG_PATTERN.test('console.log("LOG] test");')).toBe(false);
      expect(TLOG_PATTERN.test('console.log("[TLOG test");')).toBe(false);
    });

    test("matches with complex message content", () => {
      expect(
        TLOG_PATTERN.test(
          'console.log("[TLOG] user ${name} logged in at " + new Date());'
        )
      ).toBe(true);
    });
  });
});
