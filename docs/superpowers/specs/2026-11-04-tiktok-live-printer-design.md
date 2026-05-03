# TikTok Live Printer — TypeScript port design

Date: 2026-11-04. Status: approved by "Go" from the owner; decisions below marked "my call" were made by Claude.

## Intent

Replace the abandoned Python `TikTokPrinter` library with a TypeScript monorepo that ships two things:

1. `tiktok-live-printer` — a public npm library for building TikTok LIVE thermal-receipt printers on top of the Euler Stream WebSocket service (`@eulerstream/euler-websocket-sdk`, protobuf schema v3). It covers what the original Python library did: a client that receives LIVE events, a printer queue, ESC/POS text and image output over USB / network / console, avatar and gift image fetching, and simple voice (TTS) and sound playback.
2. `@tiktok-live-printer/app` — a no-code desktop app, shipped as a single compiled binary for macOS and Windows (Linux too), that starts a localhost web server and opens a React + shadcn UI where a streamer configures a gift printer by dragging and dropping receipt blocks. Config lives in the browser's `localStorage` and can be exported and imported as JSON.

The reference output is a 58 mm receipt roll with one entry per gift: the sender's avatar, `@username`, and `THANKS FOR 1 X 🌹`, separated by rules.

## Goals

- Library API close in spirit to the original: `client.text()`, `client.image()`, `client.voice()`, `client.sound()`, `client.queue(...)`, engines for USB / network / console, and media helpers for avatars and gift images.
- Clean and minimal code. Few dependencies, each one earning its place.
- Works on macOS, Windows, Linux. The dev machine's POS58 USB printer (vendor `0x0416`, product `0x5011`, 384 dots wide) is the primary test device.
- App binary needs no Node, no drivers beyond what the printer vendor already installs, no terminal.
- GitOps: GitHub Actions publishes the library to npm and builds app binaries.

## Non-goals (v1)

- Side-by-side avatar + text composition (needs text rasterisation with embedded fonts). Blocks stack vertically. Can be added later as a `card` block.
- Serial / Bluetooth transports. The transport interface leaves room for them.
- A persistent server-side database. Browser `localStorage` plus JSON import/export is the storage story.
- TikTok chat bot replies (`send_message` in the old library) — not supported by the WebSocket service.

## Anti-goals

- A Windows user being told to install Zadig / WinUSB. That breaks their printer for other apps. Windows prints through the spooler the vendor driver already set up.
- Hidden magic in the no-code app. Every receipt is a plain list of blocks the user can see and reorder.

## Constraints and findings

- Euler WebSocket wire format: JSON. With `bundleEvents` (default) each frame is `{timestamp, messages: DecodedData[]}`, otherwise one `{type, data}` per frame. `createWebSocketUrl({uniqueId, apiKey?, jwtKey?, features: {schemaVersion: 'v3'}})` builds the URL. Close codes come from `ClientCloseCode`.
- Schema v3 shapes used: `WebcastGiftMessage` (`user`, `gift.{name,diamondCount,image,type}`, `repeatCount`, `repeatEnd`), `WebcastChatMessage.content`, `WebcastLikeMessage.count`, `WebcastSocialMessage` (follow / share via `displayType`/`action`), `WebcastMemberMessage` (join when `action === ENTER`), `WebcastSubscribeMessage`. `User` has `displayId` (the @handle), `nickname`, `avatarThumb.urlList`.
- Gift streaks: a gift with `gift.type === 1` is streakable; the final message has `repeatEnd === 1` and `repeatCount` is the total. Non-streakable gifts fire once.
- `usb@3.2.1` is a Rust (nusb + napi-rs) rewrite with a WebUSB-style API and per-platform optional packages `@node-usb/usb-*` loaded by static `require` strings. Verified on this Mac against the POS58: open, select configuration 1, claim interface 0 all succeed without root. `device.configurations` throws on this printer's bad string descriptor, so transport code must not touch it; use config 1 / interface 0 / the bulk OUT endpoint.
- Windows no-code path: `@printers/printers@2.0.0` (napi-rs) writes RAW bytes to a spooler queue (winspool) and to CUPS on macOS / Linux.
- ESC/POS encoding: `@point-of-sale/receipt-printer-encoder@4.0.1` (actively maintained, pure JS) handles text styles, word wrap, raster images with dithering, cut. Hand-rolling would mean rewriting its dithering and wrapping.
- Images: `sharp` is out (libvips sibling dylib does not survive `bun --compile`). `jimp@1.6.1` is pure JS for JPEG / PNG. TikTok `urlList` entries usually include a `.jpeg` variant alongside `.webp`; the media helper prefers non-WebP URLs and rewrites `.webp` to `.jpeg` as a fallback. WebP decoding is not shipped in v1.
- Binary: `bun build --compile` embeds statically-required `.node` addons and `--asset` directories. Bun is not installed on the dev machine; it is added as a root devDependency so `pnpm install` provides it.

