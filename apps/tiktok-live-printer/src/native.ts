import { readdirSync } from "node:fs";
import path from "node:path";
import { setNativeModulePath } from "@printers/printers";

/** Inside the binary the spooler addon is an embedded asset; in dev the package loads it itself. */
export function configureNativeModules(): void {
  const dir = path.join(import.meta.dir, "native");
  try {
    const addon = readdirSync(dir).find((f) => f.endsWith(".node"));
    if (addon) setNativeModulePath(path.join(dir, addon));
  } catch {}
}
