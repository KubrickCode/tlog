module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts", // Only measure coverage for source files
    "!src/**/*.test.ts",
    "!src/main.ts", // Exclude entry point
  ],
  moduleNameMapping: {
    "^vscode$": "<rootDir>/__mocks__/vscode.js",
  },
};
