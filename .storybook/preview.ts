// ============================================================================
// .storybook/preview.ts — Storybook preview config (themes, RTL)
// ----------------------------------------------------------------------------
// New file: /.storybook/preview.ts
// ============================================================================

import type { Preview } from "@storybook/react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ },
    },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, ctx) => {
      // Force LTR for non-Arabic stories
      const isRtl = ctx.globals?.rtl ?? true;
      return (
        <div dir={isRtl ? "rtl" : "ltr"} className="bg-pearl-50 p-8">
          <Story />
        </div>
      );
    },
  ],
  globalTypes: {
    rtl: {
      name: "Direction",
      description: "RTL vs LTR",
      defaultValue: "rtl",
      toolbar: { icon: "transfer", items: [{ value: "rtl", title: "RTL" }, { value: "ltr", title: "LTR" }] },
    },
  },
};

export default preview;
