import { defaultConfig } from "@tiktok-live-printer/config";
import { MemoryTransport, PrinterEngine, type RgbaImage } from "tiktok-live-printer";
import { describe, expect, it } from "vitest";
import { Session, type SessionStatus } from "../src/session/session.ts";

class MockSocket extends EventTarget {
  static last?: MockSocket;
  readyState = 0;
  constructor() {
    super();
    MockSocket.last = this;
  }
  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }
  serverClose(code: number) {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code, reason: "" }));
  }
  close() {}
  send() {}
}

const image: RgbaImage = { width: 8, height: 8, data: new Uint8ClampedArray(8 * 8 * 4) };
const giftFrame = (username: string) =>
  JSON.stringify({ type: "WebcastGiftMessage", data: { user: { displayId: username, avatarThumb: { urlList: [`https://cdn/${username}.jpeg`] } }, gift: { name: "Rose", type: 1, diamondCount: 1 }, repeatCount: 1, repeatEnd: 1 } });

function make(fetch: (url: string) => Promise<RgbaImage>) {
  const transport = new MemoryTransport();
  const statuses: SessionStatus[] = [];
  const config = { ...defaultConfig(), uniqueId: "x", apiKey: "k" };
  const session = new Session(config, () => {}, (s) => statuses.push(s), { engine: new PrinterEngine(transport), fetch, socketFactory: () => new MockSocket() as never });
  return { session, transport, statuses };
}

describe("Session", () => {
  it("prints receipts in event order even when the first avatar is slow to fetch", async () => {
    let releaseFirst!: () => void;
    const first = new Promise<RgbaImage>((r) => (releaseFirst = () => r(image)));
    const { session, transport } = make((url) => (url.includes("slow") ? first : Promise.resolve(image)));
    session.client.handleFrame(giftFrame("slow"));
    session.client.handleFrame(giftFrame("fast"));
    await new Promise((r) => setTimeout(r, 10));
    expect(transport.chunks).toHaveLength(0);
    releaseFirst();
    await new Promise((r) => setTimeout(r, 10));
    const printed = transport.chunks.map((c) => new TextDecoder().decode(c));
    expect(printed).toHaveLength(2);
    expect(printed[0]).toContain("@slow");
    expect(printed[1]).toContain("@fast");
  });

  it("reports idle after stop and ignores the socket's late close", async () => {
    const { session, statuses } = make(async () => image);
    const starting = session.start();
    MockSocket.last!.open();
    await starting;
    await session.stop();
    MockSocket.last!.serverClose(1000);
    expect(statuses.map((s) => s.state)).toEqual(["connecting", "connected", "idle"]);
  });
});
