---
title: Troubleshooting
description: "Fix common TikTok Live Printer problems: nothing prints, the creator is not live, missing API key, blocked app on macOS, USB permission on Linux, busy port."
sidebar:
  order: 5
---

## Status says "Must provide either apiKey or jwtKey"

Add your [Euler Stream](https://www.eulerstream.com/) API key under Connection.

## Status says "The specified user is not currently live"

The creator must be live before you click Start. Wait for the LIVE to begin and start again.

## Test print does nothing over USB

- Make sure the printer is on, has paper, and shows up in the USB printer list (click the refresh icon).
- On Windows, switch to **System printer**. See [printers](/app/printers/).
- On Linux, add the udev rule from [printers](/app/printers/).
- Try **Console** to confirm the rest of the pipeline works; the receipt text appears in the terminal.

## Receipts print but the avatar is missing

The image could not be fetched or decoded; the rest of the receipt still prints. Check the computer's internet connection. Some avatars are served only as WebP, which is not decoded yet.

## The image is a black square

Thermal paper darkens midtones. Profile pictures are lightened automatically; if an image is still dark, increase the width so the dithering has more dots to work with.

## macOS says the app is from an unidentified developer

Right-click the file, choose Open, then Open again.

## Port 7474 is busy

The app tries the next few ports and prints the one it chose in the terminal. Open that address.

## My configuration disappeared

It is stored in the browser you used. Open the same browser, or import the JSON file you exported.