## Approaches considered

### Binary packaging

1. **Bun `--compile` (chosen).** Embeds native addons that are `require`d by a literal path, embeds the SPA with `--asset`, one command per target. Native per-OS runners in Actions guarantee the right `@node-usb/*` package is installed.
2. Node Single Executable Applications. CommonJS-only entry, flat asset map, manual addon extraction and `process.dlopen`. About three times the glue for the same result.
3. Electron / Tauri. Full desktop shell; far heavier than a localhost server plus the user's browser, which is what was asked for.

### Printer transport

1. **Transport interface with USB (libusb-free `usb` v3), spooler (`@printers/printers`), TCP 9100 (`node:net`) and console (chosen).** macOS / Linux default to USB, Windows defaults to the spooler queue. The UI lets the user override.
2. USB everywhere. Simplest code, but Windows users would need Zadig. Rejected (anti-goal).
3. Spooler everywhere. Needs a CUPS queue on macOS, which this printer does not get automatically. Rejected as the default, kept as an option.

### App server

1. **`Bun.serve` directly (chosen).** Routes, static files and WebSocket upgrade are built in; the app is Bun-only anyway because of `--compile`. No HTTP framework dependency.
2. Hono + `@hono/node-server`. Portable to Node, but the app never runs on Node, so it is a dependency without a payoff.

### UI state

1. **Config in `localStorage`, sent to the server on Start / Test (chosen, as requested).** The server holds only the running session in memory. JSON import / export covers backup and sharing.
2. Server-side JSON file next to the binary. Would survive cleared browser storage, but was not asked for and complicates "where did my config go" across two places.

## Repository layout

```
.
├── apps/tiktok-live-printer/              @tiktok-live-printer/app   (private, Bun server + binary build)
├── libraries/tiktok-live-printer/         tiktok-live-printer        (public npm)
├── packages/tiktok-live-printer/
│   ├── config/                            @tiktok-live-printer/config (private: zod config schema, templating, defaults)
│   └── web/                               @tiktok-live-printer/web    (private: Vite + React + shadcn SPA)
├── docs/superpowers/{specs,plans}/
├── .github/workflows/
│   ├── ci.yml                             typecheck + test + build on PRs
│   ├── release-tiktok-live-printer.yml    workflow_dispatch bump → npm publish → tag
│   └── release-app.yml                    tag/dispatch → matrix bun compile → GitHub Release assets
├── package.json  pnpm-workspace.yaml  turbo.json  tsconfig.base.json  tsdown.shared.ts
```

Monorepo methodology mirrors the Euler servers repo: pnpm workspaces with a catalog for shared versions, turbo for `build` / `dev` / `typecheck` / `test`, tsdown per package with a shared `defineTsdownPackageConfig`, `source` export condition so apps and tests consume TypeScript directly, ESM only, `files: ["dist"]`.

## Library: `tiktok-live-printer`

Node ≥ 22 or Bun (uses the global `WebSocket`). Dependencies: `@eulerstream/euler-websocket-sdk` (URL builder, types, close codes), `eventemitter3`, `@point-of-sale/receipt-printer-encoder`, `jimp`, `usb`. Optional dependency: `@printers/printers` (spooler transport, loaded lazily).

Public surface:

```ts
// client
new TikTokPrinterClient({ uniqueId, apiKey?, jwtKey?, printer: PrinterEngine, voice?: VoiceEngine, sound?: SoundEngine })
client.on('WebcastGiftMessage', (msg) => ...)      // every v3 event name, typed from the SDK
client.on('connected' | 'disconnected' | 'error', ...)
client.connect(): Promise<void>; client.disconnect(): void
client.text(content, { bold?, align?, size? }); client.image(img, { width? }); client.voice(text); client.sound(path)
client.queue(...items: PrintItem[])                 // one atomic job: items run in order, nothing interleaves

// printer
PrinterEngine.usb({ vendorId?, productId?, width? })   // omit ids to auto-pick the first printer-class device
PrinterEngine.spooler({ queue?, width? })              // Windows / CUPS RAW
PrinterEngine.network({ host, port = 9100, width? })
PrinterEngine.console()
listUsbPrinters(): Promise<UsbPrinterInfo[]>; listSpoolerQueues(): Promise<string[]>

// items
Text, Image, Line, Feed, Cut, Voice, Sound        // small discriminated-union factories
// media
fetchImage(url): Promise<RgbaImage>; avatarUrl(user); giftImageUrl(gift)
// events
isGiftComplete(msg): boolean; giftTotal(msg): number
```

