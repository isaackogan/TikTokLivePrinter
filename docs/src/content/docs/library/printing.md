---
title: Printing
description: "Queue text, images, lines, feeds, cuts, voice and sound with tiktok-live-printer so each TikTok LIVE event prints as one uninterrupted receipt."
sidebar:
  order: 3
---

Everything printed goes through `client.queue(...items)`. One call is one job, and jobs run strictly one after another: items from another event never land in the middle of yours, and receipts print in the order events arrived.

## Items

| Item | Prints |
| --- | --- |
| `Text(content, { bold?, align?, size? })` | A line of text, word-wrapped to the paper. `size: 2` doubles it. |
| `Image(image, width?)` | A dithered raster image, centred. `width` in dots, clamped to the paper. |
| `Line()` | A rule across the paper. |
| `Feed(lines)` | Blank lines. |
| `Cut()` | Partial cut. |
| `Voice(text)` | Text to speech through the OS (`say` on macOS, PowerShell on Windows, `espeak` on Linux). |
| `Sound(path)` | Plays a sound file (`afplay`, PowerShell, `aplay`). |

`client.text()`, `client.image()`, `client.voice()` and `client.sound()` queue a single item.

## Images

`fetchImage(url)` downloads and decodes a JPEG or PNG into `{ width, height, data }` RGBA pixels. `avatarUrl(user)` and `giftImageUrl(gift)` pick a decodable URL from a TikTok image: TikTok lists a JPEG variant beside each WebP avatar, so WebP decoding is not needed. Images are resized to the requested width, lightened with the engine's `imageGamma`, and dithered with the Atkinson algorithm.

```ts
const url = avatarUrl(msg.user);
if (url) await client.image(await fetchImage(url), 200);
```

## Encoding without a printer

`engine.encode(items)` returns the ESC/POS bytes for a job without sending them, which is handy for tests and for transports you write yourself.
