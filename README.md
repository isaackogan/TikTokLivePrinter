# TikTok LIVE Gift Printer: Print TikTok LIVE Gifts, Follows and Comments to a Thermal Receipt Printer

TikTok Live Printer is a **TikTok LIVE gift printer** for thermal receipt printers. A viewer sends a gift, follows, shares, comments or likes on a [TikTok LIVE](https://www.tiktok.com/live) stream, and a receipt comes out of a 58 mm or 80 mm ESC/POS printer with their profile picture, their `@username` and a line like `THANKS FOR 1 X Rose`.

It ships two ways: a **no-code desktop app** for streamers (one file for macOS, Windows and Linux, drag-and-drop receipts) and the **`tiktok-live-printer` Node.js library** for developers building their own TikTok LIVE printers, overlays and alerts in TypeScript. Both run on the managed [TikTok LIVE WebSocket API by Euler Stream](https://www.eulerstream.com/websockets).

Full documentation for the app and the library is at [ttlp.docs.isaackogan.com](https://ttlp.docs.isaackogan.com/).

[![tiktok-live-printer on npm](https://img.shields.io/npm/v/tiktok-live-printer?logo=npm&label=tiktok-live-printer)](https://www.npmjs.com/package/tiktok-live-printer)
![Live TikTok LIVE API connections](https://api.eulerstream.com/analytics/pips)
![TikTokPrinter GitHub stars](https://img.shields.io/github/stars/isaackogan/TikTokLivePrinter?style=flat&color=0274b5)
![TikTokPrinter GitHub forks](https://img.shields.io/github/forks/isaackogan/TikTokLivePrinter?style=flat&color=0274b5)
![TikTokPrinter open issues](https://img.shields.io/github/issues/isaackogan/TikTokLivePrinter)

> **Note:** This is an unofficial project, not affiliated with TikTok or ByteDance. LIVE events are delivered by the production [WebSocket API](https://www.eulerstream.com/websockets) from [Euler Stream](https://www.eulerstream.com/); an Euler Stream API key is required.

## What Can You Build With a TikTok LIVE Printer?

- **Gift receipts** for TikTok LIVE streamers, with avatars, gift names and streak counts
- **Follow, share and subscriber alerts** on paper, the thermal-printer trend you see on TikTok LIVE
- **Live chat logs**: every comment printed as it happens
- **Like milestones**, every N likes from a viewer
- **Text-to-speech** thank-yous alongside any receipt
- Your own printer, overlay or analytics tool with the Node.js library

## TikTok LIVE API for Production

<table>
<tr>
    <td><br/><img width="180px" style="border-radius: 10px" alt="Euler Stream TikTok LIVE API logo" src="https://raw.githubusercontent.com/isaackogan/TikTokLive/master/.github/SquareLogo.png"><br/><br/></td>
    <td>
        <a href="https://www.eulerstream.com/">
            <strong>Euler Stream</strong> offers a comprehensive TikTok LIVE API, WebSocket Server, CAPTCHA Solutions and much more!
        </a>
    </td>
</tr>
</table>

## Table of Contents

- [The App (No Code)](#the-app-no-code)
- [The Library (Node.js)](#the-library-nodejs)
    - [Printers](#printers)
    - [Printing](#printing)
    - [Events](#events)
- [Documentation](https://ttlp.docs.isaackogan.com/)
- [Supported Printers and Platforms](#supported-printers-and-platforms)
- [Repository Layout](#repository-layout)
- [Development](#development)
- [FAQ](#frequently-asked-questions)
- [License](#license)
- [Contributors](#contributors)

## The App (No Code)

1. Download the file for your computer from the [latest release](https://github.com/isaackogan/TikTokLivePrinter/releases): `darwin-arm64` (Apple Silicon Mac), `darwin-x64` (Intel Mac), `windows-x64` or `linux-x64`.
2. Run it. It starts a local server at `http://127.0.0.1:7474` and opens the page in your browser. Nothing leaves your machine except the connection to Euler Stream.
3. Enter the creator's TikTok username and your [Euler Stream API key](https://www.eulerstream.com/), pick the printer, click **Test print**.
4. Build receipts by dragging blocks (avatar, gift image, text with `{username}`, `{gift}`, `{count}` placeholders, line, blank lines, cut, voice) and click **Start printing**.

Your configuration is saved in the browser; **Export** and **Import** move it as a JSON file. Read the [app guide](https://ttlp.docs.isaackogan.com/app/install/).

## The Library (Node.js)

Install the TikTok LIVE printer library from [npm](https://www.npmjs.com/package/tiktok-live-printer). Node.js 22+ or Bun.

```sh
npm install tiktok-live-printer
```

Print a receipt for every completed gift:

```ts
import { Cut, Feed, Image, Line, PrinterEngine, Text, TikTokPrinterClient, avatarUrl, fetchImage, giftTotal, isGiftComplete } from "tiktok-live-printer";

const client = new TikTokPrinterClient({
  uniqueId: "@creator",
  apiKey: process.env.EULER_API_KEY,
  printer: PrinterEngine.usb(),
});

client.on("WebcastGiftMessage", async (msg) => {
  if (!isGiftComplete(msg)) return;                       // wait for the streak to finish

  const url = avatarUrl(msg.user);
  const avatar = url ? await fetchImage(url).catch(() => undefined) : undefined;

  await client.queue(                                     // one job: nothing interleaves
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

See [`libraries/tiktok-live-printer/examples`](libraries/tiktok-live-printer/examples) and the [library docs](https://ttlp.docs.isaackogan.com/library/getting-started/).

### Printers

| Engine | Use it when | Notes |
| --- | --- | --- |
| `PrinterEngine.usb({ vendorId?, productId? })` | macOS or Linux, printer on a USB cable | No driver. Omit the ids to use the first printer-class device. |
| `PrinterEngine.spooler({ queue? })` | Windows, or any printer installed in the OS | Raw ESC/POS through the vendor driver (winspool / CUPS). |
| `PrinterEngine.network({ host, port = 9100 })` | Ethernet or Wi-Fi printers | Plain TCP. |
| `PrinterEngine.console()` | Development | Logs the text of each job. |

Every engine takes `width: 384` (58 mm, default) or `576` (80 mm), and `imageGamma` (default `1.6`) which lightens images so avatars do not print black on thermal paper. `listUsbPrinters()` and `listSpoolerQueues()` enumerate what is attached.

### Printing

Everything goes through `client.queue(...items)`: one call is one receipt, and receipts print strictly in event order.

| Item | Prints |
| --- | --- |
| `Text(content, { bold?, align?, size? })` | A line of text, word-wrapped to the paper |
| `Image(image, width?)` | A dithered raster image, centred |
| `Line()`, `Feed(lines)`, `Cut()` | A rule, blank lines, a partial cut |
| `Voice(text)`, `Sound(path)` | Text to speech and sound playback through the OS |

`fetchImage(url)` decodes JPEG and PNG; `avatarUrl(user)` and `giftImageUrl(gift)` pick a decodable URL from a TikTok image.

### Events

`client.on(name, listener)` with any Euler Stream schema v3 event name. The common ones are typed:

```ts
client.on("WebcastChatMessage", (m) => console.log(m.user?.displayId, m.content));
client.on("WebcastLikeMessage", (m) => console.log(m.count));
client.on("WebcastSocialMessage", (m) => console.log(socialKind(m)));   // "follow" | "share"
client.on("WebcastMemberMessage", (m) => isJoin(m) && console.log("joined"));
client.on("WebcastSubNotifyMessage", () => console.log("subscribed"));
client.on("disconnected", ({ code, reason }) => console.log(code, reason)); // 4404 = not live
```

Gift streaks: streakable gifts (`gift.type === 1`) send a message per tap; `isGiftComplete(msg)` is true only for the final one, and `giftTotal(msg)` is the count. The full list is in the [events reference](https://ttlp.docs.isaackogan.com/library/events/).

## Supported Printers and Platforms

Any ESC/POS thermal receipt printer (POS58-style 58 mm USB printers, 80 mm kitchen printers, network receipt printers).

- **macOS and Linux:** direct USB, no driver. Linux needs a udev rule so your user can open the device.
- **Windows:** prints through the printer driver the vendor already installed. Never replace that driver with WinUSB (Zadig).
- **Network printers** work everywhere over TCP port 9100.

## Repository Layout

| Package | Where | What |
| --- | --- | --- |
| `tiktok-live-printer` | [`libraries/tiktok-live-printer`](libraries/tiktok-live-printer) | Public npm library |
| `@tiktok-live-printer/app` | [`apps/tiktok-live-printer`](apps/tiktok-live-printer) | The desktop app, built into one binary with Bun |
| `@tiktok-live-printer/config`, `@tiktok-live-printer/web` | [`packages/tiktok-live-printer`](packages/tiktok-live-printer) | Shared config schema and the React UI |
| Documentation site | [`docs`](docs) | Astro Starlight, deployed to [ttlp.docs.isaackogan.com](https://ttlp.docs.isaackogan.com/) |

The original Python library is archived on the [`legacy/archived-python-library`](https://github.com/isaackogan/TikTokLivePrinter/tree/legacy/archived-python-library) branch.

## Development

```sh
pnpm install
pnpm test            # vitest in every package
pnpm typecheck
pnpm build           # libraries, web UI, then the app binary for this machine
pnpm --filter @tiktok-live-printer/web dev      # UI with hot reload, proxies /api to :7474
pnpm --filter @tiktok-live-printer/app dev      # Bun server on :7474
```

Releases run from GitHub Actions: the library publishes to npm with trusted publishing (no token stored), and the app workflow builds a binary per OS and attaches them to a GitHub Release.

## Frequently Asked Questions

### What is a TikTok LIVE gift printer?

A small thermal receipt printer, the kind used for shop receipts, connected to software that prints a slip every time a viewer sends a gift, follows or comments on a TikTok LIVE stream. Streamers show the paper on camera as a thank-you. TikTok Live Printer is that software.

### Do I need to code?

No. The app is a single download with a drag-and-drop editor. The library is for developers who want to build something custom.

### Which printer should I buy?

Any ESC/POS receipt printer. The inexpensive 58 mm USB models sold as POS58 work; 80 mm printers work too. Avoid label printers.

### Is it free?

The app and library are free to use and modify under a modified MIT license; the only exception is that tik.tools and its owners and operators are excluded from the license. LIVE events come from [Euler Stream](https://www.eulerstream.com/), which requires an API key; see their site for plans.

### Does it work on Windows?

Yes. The app prints through the printer driver installed by the vendor, so there is nothing extra to install.

### Can I print comments or likes, not just gifts?

Yes. Receipts exist for gifts, follows, shares, likes (every N likes), comments, joins and subscriptions.

## License

This project is licensed under a modified MIT license: the standard MIT grant with an Excluded Party Restriction that denies all permissions to tik.tools and to its owners, operators and affiliates. See [LICENSE](LICENSE) for the full text.

## Contributors

* **Isaac Kogan** - *Creator and maintainer* - [isaackogan](https://github.com/isaackogan)

See also the full list of [contributors](https://github.com/isaackogan/TikTokLivePrinter/contributors).
