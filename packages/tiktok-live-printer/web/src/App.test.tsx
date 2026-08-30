import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";
import { STORAGE_KEY, loadConfig } from "./store.ts";

class FakeSocket {
  onmessage: unknown;
  onclose: unknown;
  close() {}
}

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ usb: [], spooler: [] }), { status: 200 })));
  vi.stubGlobal("WebSocket", FakeSocket);
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const click = (label: string) => {
  const button = [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
  if (!button) throw new Error(`no button "${label}"`);
  act(() => button.click());
};

describe("App", () => {
  it("renders the default gift receipt and adds a new one on demand", async () => {
    await act(async () => root.render(<App />));
    expect(host.textContent).toContain("TikTok Live Printer");
    expect(host.querySelectorAll("[data-slot=card]").length).toBeGreaterThanOrEqual(4);

    click("Add receipt");
    expect(loadConfig().triggers).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).triggers).toHaveLength(2);
  });

  it("appends a block from the palette to the first receipt", async () => {
    await act(async () => root.render(<App />));
    click("+ Cut");
    expect(loadConfig().triggers[0]!.blocks.at(-1)?.type).toBe("cut");
  });
});
