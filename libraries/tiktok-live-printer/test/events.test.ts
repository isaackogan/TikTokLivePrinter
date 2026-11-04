import { describe, expect, it } from "vitest";
import { giftDiamonds, giftTotal, isGiftComplete, isJoin, socialKind } from "../src/events.ts";

const gift = (over: object) => ({ gift: { type: 1, diamondCount: 5 }, repeatCount: 3, repeatEnd: 0, ...over }) as never;
const social = (over: object) => ({ action: "", followType: 0, shareType: "", common: { displayText: { key: "" } }, ...over }) as never;

describe("gift helpers", () => {
  it("a streakable gift mid-streak is not complete", () => {
    expect(isGiftComplete(gift({}))).toBe(false);
  });

  it("a streakable gift with repeatEnd is complete", () => {
    expect(isGiftComplete(gift({ repeatEnd: 1 }))).toBe(true);
  });

  it("a non-streakable gift is complete immediately", () => {
    expect(isGiftComplete(gift({ gift: { type: 2, diamondCount: 5 } }))).toBe(true);
  });

  it("giftTotal is at least one", () => {
    expect(giftTotal(gift({ repeatCount: 0 }))).toBe(1);
    expect(giftTotal(gift({ repeatCount: 3 }))).toBe(3);
  });

  it("giftDiamonds multiplies the diamond value by the total", () => {
    expect(giftDiamonds(gift({ repeatCount: 3 }))).toBe(15);
  });
});

describe("member and social helpers", () => {
  it("isJoin is true only for the enter action", () => {
    expect(isJoin({ action: 1 } as never)).toBe(true);
    expect(isJoin({ action: 2 } as never)).toBe(false);
  });

  it("socialKind detects follows by followType or display text key", () => {
    expect(socialKind(social({ followType: 1 }))).toBe("follow");
    expect(socialKind(social({ common: { displayText: { key: "pm_main_follow_message_viewer_2" } } }))).toBe("follow");
  });

  it("socialKind detects shares by shareType or display text key", () => {
    expect(socialKind(social({ shareType: "1" }))).toBe("share");
    expect(socialKind(social({ common: { displayText: { key: "pm_mt_guidance_share" } } }))).toBe("share");
  });

  it("socialKind is undefined for anything else", () => {
    expect(socialKind(social({}))).toBeUndefined();
  });
});

describe("omitted fields", () => {
  it("giftTotal treats a missing repeatCount as one", () => {
    expect(giftTotal({ gift: { type: 1, diamondCount: 1 } } as never)).toBe(1);
  });

  it("socialKind is undefined when shareType and followType are omitted", () => {
    expect(socialKind({ common: {} } as never)).toBeUndefined();
  });
});
