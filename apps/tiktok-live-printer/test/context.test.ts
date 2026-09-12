import { newTrigger } from "@tiktok-live-printer/config";
import { describe, expect, it } from "vitest";
import { matchEvent, passesFilter } from "../src/session/context.ts";

const user = { displayId: "kingsaab7868", nickname: "King", avatarThumb: { urlList: ["https://cdn/x.jpeg"] } };
const gift = (over: object) => ({ user, gift: { name: "Rose", type: 1, diamondCount: 1, image: { urlList: ["https://cdn/rose.png"] } }, repeatCount: 2, repeatEnd: 0, ...over });

describe("matchEvent", () => {
  it("ignores a gift mid-streak", () => {
    expect(matchEvent("WebcastGiftMessage", gift({}), new Map())).toBeUndefined();
  });

  it("maps a complete gift with count, diamonds and image urls", () => {
    const match = matchEvent("WebcastGiftMessage", gift({ repeatEnd: 1, repeatCount: 3 }), new Map());
    expect(match).toMatchObject({ event: "gift", avatarUrl: "https://cdn/x.jpeg", giftImageUrl: "https://cdn/rose.png" });
    expect(match?.ctx).toMatchObject({ username: "kingsaab7868", nickname: "King", gift: "Rose", count: 3, diamonds: 3 });
  });

  it("maps a comment", () => {
    expect(matchEvent("WebcastChatMessage", { user, content: "hello" }, new Map())?.ctx).toMatchObject({ comment: "hello" });
  });

  it("accumulates likes per viewer", () => {
    const totals = new Map<string, number>();
    matchEvent("WebcastLikeMessage", { user, count: 10 }, totals);
    const second = matchEvent("WebcastLikeMessage", { user, count: 5 }, totals);
    expect(second?.ctx.likes).toBe(15);
  });

  it("maps follow, share, join and subscribe", () => {
    expect(matchEvent("WebcastSocialMessage", { user, followType: 1, shareType: "", common: {} }, new Map())?.event).toBe("follow");
    expect(matchEvent("WebcastSocialMessage", { user, followType: 0, shareType: "1", common: {} }, new Map())?.event).toBe("share");
    expect(matchEvent("WebcastMemberMessage", { user, action: 1 }, new Map())?.event).toBe("join");
    expect(matchEvent("WebcastMemberMessage", { user, action: 2 }, new Map())).toBeUndefined();
    expect(matchEvent("WebcastSubNotifyMessage", { user }, new Map())?.event).toBe("subscribe");
  });

  it("ignores unrelated events", () => {
    expect(matchEvent("WebcastRoomUserSeqMessage", {}, new Map())).toBeUndefined();
  });
});

describe("passesFilter", () => {
  const match = matchEvent("WebcastGiftMessage", gift({ repeatEnd: 1, repeatCount: 3 }), new Map())!;

  it("applies minDiamonds", () => {
    expect(passesFilter({ ...newTrigger("gift"), filter: { minDiamonds: 3 } }, match, 0)).toBe(true);
    expect(passesFilter({ ...newTrigger("gift"), filter: { minDiamonds: 4 } }, match, 0)).toBe(false);
  });

  it("applies giftNames case-insensitively", () => {
    expect(passesFilter({ ...newTrigger("gift"), filter: { giftNames: ["rose"] } }, match, 0)).toBe(true);
    expect(passesFilter({ ...newTrigger("gift"), filter: { giftNames: ["Galaxy"] } }, match, 0)).toBe(false);
  });

  it("applies likeEvery only when a multiple is crossed", () => {
    const likes = (n: number) => ({ event: "like" as const, ctx: { ...match.ctx, likes: n } });
    const trigger = { ...newTrigger("like"), filter: { likeEvery: 10 } };
    expect(passesFilter(trigger, likes(12), 8)).toBe(true);
    expect(passesFilter(trigger, likes(18), 12)).toBe(false);
    expect(passesFilter({ ...newTrigger("like"), filter: {} }, likes(1), 0)).toBe(true);
  });
});
