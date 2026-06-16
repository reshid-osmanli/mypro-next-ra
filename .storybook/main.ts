// ============================================================================
// .storybook/main.ts — Storybook 8 config for Next.js 15
// ----------------------------------------------------------------------------
// New file: /.storybook/main.ts
// ============================================================================

import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx)", "../app/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: { name: "@storybook/nextjs", options: {} },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
