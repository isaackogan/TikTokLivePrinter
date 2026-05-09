import type { UserConfig, UserConfigFn } from "tsdown";

// Watch mode never cleans dist: consumers restart on dist changes and a missing-dist window would boot them into an import error.
export function defineTsdownPackageConfig(overrides: UserConfig & { entry: unknown }): UserConfigFn {
  return ({ watch }) => ({
    format: ["esm"],
    target: "node22",
    platform: "node",
    outDir: "dist",
    clean: !watch,
    dts: true,
    sourcemap: true,
    ignoreWatch: ["**/dist/**", "**/node_modules/**", "**/.turbo/**"],
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    ...overrides,
  });
}
