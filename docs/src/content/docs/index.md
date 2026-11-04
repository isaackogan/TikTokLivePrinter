---
title: Overview
description: "Print TikTok LIVE gifts, follows and comments to a thermal receipt printer with the no-code TikTok Live Printer app or the tiktok-live-printer Node.js library."
head:
  - tag: title
    content: "TikTok Live Printer: Print TikTok LIVE Gifts to a Thermal Receipt Printer"
---

TikTok Live Printer turns TikTok LIVE events into paper. A viewer sends a gift, follows, shares, comments or likes, and a receipt comes out of a thermal printer with their avatar, their `@username` and a line like `THANKS FOR 1 X Rose`. It is the TypeScript successor to the original Python TikTokPrinter.

There are two ways to use it. Pick one; each section of these docs stands on its own.

| | Best for | Start |
| --- | --- | --- |
| **The app** | Streamers. One file to download, no code, drag-and-drop receipts. | [Install the app](/app/install/) |
| **The library** | Developers. `npm install tiktok-live-printer` and build your own printer, overlay or alert in Node.js. | [Library getting started](/library/getting-started/) |

## How it works

LIVE events arrive over the [Euler Stream WebSocket API](https://www.eulerstream.com/websockets), the same managed TikTok LIVE WebSocket service behind TikTokLive. You need an [Euler Stream API key](https://www.eulerstream.com/) for either path. The library turns events into ESC/POS commands and sends them to the printer over USB, the system print spooler or TCP; the app wraps the library in a local web UI.

## What you can print

- **Gift receipts** with the sender's profile picture, gift name and streak count
- **Follow, share, join and subscribe** notifications
- **Comments** as a running paper chat log
- **Like milestones**, every N likes from a viewer
- Text to speech alongside any receipt

## Supported printers

Any ESC/POS thermal receipt printer: 58 mm (384 dots) and 80 mm (576 dots) rolls, over USB, network (port 9100) or the printer driver already installed on Windows. Tested with a generic POS58 USB printer on macOS. See [printers](/app/printers/) for the app or [printer engines](/library/printers/) for the library.

## Community and support

Source, issues and releases live on [GitHub](https://github.com/isaackogan/TikTokPrinter). Questions about the WebSocket service go to [Euler Stream support](https://www.eulerstream.com/discord). This is an unofficial project and is not affiliated with TikTok or ByteDance.
