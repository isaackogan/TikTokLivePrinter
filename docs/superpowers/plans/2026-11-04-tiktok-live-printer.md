# TikTok Live Printer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pnpm + turbo monorepo that ships the public `tiktok-live-printer` npm library and the `@tiktok-live-printer/app` no-code gift-printer binary, both built on the Euler WebSocket SDK (schema v3).

**Architecture:** The library wraps the Euler WebSocket (JSON frames) in a typed event client plus a serial print queue over an ESC/POS encoder and pluggable transports (USB, spooler, TCP, console). A private config package holds the zod schema, templating and defaults shared by the Vite/React/shadcn SPA and the Bun server. The app binary is `Bun.serve` with the SPA embedded, turning a config into a running library client.

**Tech Stack:** TypeScript 5.9, pnpm 11 workspaces + catalog, turbo 2, tsdown 0.23, vitest 3, Bun 1.4 (`--compile`), `@eulerstream/euler-websocket-sdk` 1.1, `@point-of-sale/receipt-printer-encoder` 4, `usb` 3.2, `@printers/printers` 2, `jimp` 1.6, React 19, Vite 7, Tailwind 4, shadcn, `@dnd-kit/sortable`, zod 3.

**Spec:** `docs/superpowers/specs/2026-11-04-tiktok-live-printer-design.md`

## Global Constraints

- Package names: `tiktok-live-printer` (public, `libraries/tiktok-live-printer`), `@tiktok-live-printer/app` (`apps/tiktok-live-printer`), `@tiktok-live-printer/config` and `@tiktok-live-printer/web` (`packages/tiktok-live-printer/{config,web}`); every `@tiktok-live-printer/*` package is `"private": true`.
- ESM only (`"type": "module"`), `exports` with a `source` condition pointing at `src/`, `files: ["dist"]`, tsdown build via shared `defineTsdownPackageConfig`.
- Library runtime: Node ≥ 22 or Bun; uses the global `WebSocket`; no `ws` dependency.
- Schema v3 only: `features.schemaVersion = SchemaVersion.v3`; types imported from `@eulerstream/euler-websocket-sdk/v3`.
- Default paper width 384 dots (58 mm); 576 for 80 mm.
- Never read `device.configurations` on a `usb` device (bad string descriptor on POS58). Use configuration 1, interface 0, first bulk OUT endpoint.
- Windows default transport is the spooler; macOS/Linux default is USB. Never instruct a user to install Zadig.
- Code style: small files, one responsibility each, no comments that restate code, no dead options. Tests are vitest.
- Commit after every task with a conventional-commit message.

## Review Focus

1. A gift streak sends many `WebcastGiftMessage`s; only the final one (`repeatEnd === 1`) may print, with the total `repeatCount`. Tested in Task 6.
2. Two events arriving in the same WebSocket bundle must print as two complete receipts, never interleaved. Tested in Task 3 (queue) and Task 7 (bundle handling).
3. An avatar URL that only has `.webp` entries must still produce an image request for a `.jpeg` variant; a failed image fetch must not kill the job, the block is skipped. Tested in Task 5 and Task 12.
4. Importing a JSON file that is not a config must be rejected with a readable message and leave the current config untouched. Tested in Task 9 and Task 11.
5. The WebSocket closing with `NOT_LIVE` (4404) or `INVALID_AUTH` (4401) must surface as a `disconnected` event carrying the code and message, not a thrown error. Tested in Task 7.

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `tsdown.shared.ts`, `.gitignore`, `.npmrc`
- Modify: `README.md` (replace with a short description of the two deliverables and dev commands; move the old sales copy out)

**Interfaces:**
- Produces: `defineTsdownPackageConfig(overrides: UserConfig & {entry: unknown}): UserConfigFn` in `tsdown.shared.ts` (ESM, `platform: 'node'`, `target: 'node22'`, `dts: true`, `sourcemap: true`, `clean: !watch`, `outExtensions` → `.js`/`.d.ts`).
- Produces: pnpm catalog entries: `typescript ^5.9.3`, `tsdown ^0.23.5`, `vitest ^3.2.4`, `@types/node ^24.0.0`, `zod ^3.25.76`, `@eulerstream/euler-websocket-sdk ^1.1.0`, `react ^19.1.0`, `react-dom ^19.1.0`.

- [ ] **Step 1: Write root files**

