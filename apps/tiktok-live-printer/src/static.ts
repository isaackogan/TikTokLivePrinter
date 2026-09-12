import { existsSync } from "node:fs";
import path from "node:path";

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".json": "application/json" };

/** Serves the built SPA from a directory, falling back to index.html for unknown paths. */
export function serveStatic(dir: string): (req: Request) => Response {
  return (req) => {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    const candidate = path.join(dir, pathname);
    const file = pathname !== "/" && candidate.startsWith(dir) && existsSync(candidate) ? candidate : path.join(dir, "index.html");
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    return new Response(Bun.file(file), { headers: { "content-type": type } });
  };
}
