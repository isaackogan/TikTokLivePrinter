import { type Block, newBlock, textBlock } from "@tiktok-live-printer/config";
import { describe, expect, it } from "vitest";
import { renderBlocks } from "../src/session/render.ts";
import type { TriggerMatch } from "../src/session/context.ts";

const match: TriggerMatch = { event: "gift", ctx: { username: "king", nickname: "King", gift: "Rose", count: 2, diamonds: 2, comment: "", likes: 0 }, avatarUrl: "https://cdn/a.jpeg" };
const image = { width: 8, height: 8, data: new Uint8ClampedArray(8 * 8 * 4) };

describe("renderBlocks", () => {
  it("skips an avatar whose fetch fails and still renders the text", async () => {
    const items = await renderBlocks([newBlock("avatar"), textBlock("THANKS FOR {count} X {gift}")], match, async () => {
      throw new Error("offline");
    });
    expect(items).toEqual([{ type: "text", content: "THANKS FOR 2 X Rose", style: { bold: false, align: "center", size: 1 } }]);
  });

  it("renders images, voice and pass-through blocks", async () => {
    const items = await renderBlocks([newBlock("avatar"), newBlock("giftImage"), { ...newBlock("voice"), template: "thanks {username}" } as Block, newBlock("line"), newBlock("feed"), newBlock("cut")], match, async () => image);
    expect(items.map((i) => i.type)).toEqual(["image", "voice", "line", "feed", "cut"]);
    expect(items[0]).toMatchObject({ type: "image", width: 160 });
    expect(items[1]).toEqual({ type: "voice", content: "thanks king" });
  });
});
