// ============================================================================
// vitest.config.ts — Test runner config
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
    server: {
      deps: {
        inline: ["next-auth", "@auth/core"],
      },
    },
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
      "next/server": path.resolve(__dirname, "node_modules/next/server.js"),
      "next/headers": path.resolve(__dirname, "node_modules/next/headers.js"),
      "next/navigation": path.resolve(__dirname, "node_modules/next/navigation.js"),
      "next/image": path.resolve(__dirname, "node_modules/next/image.js"),
    },
  },
});