`package.json`: name `tiktok-live-printer-monorepo`, private, `packageManager: "pnpm@11.5.2"`, scripts `build`/`dev`/`typecheck`/`test` → `turbo run <task>`, devDependencies `turbo ^2.11.10`, `tsdown ^0.23.5`, `typescript ^5.9.3`, `bun ^1.4.4`.
`pnpm-workspace.yaml`: packages `apps/*`, `libraries/*`, `packages/tiktok-live-printer/*`; the catalog above.
`turbo.json`: tasks `build` (`dependsOn: ["^build"]`, `outputs: ["dist/**"]`), `typecheck` (`dependsOn: ["^build"]`), `test` (`dependsOn: ["^build"]`), `dev` (persistent, no cache, `dependsOn: ["^build"]`); `globalDependencies: ["tsconfig.base.json", "tsdown.shared.ts"]`.
`tsconfig.base.json`: copy the strict option set from the design's reference (`moduleResolution: Bundler`, `customConditions: ["source"]`, `noEmit`, `allowImportingTsExtensions`, `strict`, `noUnusedLocals`, `noUnusedParameters`); drop the decorator options.
`.gitignore`: `node_modules`, `dist`, `.turbo`, `*.tsbuildinfo`, `.idea`, `.DS_Store`, `.env`.
`.npmrc`: `auto-install-peers=true`, `strict-peer-dependencies=false`.

- [ ] **Step 2: Install and verify**

