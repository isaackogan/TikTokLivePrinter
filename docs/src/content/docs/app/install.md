---
title: Install the app
description: "Download the TikTok Live Printer app for macOS, Windows or Linux and open the local web UI that drives your receipt printer."
sidebar:
  order: 1
---

The app is a single file. It starts a small server on your computer and opens a page in your browser; nothing leaves your machine except the connection to [Euler Stream](https://www.eulerstream.com/), which delivers the LIVE events.

## Download

Get the file for your computer from the [latest GitHub release](https://github.com/isaackogan/TikTokPrinter/releases):

| File | Computer |
| --- | --- |
| `tiktok-live-printer-darwin-arm64` | Mac with Apple Silicon (M1 or newer) |
| `tiktok-live-printer-darwin-x64` | Mac with an Intel chip |
| `tiktok-live-printer-windows-x64.exe` | Windows 10 or 11, 64-bit |
| `tiktok-live-printer-linux-x64` | Linux, 64-bit |

## Run it

Double-click the file (on macOS and Linux, make it executable first with `chmod +x` if your browser removed the flag). The app prints `TikTok Live Printer is running at http://127.0.0.1:7474` and opens that page. If the browser does not open, visit the address yourself.

Plug in the printer and continue with [setup](/app/setup/).

## First run on macOS

macOS blocks apps from unidentified developers the first time. Right-click the file, choose **Open**, then **Open** again in the dialog. You only do this once.

## Keep it running

The page works as long as the app process runs. Closing the terminal window stops it; closing the browser tab does not. Reopen `http://127.0.0.1:7474` to get back to the page.
