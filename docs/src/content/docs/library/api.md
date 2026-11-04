---
title: API reference
description: "Reference for the tiktok-live-printer npm package: TikTokPrinterClient, PrinterEngine, transports, print items, media and event helpers."
sidebar:
  order: 5
---

## `TikTokPrinterClient`

```ts
new TikTokPrinterClient({
  uniqueId: string;          // creator handle, with or without @
  apiKey?: string;           // Euler Stream API key (required in practice)
  jwtKey?: string;           // alternative to apiKey
  printer: PrinterEngine;
  voice?: VoiceEngine;       // defaults to the OS speech tool
  sound?: SoundEngine;       // defaults to the OS player
  wsUrl?: string;            // override the WebSocket host
})
```

| Member | Description |
| --- | --- |
| `connect(): Promise<void>` | Opens the WebSocket; resolves on open, rejects if it closes first |
| `disconnect(): void` | Closes the socket |
| `queue(...items): Promise<void>` | Prints the items as one job |
| `text()`, `image()`, `voice()`, `sound()` | One-item shortcuts |
| `handleFrame(raw: string): void` | Feeds a raw JSON frame, useful for tests |
| `printer` | The engine passed in |
| `url` | The WebSocket URL that will be used |

## `PrinterEngine`

`PrinterEngine.usb(opts)`, `.spooler(opts)`, `.network(opts)`, `.console(opts)` or `new PrinterEngine(transport, opts)`. Options: `width: 384 | 576`, `imageGamma: number`.

| Member | Description |
| --- | --- |
| `encode(items): Uint8Array` | ESC/POS bytes for a job |
| `print(items): Promise<void>` | Encodes and writes one job |
| `close(): Promise<void>` | Releases the transport |
| `width`, `columns`, `imageGamma` | Effective settings |

## Transports

`ConsoleTransport`, `MemoryTransport` (keeps chunks in memory for tests), `NetworkTransport(host, port)`, `UsbTransport({ vendorId?, productId? })`, `SpoolerTransport({ queue? })`. Discovery: `listUsbPrinters()`, `listSpoolerQueues()`.

## Items

`Text(content, style)`, `Image(image, width?)`, `Line()`, `Feed(lines)`, `Cut()`, `Voice(text)`, `Sound(path)`. Types: `PrintItem`, `TextStyle`, `RgbaImage`.

## Media

`fetchImage(url, { timeoutMs? })`, `pickImageUrl(image)`, `avatarUrl(user)`, `giftImageUrl(gift)`, `lighten(image, gamma)`.

## Event helpers

`isGiftComplete(msg)`, `giftTotal(msg)`, `giftDiamonds(msg)`, `isJoin(msg)`, `socialKind(msg)`. Types: `WebcastEventMap`, `WebcastEventName`, `ClientEvents`.

## Engines

`VoiceEngine.speak(text)` and `SoundEngine.play(path)` shell out to the OS and resolve when the tool exits; a missing tool is ignored.
