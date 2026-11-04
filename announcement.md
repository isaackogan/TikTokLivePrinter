# 🧾 TikTok Live Printer is here (new repo + no-code app)

The old Python TikTokPrinter is retired. It's been rebuilt from scratch in TypeScript, open source, and it now comes in two flavours:

**🖨️ The app (no code)**
One file for macOS, Windows and Linux. Run it, your browser opens, pick your printer, drag-and-drop the receipts you want, hit Start. Prints gifts, follows, shares, likes, comments, joins and subs to any ESC/POS thermal printer (the cheap 58 mm USB ones work great).
- Avatar + `@username` + `THANKS FOR 3 X Rose` out of the box
- Filters: minimum diamonds, specific gifts, every N likes
- Text-to-speech blocks, light/dark mode, export/import your setup as JSON
- Windows prints through the driver you already have, no Zadig nonsense

**📦 The library (Node.js)**
`npm install tiktok-live-printer` and build your own printer, overlay or alert in a few lines. Typed LIVE events (schema v3), a print queue that never interleaves receipts, USB / system printer / network transports, image dithering tuned for thermal paper.

Both run on the Euler Stream WebSocket, so you need an Euler Stream API key.

🔗 **Links**
- Docs: <https://ttlp.docs.isaackogan.com/>
- GitHub: <https://github.com/isaackogan/TikTokLivePrinter>
- Downloads: <https://github.com/isaackogan/TikTokLivePrinter/releases>
- npm: <https://www.npmjs.com/package/tiktok-live-printer>

Found a bug or want a block type that's missing? Open an issue on GitHub. Enjoy the paper. 🧻
