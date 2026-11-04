---
title: Events
description: "Listen to TikTok LIVE gifts, comments, likes, follows, shares, joins and subscriptions in tiktok-live-printer, with helpers for gift streaks and image URLs."
sidebar:
  order: 4
---

`TikTokPrinterClient` is an event emitter keyed by the Euler Stream schema v3 message names. Listen with `client.on(name, listener)`.

## Typed events

| Event | Payload | Meaning |
| --- | --- | --- |
| `WebcastGiftMessage` | `user`, `gift.{name, diamondCount, type}`, `repeatCount`, `repeatEnd` | A gift was sent (see streaks below) |
| `WebcastChatMessage` | `user`, `content` | A comment |
| `WebcastLikeMessage` | `user`, `count` | Likes from a viewer |
| `WebcastSocialMessage` | `user`, `followType`, `shareType` | Follow or share; use `socialKind()` |
| `WebcastMemberMessage` | `user`, `action` | Room membership; `isJoin()` is true for joins |
| `WebcastSubNotifyMessage` | `user`, `subMonth` | A subscription |
| `WebcastRoomUserSeqMessage` | viewer counts | Current viewer count |
| `WebcastControlMessage`, `WebcastLiveIntroMessage`, `WebcastEnvelopeMessage`, `WebcastLinkMicBattle`, `WebcastPollMessage`, `WebcastQuestionNewMessage`, `WebcastRankUpdateMessage` and more | | See `WebcastEventMap` for the full typed list |

Unlisted schema v3 events still arrive; subscribe with a cast on the name. Euler Stream's own events (`room.status`, `roomInfo`, `workerInfo`) are typed too.

## Client events

| Event | Payload |
| --- | --- |
| `connected` | none |
| `disconnected` | `{ code, reason }`, for example `4404` "Streamer is not live", `4400` missing API key |
| `error` | `Error` |

## Gift streaks

Streakable gifts (`gift.type === 1`) send one message per tap while the viewer holds the button. Only the last one has `repeatEnd === 1`, and its `repeatCount` is the total.

```ts
import { giftDiamonds, giftTotal, isGiftComplete } from "tiktok-live-printer";

client.on("WebcastGiftMessage", (msg) => {
  if (!isGiftComplete(msg)) return;        // wait for the streak to end
  console.log(giftTotal(msg), giftDiamonds(msg));
});
```

## Follows, shares, joins

```ts
import { isJoin, socialKind } from "tiktok-live-printer";

client.on("WebcastSocialMessage", (msg) => console.log(socialKind(msg)));  // "follow" | "share" | undefined
client.on("WebcastMemberMessage", (msg) => isJoin(msg) && console.log("joined"));
```
