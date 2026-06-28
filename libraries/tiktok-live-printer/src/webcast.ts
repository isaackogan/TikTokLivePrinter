import type { CustomData } from "@eulerstream/euler-websocket-sdk";
import type * as V3 from "@eulerstream/euler-websocket-sdk/v3";

/**
 * The schema v3 events this library types on the client. The proto package exports
 * interfaces only, so the list is spelled out; unlisted events still arrive and can be
 * subscribed to with a cast.
 */
export type WebcastEventMap = {
  WebcastGiftMessage: V3.WebcastGiftMessage;
  WebcastChatMessage: V3.WebcastChatMessage;
  WebcastLikeMessage: V3.WebcastLikeMessage;
  WebcastSocialMessage: V3.WebcastSocialMessage;
  WebcastMemberMessage: V3.WebcastMemberMessage;
  WebcastSubNotifyMessage: V3.WebcastSubNotifyMessage;
  WebcastRoomUserSeqMessage: V3.WebcastRoomUserSeqMessage;
  WebcastRoomMessage: V3.WebcastRoomMessage;
  WebcastRoomPinMessage: V3.WebcastRoomPinMessage;
  WebcastLiveIntroMessage: V3.WebcastLiveIntroMessage;
  WebcastControlMessage: V3.WebcastControlMessage;
  WebcastEmoteChatMessage: V3.WebcastEmoteChatMessage;
  WebcastEnvelopeMessage: V3.WebcastEnvelopeMessage;
  WebcastBarrageMessage: V3.WebcastBarrageMessage;
  WebcastGoalUpdateMessage: V3.WebcastGoalUpdateMessage;
  WebcastLinkMicBattle: V3.WebcastLinkMicBattle;
  WebcastLinkMicArmies: V3.WebcastLinkMicArmies;
  WebcastLinkMessage: V3.WebcastLinkMessage;
  WebcastPollMessage: V3.WebcastPollMessage;
  WebcastQuestionNewMessage: V3.WebcastQuestionNewMessage;
  WebcastRankUpdateMessage: V3.WebcastRankUpdateMessage;
  WebcastRankTextMessage: V3.WebcastRankTextMessage;
  WebcastUnauthorizedMemberMessage: V3.WebcastUnauthorizedMemberMessage;
};

export type WebcastEventName = keyof WebcastEventMap;

export type WebcastEvents = { [K in WebcastEventName]: (msg: WebcastEventMap[K]) => void };

/** Euler Stream's own events (room status, presence, worker info) keyed by their `type`. */
export type EulerEvents = { [C in CustomData as C["type"]]: (data: C["data"]) => void };
