import { Jimp } from "jimp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { avatarUrl, fetchImage, giftImageUrl, pickImageUrl } from "../src/media.ts";

const webp = "https://p16.tiktokcdn.com/img/avatar~c5_100x100.webp?x=1";
const jpeg = "https://p16.tiktokcdn.com/img/avatar~c5_100x100.jpeg?x=1";

describe("pickImageUrl", () => {
  it("prefers jpeg over webp", () => {
    expect(pickImageUrl({ urlList: [webp, jpeg] })).toBe(jpeg);
  });

  it("rewrites webp to jpeg when nothing else is offered", () => {
    expect(pickImageUrl({ urlList: [webp] })).toBe(jpeg);
  });

  it("returns undefined for an empty or missing list", () => {
    expect(pickImageUrl({ urlList: [] })).toBeUndefined();
    expect(pickImageUrl(undefined)).toBeUndefined();
  });
});

describe("avatarUrl and giftImageUrl", () => {
  it("avatarUrl falls back from thumb to medium", () => {
    expect(avatarUrl({ avatarThumb: { urlList: [] }, avatarMedium: { urlList: [jpeg] } } as never)).toBe(jpeg);
  });

  it("giftImageUrl falls back from image to icon", () => {
    expect(giftImageUrl({ image: undefined, icon: { urlList: [jpeg] } } as never)).toBe(jpeg);
  });
});

describe("fetchImage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("decodes a png response into rgba pixels", async () => {
    const png = await new Jimp({ width: 4, height: 2, color: 0xff0000ff }).getBuffer("image/png");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(png), { status: 200 })));
    const image = await fetchImage("https://example.com/a.png");
    expect([image.width, image.height]).toEqual([4, 2]);
    expect([...image.data.slice(0, 4)]).toEqual([255, 0, 0, 255]);
  });

  it("throws on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    await expect(fetchImage("https://example.com/missing.png")).rejects.toThrow(/404/);
  });
});