Run: `pnpm install && pnpm exec turbo --version && pnpm exec bun --version`
Expected: install succeeds, turbo prints `2.11.x`, bun prints `1.4.x`.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold pnpm + turbo + tsdown monorepo"
```

---

### Task 2: Bun compile spike (verification only, no product code)

**Files:**
- Create (scratch, not committed): `apps/tiktok-live-printer/spike/usb.ts`, `apps/tiktok-live-printer/spike/web/index.html`

- [ ] **Step 1: Create a temporary app package.json** at `apps/tiktok-live-printer/package.json` with name `@tiktok-live-printer/app`, private, `dependencies: { "usb": "^3.2.1" }` (Task 12 replaces it). Run `pnpm install`.

- [ ] **Step 2: Write `spike/usb.ts`**: `import { usb } from 'usb'`; `const dev = (await usb.getDevices()).find(d => d.vendorId === 0x0416)`; open, `selectConfiguration(1)`, `claimInterface(0)`, `transferOut(<bulk out endpoint>, new TextEncoder().encode('\x1b@bun spike ok\n\n\n'))`, print the result, close. Find the OUT endpoint from `dev.configuration.interfaces[0].alternate.endpoints` (direction `out`).

- [ ] **Step 3: Compile and run**

Run: `cd apps/tiktok-live-printer && pnpm exec bun build --compile --asset ./spike/web spike/usb.ts --outfile spike/out/spike && ./spike/out/spike`
Expected: the POS58 prints `bun spike ok`; the process exits 0. If `--asset` is rejected, try `--asset './spike/web/**/*'` and read the file via `Bun.embeddedFiles`; note which form works.

- [ ] **Step 4: Record the result** as a short "Verified" paragraph at the end of the spec's Constraints section (asset flag form that worked, whether the `usb` addon loaded under Bun). Delete `spike/`. Commit the spec change only.

---

### Task 3: Library scaffold, print items, serial queue

**Files:**
- Create: `libraries/tiktok-live-printer/package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`, `src/index.ts`, `src/items.ts`, `src/queue.ts`
- Test: `libraries/tiktok-live-printer/test/queue.test.ts`

**Interfaces:**
- Produces (`src/items.ts`):
  ```ts
  export type TextStyle = { bold?: boolean; align?: 'left'|'center'|'right'; size?: 1|2 }
  export type RgbaImage = { width: number; height: number; data: Uint8ClampedArray }
  export type PrintItem =
    | { type: 'text'; content: string; style: TextStyle }
    | { type: 'image'; image: RgbaImage; width?: number }
    | { type: 'line' } | { type: 'feed'; lines: number } | { type: 'cut' }
    | { type: 'voice'; content: string } | { type: 'sound'; path: string }
  export const Text = (content: string, style: TextStyle = {}): PrintItem
  export const Image = (image: RgbaImage, width?: number): PrintItem
  export const Line = (): PrintItem; export const Feed = (lines = 1): PrintItem; export const Cut = (): PrintItem
  export const Voice = (content: string): PrintItem; export const Sound = (path: string): PrintItem
  ```
- Produces (`src/queue.ts`): `export class PrintQueue { constructor(run: (items: PrintItem[]) => Promise<void>); push(items: PrintItem[]): Promise<void>; readonly size: number; drain(): Promise<void> }` — jobs run strictly one after another in push order; a job that rejects is logged via an `onError` callback passed as the second constructor argument and does not stop the queue.

- [ ] **Step 1: Package files.** `package.json`: name `tiktok-live-printer`, version `0.1.0`, description "Build TikTok LIVE thermal receipt printers on the Euler Stream WebSocket service", license MIT, `engines.node >=22`, exports `.` → `{source: ./src/index.ts, types: ./dist/index.d.ts, import: ./dist/index.js}`, scripts `build`/`typecheck`/`test`/`prepack`, `publishConfig.access: public`, repository `isaackogan/TikTokPrinter` directory `libraries/tiktok-live-printer`, dependencies `@eulerstream/euler-websocket-sdk: catalog:`, `eventemitter3 ^5.0.1`, `@point-of-sale/receipt-printer-encoder ^4.0.1`, `jimp ^1.6.1`, `usb ^3.2.1`; optionalDependencies `@printers/printers ^2.0.0`; devDependencies from catalog. `tsconfig.json` extends base, includes `src`, `test`. `tsdown.config.ts` uses `defineTsdownPackageConfig({entry: {index: 'src/index.ts'}})`. `vitest.config.ts` with `resolve.conditions: ['source']`.

- [ ] **Step 2: Write the failing test** `test/queue.test.ts`:
  - `runs jobs one at a time in push order`: push three jobs whose runner awaits a deferred promise; assert the runner was called once until the first resolves; assert final call order `[1,2,3]`.
  - `continues after a failing job`: first job rejects; `onError` receives the error; second job still runs.

- [ ] **Step 3: Run** `pnpm --filter tiktok-live-printer test` → FAIL (module not found).

- [ ] **Step 4: Implement `items.ts` and `queue.ts`.** Queue: a promise chain (`this.tail = this.tail.then(run).catch(onError)`), `size` counts pending jobs.

- [ ] **Step 5: Run tests** → PASS. Run `pnpm --filter tiktok-live-printer build` → `dist/index.js` and `dist/index.d.ts` exist.

- [ ] **Step 6: Commit** `feat(lib): scaffold library with print items and serial queue`.

---

### Task 4: ESC/POS engine and transports

**Files:**
- Create: `src/printer/transport.ts`, `src/printer/console.ts`, `src/printer/network.ts`, `src/printer/usb.ts`, `src/printer/spooler.ts`, `src/printer/engine.ts`, `src/printer/index.ts`
- Test: `test/engine.test.ts`

**Interfaces:**
- `transport.ts`: `export interface Transport { write(bytes: Uint8Array): Promise<void>; close(): Promise<void> }`
- `console.ts`: `export class ConsoleTransport implements Transport` — writes decoded text to `console.log` with non-printable bytes stripped; also `export class MemoryTransport implements Transport { chunks: Uint8Array[] }` for tests.
- `network.ts`: `export class NetworkTransport implements Transport { constructor(host: string, port = 9100) }` — lazy `net.connect`, write with backpressure, `close` ends the socket.
- `usb.ts`: `export type UsbPrinterInfo = { vendorId: number; productId: number; name: string }`; `export async function listUsbPrinters(): Promise<UsbPrinterInfo[]>` (devices whose `deviceClass === 7` or any interface class 7, or the POS58 ids); `export class UsbTransport implements Transport { constructor(opts: {vendorId?: number; productId?: number}) }` — on first write: find device (by ids, else first printer), `open`, `selectConfiguration(1)`, `claimInterface(0)`, find bulk OUT endpoint from `device.configuration.interfaces[0].alternate.endpoints`, `transferOut` in 4096-byte chunks. Never touch `configurations`.
- `spooler.ts`: `export async function listSpoolerQueues(): Promise<string[]>`; `export class SpoolerTransport implements Transport { constructor(opts: {queue?: string}) }` — `await import('@printers/printers')`; default queue = first whose name matches `/pos|receipt|printer/i`; `printBytes(bytes, {jobName: 'tiktok-live-printer', ...rawOptions})` with `{"document-format": "application/vnd.cups-raw"}` on non-Windows.
- `engine.ts`:
  ```ts
  export type EngineOptions = { width?: 384|576 }
  export class PrinterEngine {
    constructor(transport: Transport, opts?: EngineOptions)
    static usb(opts?: {vendorId?: number; productId?: number} & EngineOptions): PrinterEngine
    static spooler(opts?: {queue?: string} & EngineOptions): PrinterEngine
    static network(opts: {host: string; port?: number} & EngineOptions): PrinterEngine
    static console(opts?: EngineOptions): PrinterEngine
    encode(items: PrintItem[]): Uint8Array        // text/image/line/feed/cut only; voice/sound ignored here
    print(items: PrintItem[]): Promise<void>      // encode + transport.write
    close(): Promise<void>
  }
  ```
  Encoder: `new ReceiptPrinterEncoder({ language: 'esc-pos', columns: width === 576 ? 48 : 32, imageMode: 'raster' })`; `line` → a full row of `-`; `feed` → `newline(lines)`; `cut` → `cut('partial')`; image → `encoder.image(image, width ?? engineWidth, auto-height keeping aspect, 'atkinson')` with width rounded down to a multiple of 8 and height computed from aspect; text size 2 → `size(2,2)`.

- [ ] **Step 1: Write the failing test** `test/engine.test.ts` with `MemoryTransport`:
  - `encodes text with ESC/POS init and bold markers`: `Text('hi', {bold: true})` → bytes start with `0x1b 0x40`, contain `0x1b 0x45 0x01` and the ASCII `hi`.
  - `line is width/12 dashes`: `Line()` on a 384 engine → encoded text contains 32 `-`.
  - `cut emits GS V`: contains `0x1d 0x56`.
  - `image emits raster header GS v 0`: a 16×8 white `RgbaImage` → contains `0x1d 0x76 0x30`.
  - `print writes once per job`: `print([Text('a'), Text('b')])` → `transport.chunks.length === 1`.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the files above. **Step 4: Run** → PASS; `typecheck` passes.

- [ ] **Step 5: Hardware check** (manual, this machine): `pnpm exec tsx -e "..."` or a scratch script that does `PrinterEngine.usb().print([Text('TikTok Live Printer', {bold:true, align:'center'}), Line(), Feed(3), Cut()])`. Expected: the POS58 prints it. Fix endpoint discovery if not.

- [ ] **Step 6: Commit** `feat(lib): ESC/POS engine with usb, spooler, network and console transports`.

---

### Task 5: Media helpers

**Files:**
- Create: `src/media.ts`
- Test: `test/media.test.ts`

**Interfaces:**
```ts
export function pickImageUrl(image: { urlList: string[] } | undefined): string | undefined  // prefers .jpeg/.jpg/.png entries; else rewrites a .webp entry's extension to .jpeg; undefined when empty
export function avatarUrl(user: Pick<User, 'avatarThumb'|'avatarMedium'> | undefined): string | undefined
export function giftImageUrl(gift: Pick<Gift, 'image'|'icon'> | undefined): string | undefined
export async function fetchImage(url: string, opts?: { timeoutMs?: number }): Promise<RgbaImage>  // fetch → Jimp.read → bitmap; throws on non-2xx or decode failure
```
Types `User`, `Gift` from `@eulerstream/euler-websocket-sdk/v3`.

- [ ] **Step 1: Failing tests**: `prefers jpeg over webp`, `rewrites webp to jpeg when nothing else`, `returns undefined for empty list`, `avatarUrl falls back from thumb to medium`. Plus `fetchImage decodes a png buffer` using a tiny in-memory PNG produced by `new Jimp({width: 4, height: 4, color: 0xffffffff}).getBuffer('image/png')` served from a stubbed `globalThis.fetch`.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** `feat(lib): avatar and gift image helpers`.

---

### Task 6: Event helpers, voice and sound engines

**Files:**
- Create: `src/events.ts`, `src/voice.ts`, `src/sound.ts`
- Test: `test/events.test.ts`

**Interfaces:**
```ts
// events.ts
export function isGiftComplete(msg: WebcastGiftMessage): boolean   // gift.type !== 1 || repeatEnd === 1
export function giftTotal(msg: WebcastGiftMessage): number          // max(repeatCount, 1)
export function giftDiamonds(msg: WebcastGiftMessage): number       // diamondCount * giftTotal
export function isJoin(msg: WebcastMemberMessage): boolean          // action === MemberMessageAction.MEMBER_MESSAGE_ACTION_ENTER
export function socialKind(msg: WebcastSocialMessage): 'follow'|'share'|undefined  // 'follow' when displayType/action mentions follow, 'share' for share
// voice.ts / sound.ts
export class VoiceEngine { speak(text: string): Promise<void> }     // darwin: say; win32: powershell Add-Type System.Speech; linux: espeak; resolves when the process exits, swallows ENOENT
export class SoundEngine { play(path: string): Promise<void> }      // darwin: afplay; win32: powershell (New-Object Media.SoundPlayer).PlaySync(); linux: aplay
```

- [ ] **Step 1: Failing tests** for `events.ts`: streakable gift mid-streak → `false`; streakable with `repeatEnd: 1` → `true`; non-streakable (`type: 2`) → `true`; `giftTotal` of `repeatCount: 0` → `1`; `giftDiamonds` multiplies; `socialKind` for `displayType: 'pm_mt_msg_viewer'`/`action` containing `follow` and `share` (use the field values present in v3: inspect `WebcastSocialMessage` keys `action`, `shareType`, `followType`; treat `followType > 0` as follow and `shareType !== ''` as share).

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (voice/sound via `node:child_process` `execFile`). **Step 4: Run** → PASS.

- [ ] **Step 5: Commit** `feat(lib): gift, social and member helpers; voice and sound engines`.

---

### Task 7: The client

**Files:**
- Create: `src/client.ts`; update `src/index.ts` to export everything public.
- Test: `test/client.test.ts`

**Interfaces:**
```ts
export type ClientOptions = { uniqueId: string; apiKey?: string; jwtKey?: string; printer: PrinterEngine; voice?: VoiceEngine; sound?: SoundEngine; wsUrl?: string }
export type ClientEvents = TypedEmitterEventMap & {
  connected: () => void
  disconnected: (info: { code: number; reason: string }) => void
  error: (err: Error) => void
}
export class TikTokPrinterClient extends EventEmitter<ClientEvents> {
  constructor(opts: ClientOptions)
  connect(): Promise<void>        // resolves on socket open; rejects if the socket closes before opening
  disconnect(): void
  handleFrame(raw: string): void  // parses a bundle or single DecodedData and emits `msg.type` with `msg.data`
  text(content: string, style?: TextStyle): Promise<void>
  image(image: RgbaImage, width?: number): Promise<void>
  voice(content: string): Promise<void>
  sound(path: string): Promise<void>
  queue(...items: PrintItem[]): Promise<void>   // one PrintQueue job: printer.print(printable items) then voice/sound items in order
}
```
URL: `createWebSocketUrl({uniqueId, apiKey, jwtKey, features: {schemaVersion: SchemaVersion.v3}})` with `BASE_URL` override via `opts.wsUrl` (replace the host part). Close → emit `disconnected` with `{code, reason: reason || CloseMessageMap[code] || ''}`.

- [ ] **Step 1: Failing tests** (no network: construct with `PrinterEngine.console()`):
  - `handleFrame emits each message in a bundle in order`: feed `JSON.stringify({timestamp: 1, messages: [{type:'WebcastChatMessage', data:{content:'a'}}, {type:'WebcastGiftMessage', data:{repeatEnd:1}}]})` → listeners called in order with the data objects.
  - `handleFrame emits a single message frame`.
  - `handleFrame ignores malformed JSON and emits error`.
  - `queue runs jobs serially`: swap `printer` for a `PrinterEngine` over `MemoryTransport`; `queue(Text('a'))` twice → two chunks, order preserved.
  - `disconnected carries close code text`: call the private close handler via a `MockWebSocket` injected through `opts.wsFactory?: (url: string) => WebSocket`-like (add this option, default `new WebSocket(url)`); close with `4404` → `disconnected` receives `{code: 4404, reason: 'Streamer is not live'}`.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; `build` and `typecheck` pass.

- [ ] **Step 5: Live check** (manual): scratch script with a currently-live `uniqueId`, `PrinterEngine.console()`, log gift and chat events for 30 s. Expected: events arrive; close code is logged on disconnect.

- [ ] **Step 6: Commit** `feat(lib): TikTokPrinterClient over the Euler WebSocket (schema v3)`.

---

### Task 8: Library README and example

**Files:**
- Create: `libraries/tiktok-live-printer/README.md`, `libraries/tiktok-live-printer/examples/gift-receipt.ts`

- [ ] **Step 1: Example** reproduces the reference receipt: on `WebcastGiftMessage` when `isGiftComplete`, fetch avatar, `client.queue(Image(avatar, 160), Text('@'+displayId, {bold:true, align:'center'}), Text(\`THANKS FOR ${giftTotal(msg)} X ${gift.name}\`, {align:'center'}), Line(), Feed(2))`. Image fetch failure → skip the image item.
- [ ] **Step 2: README**: install, quick start (the example), engines table, items, events (`client.on('WebcastGiftMessage')`), auth (`apiKey` from eulerstream.com), platform notes (macOS/Linux USB direct; Windows spooler with the vendor driver), a line pointing to the app for the no-code version.
- [ ] **Step 3: Run the example** against the POS58 with a live creator for one gift (or print a fake via `client.handleFrame(...)` with a stubbed gift frame including a real avatar URL). Expected: a receipt like the reference photo.
- [ ] **Step 4: Commit** `docs(lib): README and gift receipt example`.

---

### Task 9: Config package

**Files:**
- Create: `packages/tiktok-live-printer/config/{package.json,tsconfig.json,tsdown.config.ts,vitest.config.ts}`, `src/index.ts`, `src/schema.ts`, `src/template.ts`, `src/defaults.ts`
- Test: `test/schema.test.ts`, `test/template.test.ts`

**Interfaces:**
```ts
// schema.ts (zod)
export const BlockSchema, TriggerSchema, PrinterConfigSchema, ConfigSchema   // exactly the shapes in the spec; ids are strings; `version: z.literal(1)`
export type Block, Trigger, PrinterConfig, Config, TriggerEvent ('gift'|'follow'|'share'|'like'|'comment'|'join'|'subscribe'), BlockType
export function parseConfig(input: unknown): { ok: true; config: Config } | { ok: false; error: string }   // error = first zod issue as "path: message"
// template.ts
export type TemplateContext = { username: string; nickname: string; gift: string; count: number; diamonds: number; comment: string; likes: number }
export function renderTemplate(template: string, ctx: TemplateContext): string   // `{key}` replaced; unknown keys left as-is
export const TEMPLATE_KEYS: (keyof TemplateContext)[]
// defaults.ts
export function defaultConfig(): Config   // uniqueId '', printer {transport:'auto', width:384}, one enabled gift trigger: avatar(160), text '@{username}' bold center, text 'THANKS FOR {count} X {gift}' center, line, feed 2
export function newTrigger(event: TriggerEvent): Trigger
export function newBlock(type: BlockType): Block
```
Package: `@tiktok-live-printer/config`, private, depends on `zod: catalog:`.

- [ ] **Step 1: Failing tests**: `parseConfig accepts defaultConfig()`; `rejects a non-object with a message`; `rejects unknown block type naming the path`; `renderTemplate substitutes all keys`; `leaves unknown placeholders`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(config): zod config schema, templating and defaults`.

---

### Task 10: Web package scaffold, store, import/export

**Files:**
- Create: `packages/tiktok-live-printer/web/{package.json,tsconfig.json,vite.config.ts,index.html,components.json}`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/store.ts`, `src/lib/api.ts`, `src/components/ui/*` (shadcn), `vitest.config.ts`
- Test: `src/store.test.ts`

**Interfaces:**
- `store.ts`: `export function useConfig(): [Config, (update: (c: Config) => Config) => void]` backed by a module-level store + `useSyncExternalStore`, persisted to `localStorage['tiktok-live-printer:config']` (reads with try/catch, falls back to `defaultConfig()`), plus `export function exportConfig(c: Config): string` (pretty JSON) and `export function importConfig(text: string): {ok: true; config: Config} | {ok: false; error: string}` (JSON.parse errors → `ok: false`).
- `lib/api.ts`: typed `fetch` wrappers `getPrinters()`, `testPrint(config)`, `startSession(config)`, `stopSession()`, `getSession()`, and `openEvents(onMessage)` for the `/api/events` WebSocket. Base URL `''` (same origin); Vite dev proxies `/api` to `http://127.0.0.1:7474`.

- [ ] **Step 1: Scaffold**: package `@tiktok-live-printer/web`, private, scripts `dev: vite`, `build: vite build`, `typecheck`, `test`; deps `react`, `react-dom` (catalog), `@tiktok-live-printer/config: workspace:*`, `zod`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@dnd-kit/core ^6`, `@dnd-kit/sortable ^10`, `@dnd-kit/utilities ^3`; devDeps `vite ^7`, `@vitejs/plugin-react`, `tailwindcss ^4`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`. Tailwind 4 via `@import "tailwindcss"` in `index.css`. Run `pnpm dlx shadcn@latest init -d` then `pnpm dlx shadcn@latest add button input select card switch dialog badge scroll-area label textarea`. `vite.config.ts`: react + tailwind plugins, `server.proxy['/api'] = { target: 'http://127.0.0.1:7474', ws: true }`, `resolve.conditions: ['source']`, alias `@` → `src`.
- [ ] **Step 2: Failing test** `store.test.ts` (jsdom): `importConfig rejects invalid JSON with a message`, `importConfig rejects a valid JSON non-config`, `exportConfig round-trips through importConfig`, `store falls back to defaultConfig when localStorage holds garbage`.
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement** store and api. **Step 5: Run** → PASS; `pnpm --filter @tiktok-live-printer/web build` emits `dist/index.html`.
- [ ] **Step 6: Commit** `feat(web): Vite + React + shadcn scaffold with persisted config store`.

---

### Task 11: Web UI

**Files:**
- Create: `src/components/Header.tsx` (title, Import, Export), `src/components/ConnectionPane.tsx`, `src/components/PrinterPane.tsx`, `src/components/TriggerList.tsx`, `src/components/TriggerCard.tsx`, `src/components/BlockList.tsx` (dnd-kit sortable), `src/components/BlockEditor.tsx`, `src/components/BlockPalette.tsx`, `src/components/RunPane.tsx`, `src/components/FilterRow.tsx`
- Modify: `src/App.tsx`

**Behaviour decisions:**
- Layout: header; left column (Connection, Printer, Run) ~1/3; right column Triggers. Stack on narrow screens.
- Import: `<input type=file accept=.json>` → `importConfig` → on `ok: false` show the error in a destructive `Badge`/inline text and keep current config.
- Export: download `tiktok-live-printer-config.json` via a blob URL.
- Printer pane: transport `Select` (`auto`, `usb`, `spooler`, `network`, `console`); when `usb`, a `Select` of devices from `getPrinters().usb` (label `name (0416:5011)` hex); when `spooler`, queues; when `network`, host + port inputs; width `Select` 58 mm / 80 mm. "Test print" button → `testPrint(config)`, shows result text.
- Triggers: "Add trigger" `Select` by event; each `TriggerCard` has enable `Switch`, event badge, `FilterRow` (gift: min diamonds number + gift names comma list; like: `likeEvery` number; others none), `BlockList`, delete button.
- `BlockList`: `DndContext` + `SortableContext` (vertical), drag handle icon on each block; `BlockPalette` buttons append a `newBlock(type)`; `BlockEditor` renders fields by type (text: `Textarea` with a placeholder listing `TEMPLATE_KEYS`, bold `Switch`, align `Select`, size `Select`; avatar/giftImage: width number; feed: lines; voice: template). Drag within a list only (v1).
- Run pane: Start/Stop button, status badge from `/api/events` (`idle` / `connecting` / `connected` / `disconnected: <reason>`), last 50 log lines in a `ScrollArea`.

- [ ] **Step 1: Build the components** top-down; keep each under ~120 lines.
- [ ] **Step 2: Verify** with `pnpm --filter @tiktok-live-printer/web dev`: add a trigger, drag a block above another, reload (order persists), export, break the file, import → error shown and config unchanged.
- [ ] **Step 3: Commit** `feat(web): no-code trigger editor with drag-and-drop blocks`.

---

### Task 12: App server and session

**Files:**
- Replace: `apps/tiktok-live-printer/package.json`; create `tsconfig.json`, `vitest.config.ts`, `src/main.ts`, `src/server.ts`, `src/static.ts`, `src/printers.ts`, `src/session/context.ts`, `src/session/render.ts`, `src/session/session.ts`, `src/open-browser.ts`
- Test: `test/context.test.ts`, `test/render.test.ts`

**Interfaces:**
```ts
// session/context.ts
export type TriggerMatch = { event: TriggerEvent; ctx: TemplateContext; avatarUrl?: string; giftImageUrl?: string }
export function matchEvent(type: string, data: unknown, likeTotals: Map<string, number>): TriggerMatch | undefined
  // WebcastGiftMessage → only when isGiftComplete; WebcastChatMessage → comment; WebcastLikeMessage → accumulates per username into likeTotals and returns likes = total;
  // WebcastSocialMessage → follow/share via socialKind; WebcastMemberMessage → join via isJoin; WebcastSubscribeMessage → subscribe
export function passesFilter(trigger: Trigger, match: TriggerMatch, prevLikes: number): boolean
  // minDiamonds ≤ diamonds; giftNames (case-insensitive) includes gift when non-empty; likeEvery: floor(likes/n) > floor(prevLikes/n)
// session/render.ts
export async function renderBlocks(blocks: Block[], match: TriggerMatch, fetch: (url: string) => Promise<RgbaImage>): Promise<PrintItem[]>
  // avatar/giftImage → Image(...) or skipped when no url or fetch throws; text → Text(renderTemplate(...), style); voice → Voice(renderTemplate(...)); line/feed/cut pass through
// session/session.ts
export type SessionStatus = { state: 'idle'|'connecting'|'connected'|'disconnected'; detail?: string }
export class Session { constructor(config: Config, onLog: (line: string) => void, onStatus: (s: SessionStatus) => void); start(): Promise<void>; stop(): Promise<void> }
  // builds PrinterEngine from config.printer ('auto' → spooler on win32 else usb); subscribes only to the event types the enabled triggers need; one client.queue per matching trigger
// printers.ts
export async function listPrinters(): Promise<{ usb: UsbPrinterInfo[]; spooler: string[] }>
export async function testPrint(config: Config): Promise<void>   // prints "TikTok Live Printer" header, the transport name, a line, feed 3, cut
// server.ts
export function createServer(opts: { port: number; staticDir: string }): ReturnType<typeof Bun.serve>   // routes above; WS /api/events broadcasts {type:'status',...}|{type:'log',line}
// static.ts: serves files from the embedded SPA directory with index.html fallback (form verified in Task 2)
// main.ts: pick port 7474.. (retry +1 up to 10), start server, open browser (darwin `open`, win32 `cmd /c start`, linux `xdg-open`)
```
Package: `@tiktok-live-printer/app`, private, `scripts`: `dev: bun --watch src/main.ts`, `build:web` handled by turbo dependency on `@tiktok-live-printer/web#build`, `build: bun build --compile --minify --asset <verified form> src/main.ts --outfile dist/tiktok-live-printer`, `typecheck`, `test: vitest run`; deps `tiktok-live-printer: workspace:*`, `@tiktok-live-printer/config: workspace:*`, `usb`, `@printers/printers`; devDeps `@tiktok-live-printer/web: workspace:*`, `@types/bun`, `vitest`, `typescript`. `tsconfig` adds `types: ["bun-types"]`.

- [ ] **Step 1: Failing tests**: `context.test.ts` — gift mid-streak → undefined; complete gift → ctx with `count`, `diamonds`, `avatarUrl`; like accumulates across two messages; `passesFilter` minDiamonds, giftNames case-insensitive, likeEvery crossing. `render.test.ts` — avatar block with failing fetch is skipped and the text block still renders; template substitution in text and voice.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** all files. **Step 4: Run** → PASS; `typecheck` passes.
- [ ] **Step 5: Dev run**: `pnpm --filter @tiktok-live-printer/web build && pnpm --filter @tiktok-live-printer/app dev`, open `http://127.0.0.1:7474`, choose the POS58, Test print → paper comes out. Start with a live creator → receipts print on gifts.
- [ ] **Step 6: Commit** `feat(app): Bun server, session runner and printer API`.

---

### Task 13: Binary build

**Files:**
- Modify: `apps/tiktok-live-printer/package.json` (build script per target), `turbo.json` (app `build` depends on `^build` which includes web)
- Create: `apps/tiktok-live-printer/scripts/build.ts` (reads `--target`, runs `bun build --compile --target=<bun-darwin-arm64|bun-darwin-x64|bun-windows-x64|bun-linux-x64>`, adds `--windows-hide-console` for windows, outputs `dist/tiktok-live-printer-<target>[.exe]`)

- [ ] **Step 1: Implement the script and wire `build`.**
- [ ] **Step 2: Verify**: `pnpm build` from the root → `apps/tiktok-live-printer/dist/tiktok-live-printer-darwin-arm64` exists; run it from a different cwd; the browser opens, the UI loads from the embedded assets, Test print works via USB.
- [ ] **Step 3: Commit** `build(app): bun --compile binary build per target`.

---

### Task 14: GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release-tiktok-live-printer.yml`, `.github/workflows/release-app.yml`
- Delete: `.github/documentation.yml` (Sphinx leftover)

- [ ] **Step 1: `ci.yml`**: on push to `main` and PRs; ubuntu; pnpm/action-setup@v4 (version 11), setup-node@v4 (node 24, pnpm cache), oven-sh/setup-bun@v2; `pnpm install --frozen-lockfile`; `pnpm exec turbo typecheck test build --filter=!@tiktok-live-printer/app` (binary build is release-only).
- [ ] **Step 2: `release-tiktok-live-printer.yml`**: `workflow_dispatch` with `bump` choice (patch/minor/major); enforce `main`; working-directory `libraries/tiktok-live-printer`; `pnpm version <bump> --no-git-tag-version`; `pnpm run build`; `pnpm publish --access public --no-git-checks` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` and `registry-url: https://registry.npmjs.org`; commit `chore: release tiktok-live-printer v<v> [skip ci]` and tag `tiktok-live-printer-v<v>`; push both.
- [ ] **Step 3: `release-app.yml`**: `workflow_dispatch` (input `version`) and `push: tags: ['app-v*']`; matrix `{os: macos-15, target: darwin-arm64}`, `{os: macos-15-intel, target: darwin-x64}`, `{os: windows-latest, target: windows-x64}`, `{os: ubuntu-latest, target: linux-x64}`; install, `pnpm exec turbo build --filter=@tiktok-live-printer/app` with `BUILD_TARGET`; on macOS `codesign --sign - <binary>`; upload artifacts; final job `softprops/action-gh-release@v2` attaching all binaries.
- [ ] **Step 4: Validate** YAML with `pnpm dlx action-validator` or `gh workflow view` after push (syntax only).
- [ ] **Step 5: Commit** `ci: CI, npm release and binary release workflows`.

---

### Task 15: Docs and wrap-up

- [ ] **Step 1: Root `README.md`**: what the repo contains, links to the library README and the app, dev commands (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`), release instructions (which workflow, which secret), platform notes.
- [ ] **Step 2: `apps/tiktok-live-printer/README.md`**: download the binary for your OS, run it, allow the browser to open, pick the printer, Test print, add triggers, Start; Export/Import; troubleshooting (macOS Gatekeeper "unidentified developer" right-click → Open; Windows: install the vendor driver, pick the spooler queue; nothing prints over USB on Linux → udev rule example).
- [ ] **Step 3: Final checks**: `pnpm typecheck && pnpm test && pnpm build` all green; `git status` clean after commit.
- [ ] **Step 4: Commit** `docs: repo and app READMEs`.
