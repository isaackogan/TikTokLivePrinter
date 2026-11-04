import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { $ } from "bun";
import { napiPlatform as napiPlatformFor } from "./platform.ts";

// Builds the single-file app binary. Assets are staged next to the entrypoint so
// `path.join(import.meta.dir, ...)` resolves the same way in dev and inside the binary.
const root = path.resolve(import.meta.dir, "..");
const src = path.join(root, "src");
const webDist = path.resolve(root, "../../packages/tiktok-live-printer/web/dist");

const targetArg = process.argv.find((a) => a.startsWith("--target="))?.slice("--target=".length) ?? process.env.BUILD_TARGET;
const platform = targetArg?.split("-")[0] ?? (process.platform === "win32" ? "windows" : process.platform);
const arch = targetArg?.split("-")[1] ?? (process.arch === "x64" ? "x64" : "arm64");
const target = `${platform}-${arch}`;

if (!existsSync(path.join(webDist, "index.html"))) throw new Error(`Web UI not built: ${webDist}`);

for (const dir of ["web", "native"]) rmSync(path.join(src, dir), { recursive: true, force: true });
cpSync(webDist, path.join(src, "web"), { recursive: true });

// The spooler package resolves its addon with a dynamic import Bun cannot bundle, so the
// addon is embedded as an asset and pointed at with setNativeModulePath() at startup.
const napiPlatform = napiPlatformFor(platform, arch);
const spoolerPackage = `@printers/printers-${napiPlatform}`;
const spoolerRequire = createRequire(createRequire(import.meta.url).resolve("@printers/printers"));
mkdirSync(path.join(src, "native"));
cpSync(spoolerRequire.resolve(`${spoolerPackage}/printers.${napiPlatform}.node`), path.join(src, "native", `printers.${napiPlatform}.node`));

const outfile = path.join(root, "dist", `tiktok-live-printer-${target}${platform === "windows" ? ".exe" : ""}`);
const extra = platform === "windows" ? ["--windows-hide-console"] : [];
await $`bun build --compile --minify --sourcemap --target=bun-${target} --asset ${path.join(src, "web")} --asset ${path.join(src, "native")} ${extra} ${path.join(src, "main.ts")} --outfile ${outfile}`.cwd(root);
console.log(`built ${outfile}`);
