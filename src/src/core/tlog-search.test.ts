import { buildRipgrepCommand } from "./tlog-search";

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
});
