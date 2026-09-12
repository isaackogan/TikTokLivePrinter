import type { TemplateContext, Trigger, TriggerEvent } from "@tiktok-live-printer/config";
import { type WebcastEventMap, avatarUrl, giftDiamonds, giftImageUrl, giftTotal, isGiftComplete, isJoin, socialKind } from "tiktok-live-printer";

type WebcastGiftMessage = WebcastEventMap["WebcastGiftMessage"];
type WebcastChatMessage = WebcastEventMap["WebcastChatMessage"];
type WebcastLikeMessage = WebcastEventMap["WebcastLikeMessage"];
type WebcastSocialMessage = WebcastEventMap["WebcastSocialMessage"];
type WebcastMemberMessage = WebcastEventMap["WebcastMemberMessage"];
type WebcastSubNotifyMessage = WebcastEventMap["WebcastSubNotifyMessage"];

export type TriggerMatch = { event: TriggerEvent; ctx: TemplateContext; avatarUrl?: string; giftImageUrl?: string };

type WithUser = { user?: WebcastGiftMessage["user"] };

function base(msg: WithUser): TemplateContext {
  return { username: msg.user?.displayId ?? "", nickname: msg.user?.nickname ?? "", gift: "", count: 0, diamonds: 0, comment: "", likes: 0 };
}

function match(event: TriggerEvent, msg: WithUser, ctx: Partial<TemplateContext> = {}, extra: Partial<TriggerMatch> = {}): TriggerMatch {
  return { event, ctx: { ...base(msg), ...ctx }, avatarUrl: avatarUrl(msg.user), ...extra };
}

/** Turns a raw v3 event into the trigger event it represents, or undefined when it is none of ours. */
export function matchEvent(type: string, data: unknown, likeTotals: Map<string, number>): TriggerMatch | undefined {
  switch (type) {
    case "WebcastGiftMessage": {
      const msg = data as WebcastGiftMessage;
      if (!isGiftComplete(msg)) return undefined;
      return match("gift", msg, { gift: msg.gift?.name ?? "", count: giftTotal(msg), diamonds: giftDiamonds(msg) }, { giftImageUrl: giftImageUrl(msg.gift) });
    }
    case "WebcastChatMessage": {
      const msg = data as WebcastChatMessage;
      return match("comment", msg, { comment: msg.content });
    }
    case "WebcastLikeMessage": {
      const msg = data as WebcastLikeMessage;
      const key = msg.user?.displayId ?? "";
      const likes = (likeTotals.get(key) ?? 0) + (msg.count ?? 0);
      likeTotals.set(key, likes);
      return match("like", msg, { likes });
    }
    case "WebcastSocialMessage": {
      const msg = data as WebcastSocialMessage;
      const kind = socialKind(msg);
      return kind ? match(kind, msg) : undefined;
    }
    case "WebcastMemberMessage": {
      const msg = data as WebcastMemberMessage;
      return isJoin(msg) ? match("join", msg) : undefined;
    }
    case "WebcastSubNotifyMessage":
      return match("subscribe", data as WebcastSubNotifyMessage);
    default:
      return undefined;
  }
}

/** `prevLikes` is the viewer's total before this event, so `likeEvery` fires once per multiple crossed. */
export function passesFilter(trigger: Trigger, match: Pick<TriggerMatch, "event" | "ctx">, prevLikes: number): boolean {
  const { minDiamonds, giftNames, likeEvery } = trigger.filter;
  if (minDiamonds !== undefined && match.ctx.diamonds < minDiamonds) return false;
  if (giftNames?.length && !giftNames.some((n) => n.toLowerCase() === match.ctx.gift.toLowerCase())) return false;
  if (likeEvery !== undefined && Math.floor(match.ctx.likes / likeEvery) <= Math.floor(prevLikes / likeEvery)) return false;
  return true;
}
