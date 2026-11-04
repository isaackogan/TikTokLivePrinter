# TikTok Live Printer

Print TikTok LIVE gifts, follows, comments and more to a thermal receipt printer.

Built on the [Euler Stream](https://www.eulerstream.com) WebSocket service (schema v3). Two deliverables live here:

| | Package | Where | What |
| --- | --- | --- | --- |
| Library | [`tiktok-live-printer`](libraries/tiktok-live-printer) | npm, public | Build your own printer in TypeScript: typed LIVE events, a serial print queue, ESC/POS text and images over USB, the system spooler, or TCP. |
| App | [`@tiktok-live-printer/app`](apps/tiktok-live-printer) | GitHub Releases | No-code gift printer. One binary for macOS, Windows and Linux that opens a local web UI where you drag and drop receipt blocks. |

The private packages under `packages/tiktok-live-printer` hold the shared config schema (`@tiktok-live-printer/config`) and the React UI (`@tiktok-live-printer/web`).

The original Python library is archived on the `legacy/archived-python-library` branch.

## Development

```bash
pnpm install
pnpm test            # vitest in every package
pnpm typecheck
pnpm build           # libraries, web UI, then the app binary for this machine
pnpm --filter @tiktok-live-printer/web dev      # UI with hot reload on :5173, proxies /api to :7474
pnpm --filter @tiktok-live-printer/app dev      # Bun server on :7474 (set TLP_STATIC_DIR to serve a built UI)
```

Node 22+, pnpm 11. Bun is installed as a dev dependency and only needed by the app.

## Releasing

- **Library to npm:** run the "Release: Publish tiktok-live-printer" workflow from `main` with a version bump. It uses npm trusted publishing (GitHub OIDC), so no token is stored: the package on npmjs.com must list `isaackogan/TikTokPrinter` with workflow `release-tiktok-live-printer.yml` as a trusted publisher.
- **App binaries:** run the "Release: Build app binaries" workflow with a version, or push an `app-v*` tag. Each OS builds its own binary and they are attached to a GitHub Release. macOS binaries are ad-hoc signed; users may need to right-click → Open the first time.

## Platform notes

- **macOS / Linux:** the app talks to USB printers directly, no driver. Linux users may need a udev rule so their account can open the device.
- **Windows:** the app prints through the printer driver already installed by the vendor. Never replace that driver with WinUSB (Zadig).
- Network printers work everywhere over TCP port 9100.
