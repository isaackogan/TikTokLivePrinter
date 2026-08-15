import type { Config } from "@tiktok-live-printer/config";

export type PrinterList = { usb: { vendorId: number; productId: number; name: string }[]; spooler: string[] };
export type SessionStatus = { state: "idle" | "connecting" | "connected" | "disconnected"; detail?: string };
export type ServerEvent = { type: "status"; status: SessionStatus } | { type: "log"; line: string };

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const getPrinters = () => request<PrinterList>("/api/printers");
export const testPrint = (config: Config) => request<void>("/api/print/test", { config });
export const startSession = (config: Config) => request<void>("/api/session/start", { config });
export const stopSession = () => request<void>("/api/session/stop", {});
export const getSession = () => request<SessionStatus>("/api/session");

/** Subscribes to server events; reconnects while the page is open. Returns a disposer. */
export function openEvents(onEvent: (event: ServerEvent) => void): () => void {
  let socket: WebSocket | undefined;
  let closed = false;
  const connect = () => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${protocol}://${location.host}/api/events`);
    socket.onmessage = (e) => onEvent(JSON.parse(String(e.data)));
    socket.onclose = () => {
      if (!closed) setTimeout(connect, 1000);
    };
  };
  connect();
  return () => {
    closed = true;
    socket?.close();
  };
}
