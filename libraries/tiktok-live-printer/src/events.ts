import type { MemberMessageAction, WebcastGiftMessage, type WebcastMemberMessage, type WebcastSocialMessage } from "@eulerstream/euler-websocket-sdk/v3";

const STREAKABLE = 1;
// The schema package ships enums as types only, so the value is spelled out here.
const ENTER = 1 satisfies MemberMessageAction;

/** Streakable gifts arrive once per tap; only the last message of a streak carries the final count. */
export function isGiftComplete(msg: WebcastGiftMessage): boolean {
  return msg.gift?.type !== STREAKABLE || msg.repeatEnd === 1;
}

export function giftTotal(msg: WebcastGiftMessage): number {
  return Math.max(msg.repeatCount, 1);
}

export function giftDiamonds(msg: WebcastGiftMessage): number {
  return (msg.gift?.diamondCount ?? 0) * giftTotal(msg);
}

export function isJoin(msg: WebcastMemberMessage): boolean {
  return msg.action === ENTER;
}

export function socialKind(msg: WebcastSocialMessage): "follow" | "share" | undefined {
  const key = msg.common?.displayText?.key ?? "";
  if (msg.followType > 0 || key.includes("follow")) return "follow";
  if (msg.shareType !== "" || key.includes("share")) return "share";
  return undefined;
}
