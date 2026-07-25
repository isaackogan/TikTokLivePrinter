import { describe, expect, it } from "vitest";
import { lighten } from "../src/image.ts";
import type { RgbaImage } from "../src/items.ts";

const pixel = (v: number): RgbaImage => ({ width: 1, height: 1, data: new Uint8ClampedArray([v, v, v, 255]) });

describe("lighten", () => {
  it("lifts midtones", () => {
    expect(lighten(pixel(128), 1.6).data[0]).toBeGreaterThan(160);
  });

  it("keeps black and white where they are", () => {
    expect(lighten(pixel(0), 1.6).data[0]).toBe(0);
    expect(lighten(pixel(255), 1.6).data[0]).toBe(255);
  });

  it("leaves alpha untouched and does not mutate the input", () => {
    const input = pixel(100);
    input.data[3] = 42;
    const out = lighten(input, 1.6);
    expect(out.data[3]).toBe(42);
    expect(input.data[0]).toBe(100);
  });

  it("gamma 1 is the identity", () => {
    expect([...lighten(pixel(77), 1).data]).toEqual([77, 77, 77, 255]);
  });
});
