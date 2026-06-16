// ============================================================================
// vitest.config.ts — Test runner config
// ----------------------------------------------------------------------------
// New file (root): /vitest.config.ts
// ============================================================================

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".storybook"],
    coverage: {
      reporter: ["text", "html", "lcov"],
      include: ["lib/**", "components/**/*.tsx", "app/api/**/*.ts"],
      exclude: ["**/*.d.ts", "**/types.ts", "**/node_modules/**"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
