# TikTok Live Printer

Print TikTok LIVE gifts, follows, comments and more to a thermal receipt printer.

This repository holds two deliverables built on the [Euler Stream](https://www.eulerstream.com) WebSocket service:

- **`tiktok-live-printer`** (`libraries/tiktok-live-printer`) — the public npm library for building your own TikTok LIVE printers in TypeScript.
- **`@tiktok-live-printer/app`** (`apps/tiktok-live-printer`) — a no-code desktop app shipped as a single binary for macOS, Windows and Linux. It opens a local web UI where you configure receipts by dragging and dropping blocks.

The original Python library lives on the `legacy/archived-python-library` branch.

## Development

```bash
pnpm install
pnpm dev        # library + config in watch mode, web dev server, app server
pnpm test
pnpm typecheck
pnpm build      # builds every package; the app build produces the binary for this machine
```

See `docs/superpowers/specs` for the design and `docs/superpowers/plans` for the implementation plan.
