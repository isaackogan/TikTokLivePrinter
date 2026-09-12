import { parseConfig } from "@tiktok-live-printer/config";
import { listPrinters, testPrint } from "./printers.ts";
import { Session, type SessionStatus } from "./session/session.ts";
import { serveStatic } from "./static.ts";

type ServerEvent = { type: "status"; status: SessionStatus } | { type: "log"; line: string };

const EVENTS = "events";

export function createServer(opts: { port: number; staticDir: string }) {
  let session: Session | undefined;
  let status: SessionStatus = { state: "idle" };
  const serveSpa = serveStatic(opts.staticDir);

  const broadcast = (event: ServerEvent) => server.publish(EVENTS, JSON.stringify(event));
  const setStatus = (next: SessionStatus) => {
    status = next;
    broadcast({ type: "status", status });
  };

  const json = (data: unknown, init: ResponseInit = {}) => Response.json(data ?? null, init);
  const fail = (err: unknown) => json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  const readConfig = async (req: Request) => {
    const result = parseConfig(((await req.json()) as { config?: unknown }).config);
    if (!result.ok) throw new Error(result.error);
    return result.config;
  };

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: opts.port,
    routes: {
      "/api/printers": () => listPrinters().then(json, fail),
      "/api/print/test": { POST: (req) => readConfig(req).then(testPrint).then(json, fail) },
      "/api/session": () => json(status),
      "/api/session/start": {
        POST: async (req) => {
          try {
            const config = await readConfig(req);
            await session?.stop();
            session = new Session(config, (line) => broadcast({ type: "log", line }), setStatus);
            await session.start();
            return json(status);
          } catch (err) {
            setStatus({ state: "disconnected", detail: err instanceof Error ? err.message : String(err) });
            return fail(err);
          }
        },
      },
      "/api/session/stop": {
        POST: async () => {
          await session?.stop();
          session = undefined;
          return json(status);
        },
      },
      "/api/events": (req, server) => (server.upgrade(req) ? undefined : new Response("WebSocket expected", { status: 426 })),
    },
    fetch: serveSpa,
    websocket: {
      open(ws) {
        ws.subscribe(EVENTS);
        ws.send(JSON.stringify({ type: "status", status } satisfies ServerEvent));
      },
      message() {},
    },
  });

  return server;
}
