---
title: Set up and run
description: "Connect the TikTok Live Printer app to a creator's LIVE with an Euler Stream API key, pick the printer, test print and start printing receipts."
sidebar:
  order: 2
---

The page has three panes on the left (Connection, Printer, Run) and your receipts on the right.

## 1. Connection

- **TikTok username:** the creator whose LIVE you print, with or without the `@`. The creator must be live when you start.
- **Euler Stream API key:** required. Create one at [eulerstream.com](https://www.eulerstream.com/). The key is stored only in your browser.

## 2. Printer

Leave the connection on **Automatic** and click **Test print**. A short receipt should come out. If nothing happens, see [printers](/app/printers/) to pick the connection by hand.

## 3. Receipts

The default receipt prints the sender's avatar, `@username` and `THANKS FOR 1 X Rose` for every gift. Add receipts for follows, shares, likes, comments, joins and subscriptions, and change what each one prints. See [receipts](/app/receipts/).

## 4. Run

Click **Start printing**. The badge turns `connected` and the log lists every event that printed. **Stop** ends the session. A status such as `disconnected: The specified user is not currently live (4404)` tells you why a session ended.

## Back up or share your setup

Your configuration is saved in the browser. **Export** downloads it as a JSON file; **Import** loads one back. Import refuses files that are not a valid configuration and keeps your current setup. Use this before clearing browser data, when moving to another computer, or to share a layout with another streamer.
