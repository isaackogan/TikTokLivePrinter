# tiktok-live-printer

Build TikTok LIVE thermal receipt printers in TypeScript. Gifts, follows, comments and likes come in over the [Euler Stream](https://www.eulerstream.com) WebSocket service; the library turns them into ESC/POS receipts on a USB, network or spooler printer.

Looking for the no-code version? The [TikTok Live Printer app](../../apps/tiktok-live-printer) wraps this library in a drag-and-drop UI and ships as a single binary.

## Install

```bash
npm install tiktok-live-printer
```

Node 22+ or Bun. You need an Euler Stream API key: the WebSocket closes with code 4400 without one. Get one at [eulerstream.com](https://www.eulerstream.com).

## Quick start

```ts
import { Cut, Feed, Image, Line, PrinterEngine, Text, TikTokPrinterClient, avatarUrl, fetchImage, giftTotal, isGiftComplete } from "tiktok-live-printer";

const client = new TikTokPrinterClient({
  uniqueId: "@someone",
  apiKey: process.env.EULER_API_KEY,
  printer: PrinterEngine.usb(),
});

client.on("WebcastGiftMessage", async (msg) => {
  if (!isGiftComplete(msg)) return;
  const avatar = await fetchImage(avatarUrl(msg.user)!).catch(() => undefined);
  await client.queue(
    ...(avatar ? [Image(avatar, 160)] : []),
    Text(`@${msg.user?.displayId}`, { bold: true, align: "center" }),
    Text(`THANKS FOR ${giftTotal(msg)} X ${msg.gift?.name}`, { align: "center" }),
    Line(),
    Feed(2),
    Cut(),
  );
});

await client.connect();
```

See [`examples/gift-receipt.ts`](examples/gift-receipt.ts).

## Printers

| Engine | Use it when | Notes |
| --- | --- | --- |
| `PrinterEngine.usb({ vendorId?, productId? })` | macOS, Linux, a printer on a USB cable | No driver needed. Omit the ids to use the first printer-class device. Linux may need a udev rule granting your user access. |
| `PrinterEngine.spooler({ queue? })` | Windows, or any printer already installed in the OS | Sends raw ESC/POS through the vendor's driver (winspool / CUPS). Needs the optional dependency `@printers/printers`. |
| `PrinterEngine.network({ host, port = 9100 })` | Ethernet / Wi-Fi printers | Plain TCP. |
| `PrinterEngine.console()` | Development | Logs the text of each job. |

Every engine takes `width: 384` (58 mm, default) or `width: 576` (80 mm). `listUsbPrinters()` and `listSpoolerQueues()` enumerate what is attached.

Windows users: do not replace the vendor driver with WinUSB (Zadig). Use the spooler engine with the printer's own driver.

## Printing

Everything printed goes through `client.queue(...items)`. One call is one job: items from another event never land between yours.

| Item | What it does |
| --- | --- |
| `Text(content, { bold?, align?, size? })` | A line of text, word-wrapped to the paper. `size: 2` doubles it. |
| `Image(image, width?)` | A dithered raster image, centred. `width` in dots. |
| `Line()` | A rule across the paper. |
| `Feed(lines)` | Blank lines. |
| `Cut()` | Partial cut. |
| `Voice(text)` | Text to speech through the OS (`say`, PowerShell, `espeak`). |
| `Sound(path)` | Plays a sound file (`afplay`, PowerShell, `aplay`). |

`client.text()`, `client.image()`, `client.voice()` and `client.sound()` are one-item shortcuts.

## Events

`client.on(name, listener)` with any schema v3 event name. The common ones are typed:

```ts
client.on("WebcastChatMessage", (m) => console.log(m.user?.displayId, m.content));
client.on("WebcastLikeMessage", (m) => console.log(m.count));
client.on("WebcastSocialMessage", (m) => console.log(socialKind(m))); // "follow" | "share"
client.on("WebcastMemberMessage", (m) => isJoin(m) && console.log("joined"));
client.on("WebcastSubNotifyMessage", (m) => console.log("subscribed"));
client.on("room.status", (s) => console.log(s.state));
client.on("connected" | "disconnected" | "error", ...);
```

Helpers: `isGiftComplete(msg)` (true once a streak has finished), `giftTotal(msg)`, `giftDiamonds(msg)`, `avatarUrl(user)`, `giftImageUrl(gift)`, `fetchImage(url)`.

## Images

`fetchImage(url)` decodes JPEG and PNG. TikTok lists a JPEG variant next to each WebP avatar and `avatarUrl` prefers it, so WebP decoding is not needed.

## License

Modified MIT: the standard MIT grant with an Excluded Party Restriction covering tik.tools and its owners, operators and affiliates. See [LICENSE](LICENSE).