Internals: a serial job queue (`PrintQueue`) drains one job at a time so interleaved events never mix on paper. `PrinterEngine` wraps one `Transport` (`write(bytes)` + `close()`) and the ESC/POS encoder; `width` is in dots (default 384 for 58 mm, 576 for 80 mm). Voice and sound engines shell out to platform tools (`say` / `afplay` on macOS, PowerShell on Windows, `espeak` / `aplay` on Linux) and are best-effort.

## Config package: `@tiktok-live-printer/config`

Zod schema shared by the UI and the server. Versioned (`version: 1`) so imports can be migrated.

```ts
type Block =
  | { type: 'avatar'; width: number }
  | { type: 'giftImage'; width: number }
  | { type: 'text'; template: string; bold: boolean; align: 'left'|'center'|'right'; size: 1|2 }
  | { type: 'line' } | { type: 'feed'; lines: number } | { type: 'cut' } | { type: 'voice'; template: string }

type Trigger = { id; event: 'gift'|'follow'|'share'|'like'|'comment'|'join'|'subscribe'; enabled; filter: { minDiamonds?; giftNames?: string[]; likeEvery?: number }; blocks: Block[] }

type Config = { version: 1; uniqueId: string; apiKey?: string;
  printer: { transport: 'auto'|'usb'|'spooler'|'network'|'console'; vendorId?; productId?; queue?; host?; port?; width: 384|576 };
  triggers: Trigger[] }
```

Templates use `{username}`, `{nickname}`, `{gift}`, `{count}`, `{diamonds}`, `{comment}`, `{likes}`. `renderTemplate(template, ctx)` is pure and tested. `defaultConfig()` ships one gift trigger that reproduces the reference receipt.

## App: `@tiktok-live-printer/app`

`src/main.ts` starts `Bun.serve` on `127.0.0.1:7474` (first free port from there), opens the browser, and serves the embedded SPA. API:

- `GET /api/printers` → `{ usb: UsbPrinterInfo[], spooler: string[] }`
- `POST /api/print/test` `{config}` → prints a sample receipt with the config's printer settings
- `POST /api/session/start` `{config}` / `POST /api/session/stop` / `GET /api/session`
- `WS /api/events` → status changes and a rolling log of handled events for the UI

`Session` turns a `Config` into a `TikTokPrinterClient`: builds the engine from `config.printer` (`auto` = spooler on Windows, USB elsewhere), subscribes to the v3 events the triggers need, maps each event to a template context, applies filters, and queues the trigger's blocks as one job.

Build: `vite build` in the web package, then `bun build --compile --minify --asset ../../packages/tiktok-live-printer/web/dist src/main.ts --outfile dist/tiktok-live-printer-<target>`. Windows adds `--windows-hide-console`. The `usb` and `@printers/printers` loaders use literal `require` strings, so their `.node` files embed.

## Web UI: `@tiktok-live-printer/web`

Vite + React 19 + Tailwind 4 + shadcn + `@dnd-kit/sortable` + zod (via the config package). Single page, three panes:

1. **Connection & printer**: TikTok username, optional Euler API key, printer transport picker populated from `/api/printers`, paper width, Test Print.
2. **Triggers**: list of triggers by event; each has a filter row and a vertical block list. A palette of block types on the side; drag to insert or reorder, click to edit a block's fields inline.
3. **Run**: Start / Stop, connection status, live log of printed events.

Header: Export JSON (download), Import JSON (file picker, validated with the zod schema, bad files rejected with the first error). State is held in one React store persisted to `localStorage` under `tiktok-live-printer:config`.

## GitOps

- `ci.yml`: on push / PR → `pnpm install`, `turbo typecheck test build`.
- `release-tiktok-live-printer.yml`: `workflow_dispatch` with `bump` (patch / minor / major), main only; `pnpm version`, build, `pnpm publish --access public` with `NPM_TOKEN`, commit + tag `tiktok-live-printer-v<version>`.
- `release-app.yml`: `workflow_dispatch` (version input) and `v*` tags; matrix `macos-15` (arm64), `macos-15-intel` (x64), `windows-latest`, `ubuntu-latest`; installs with pnpm, builds web, `bun build --compile`, uploads binaries to a GitHub Release. macOS binaries are ad-hoc signed; notarization is left for later.

## Testing

Vitest in the library and config package. Tests cover: template rendering, gift streak logic, config schema + defaults + import validation, encoder output for a queued job (bytes contain the expected ESC/POS markers), the queue's serial ordering, and event-to-context mapping in the app. Hardware is exercised manually against the POS58 with a Test Print.

## Left to the builder

- Exact shadcn components used; keep to Button, Input, Select, Card, Switch, Dialog, Badge, ScrollArea.
- Port selection fallback and browser-open command per platform.
- Whether `like` triggers batch counts (`likeEvery`) — implement as "print when cumulative likes from one user cross each multiple".
