import { defineConfig } from "vitest/config";

// Workspace packages are inlined so their `source` export condition applies; npm packages stay external.
export default defineConfig({
  resolve: { conditions: ["source"] },
  ssr: { noExternal: ["tiktok-live-printer", "@tiktok-live-printer/config"] },
  test: { include: ["test/**/*.test.ts"] },
});
