import { describe, expect, it } from "vitest";
import { TikTokPrinterClient } from "../src/client.ts";
import { Text } from "../src/items.ts";
import { MemoryTransport } from "../src/printer/console.ts";
import { PrinterEngine } from "../src/printer/engine.ts";

class MockSocket extends EventTarget {
  static last?: MockSocket;
  readyState = 0;
  sent: string[] = [];
  constructor(public url: string) {
    super();
    MockSocket.last = this;
  }
  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }
  message(raw: string) {
    this.dispatchEvent(new MessageEvent("message", { data: raw }));
  }
  closeFromServer(code: number, reason = "") {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code, reason }));
  }
  close() {
    this.closeFromServer(1000);
  }
  send(data: string) {
    this.sent.push(data);
  }
}

const make = (transport = new MemoryTransport()) =>
  new TikTokPrinterClient({ uniqueId: "someone", printer: new PrinterEngine(transport), socketFactory: (url) => new MockSocket(url) as never });

describe("TikTokPrinterClient", () => {
  it("builds a schema v3 websocket url", async () => {
    const client = make();
    const connecting = client.connect();
    MockSocket.last!.open();
    await connecting;
    expect(MockSocket.last!.url).toContain("uniqueId=someone");
    expect(MockSocket.last!.url).toContain("features.schemaVersion=v3");
  });

  it("emits each message in a bundle in order", () => {
    const client = make();
    const seen: string[] = [];
    client.on("WebcastChatMessage", (m) => seen.push(`chat:${m.content}`));
    client.on("WebcastGiftMessage", (m) => seen.push(`gift:${m.repeatEnd}`));
    client.handleFrame(JSON.stringify({ timestamp: 1, messages: [{ type: "WebcastChatMessage", data: { content: "a" } }, { type: "WebcastGiftMessage", data: { repeatEnd: 1 } }] }));
    expect(seen).toEqual(["chat:a", "gift:1"]);
  });

  it("emits a single message frame", () => {
    const client = make();
    const seen: string[] = [];
    client.on("WebcastChatMessage", (m) => seen.push(m.content));
    client.handleFrame(JSON.stringify({ type: "WebcastChatMessage", data: { content: "solo" } }));
    expect(seen).toEqual(["solo"]);
  });

  it("reports malformed frames as errors instead of throwing", () => {
    const client = make();
    const errors: Error[] = [];
    client.on("error", (e) => errors.push(e));
    expect(() => client.handleFrame("{not json")).not.toThrow();
    expect(errors).toHaveLength(1);
  });

  it("queues jobs serially and writes one chunk per job", async () => {
    const transport = new MemoryTransport();
    const client = make(transport);
    await Promise.all([client.queue(Text("a")), client.queue(Text("b"))]);
    expect(transport.chunks).toHaveLength(2);
    expect(new TextDecoder().decode(transport.chunks[0])).toContain("a");
    expect(new TextDecoder().decode(transport.chunks[1])).toContain("b");
  });

  it("disconnected carries the close code and its meaning", async () => {
    const client = make();
    const closes: { code: number; reason: string }[] = [];
    client.on("disconnected", (info) => closes.push(info));
    const connecting = client.connect();
    MockSocket.last!.open();
    await connecting;
    MockSocket.last!.closeFromServer(4404);
    expect(closes).toEqual([{ code: 4404, reason: "Streamer is not live" }]);
  });

  it("connect rejects when the socket closes before opening", async () => {
    const client = make();
    const connecting = client.connect();
    MockSocket.last!.closeFromServer(4401, "Invalid auth");
    await expect(connecting).rejects.toThrow(/Invalid auth/);
  });
});
