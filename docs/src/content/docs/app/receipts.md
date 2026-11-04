---
title: Receipts and blocks
description: "Build TikTok LIVE gift receipts by dragging blocks: avatar, gift image, text with placeholders, lines, feeds, cuts and text to speech, with filters per event."
sidebar:
  order: 3
---

A receipt is a list of blocks printed top to bottom whenever its event happens. Each receipt has an on/off switch, filters, and the blocks you drag into order.

## Events

| Receipt | Fires when |
| --- | --- |
| Gift | a gift is sent. Streakable gifts fire once, at the end of the streak, with the total count. |
| Follow | a viewer follows the creator |
| Share | a viewer shares the LIVE |
| Like | a viewer sends likes (see the *every N likes* filter) |
| Comment | a viewer comments |
| Join | a viewer enters the room |
| Subscribe | a viewer subscribes |

Click **Add receipt**, choose the event, and build it. Several receipts can listen to the same event.

## Blocks

| Block | Prints |
| --- | --- |
| Avatar | the viewer's profile picture, dithered for thermal paper, at the width you set (dots) |
| Gift image | the gift's icon (gift receipts only) |
| Text | a line of text with placeholders; bold, left/center/right, normal or large |
| Line | a rule across the paper |
| Blank lines | empty lines, useful as spacing between receipts |
| Cut | a partial cut, on printers with a cutter |
| Voice | reads the text out loud through your computer's speech synthesizer |

Drag the handle on the left of a block to reorder; the `x` removes it.

## Placeholders

Use these inside Text and Voice blocks:

| Placeholder | Value |
| --- | --- |
| `{username}` | the viewer's `@` handle |
| `{nickname}` | the viewer's display name |
| `{gift}` | gift name |
| `{count}` | how many of the gift were sent |
| `{diamonds}` | total diamond value of the gift |
| `{comment}` | the comment text |
| `{likes}` | the viewer's running like total |

Example: `THANKS FOR {count} X {gift}` prints `THANKS FOR 3 X Rose`.

## Filters

- **Gift:** *Minimum diamonds* skips small gifts; *Only these gifts* restricts to a comma-separated list of gift names (case does not matter).
- **Like:** *Print every N likes* prints once each time a viewer's total crosses a multiple of N, instead of on every like message.

## Paper width and images

Receipts are laid out for the paper width chosen under Printer: 58 mm is 384 dots wide, 80 mm is 576. Image widths above the paper width are clamped. Profile pictures are lightened before printing because thermal paper swallows midtones.
