---
title: Getting started
description: "Install the tiktok-live-printer npm package and print a TikTok LIVE gift receipt from Node.js in a few lines using the Euler Stream WebSocket."
sidebar:
  order: 1
---

`tiktok-live-printer` is a TypeScript library for building TikTok LIVE thermal printers. It receives LIVE events from the [Euler Stream WebSocket API](https://www.eulerstream.com/websockets) (protobuf schema v3), queues print jobs so receipts never interleave, and encodes text and images to ESC/POS for USB, spooler, network or console printers.

## Requirements

- Node.js 22 or newer, or Bun. The library uses the global `WebSocket`.
- An [Euler Stream API key](https://www.eulerstream.com/). The WebSocket closes with code 4400 without one.
- An ESC/POS receipt printer, or none while you develop (`PrinterEngine.console()`).

## Install

```sh
npm install tiktok-live-printer
```

## Print a gift receipt

```ts
import { Cut, Feed, Image, Line, PrinterEngine, Text, TikTokPrinterClient, avatarUrl, fetchImage, giftTotal, isGiftComplete } from "tiktok-live-printer";

const client = new TikTokPrinterClient({
  uniqueId: "@creator",
  apiKey: process.env.EULER_API_KEY,
  printer: PrinterEngine.usb(),
});

client.on("WebcastGiftMessage", async (msg) => {
  if (!isGiftComplete(msg)) return;

  const url = avatarUrl(msg.user);
  const avatar = url ? await fetchImage(url).catch(() => undefined) : undefined;

  await client.queue(
    ...(avatar ? [Image(avatar, 160)] : []),
    Text(`@${msg.user?.displayId}`, { bold: true, align: "center" }),
    Text(`THANKS FOR ${giftTotal(msg)} X ${msg.gift?.name}`, { align: "center" }),
    Line(),
    Feed(2),
    Cut(),
  );
});

client.on("disconnected", ({ code, reason }) => console.log(`disconnected (${code}): ${reason}`));

await client.connect();
```

`connect()` resolves when the socket opens and the creator is live. `disconnected` fires with the server's close code and message when the stream ends, the key is missing, or the creator is not live. Register listeners before connecting.

Next: [printer engines](/library/printers/), [printing](/library/printing/), [events](/library/events/).
