import { describe, expect, it } from "vitest";
import { PrinterEngine } from "../src/printer/engine.ts";
import { MemoryTransport } from "../src/printer/console.ts";
import { Cut, Feed, Image, Line, Text, type RgbaImage } from "../src/items.ts";

const ESC = 0x1b;
const GS = 0x1d;

function contains(haystack: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("PrinterEngine", () => {
  const engine = () => {
    const transport = new MemoryTransport();
    return { transport, engine: new PrinterEngine(transport) };
  };

  it("encodes text with ESC/POS init and bold markers", () => {
    const bytes = engine().engine.encode([Text("hi", { bold: true })]);
    expect([bytes[0], bytes[1]]).toEqual([ESC, 0x40]);
    expect(contains(bytes, [ESC, 0x45, 0x01])).toBe(true);
    expect(contains(bytes, ascii("hi"))).toBe(true);
  });

  it("line is a full row of dashes for the paper width", () => {
    const bytes = engine().engine.encode([Line()]);
    expect(contains(bytes, ascii("-".repeat(32)))).toBe(true);
    expect(contains(bytes, ascii("-".repeat(33)))).toBe(false);
  });

  it("cut emits GS V", () => {
    expect(contains(engine().engine.encode([Cut()]), [GS, 0x56])).toBe(true);
  });

  it("feed emits one line feed per line", () => {
    const bytes = engine().engine.encode([Feed(3)]);
    expect(bytes.filter((b) => b === 0x0a).length).toBe(3);
  });

  it("image emits the raster header GS v 0", () => {
    const image: RgbaImage = { width: 16, height: 8, data: new Uint8ClampedArray(16 * 8 * 4).fill(255) };
    expect(contains(engine().engine.encode([Image(image)]), [GS, 0x76, 0x30])).toBe(true);
  });

  it("print writes a job as one chunk and skips voice and sound items", async () => {
    const { transport, engine: e } = engine();
    await e.print([Text("a"), { type: "voice", content: "x" }, Text("b")]);
    expect(transport.chunks.length).toBe(1);
  });
});

describe("PrinterEngine image lightness", () => {
  it("applies the gamma lift so a mid-grey image dithers lighter than with gamma 1", () => {
    const grey: RgbaImage = { width: 64, height: 8, data: new Uint8ClampedArray(64 * 8 * 4).fill(96).map((v, i) => (i % 4 === 3 ? 255 : v)) };
    const dark = new PrinterEngine(new MemoryTransport(), { imageGamma: 1 }).encode([Image(grey)]);
    const lifted = new PrinterEngine(new MemoryTransport()).encode([Image(grey)]);
    const ones = (bytes: Uint8Array) => [...bytes].reduce((n, b) => n + ((b >>> 0).toString(2).match(/1/g)?.length ?? 0), 0);
    expect(ones(lifted)).toBeLessThan(ones(dark));
  });
});
