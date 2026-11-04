# TikTok Live Printer app

A no-code gift printer. Download one file, run it, and your browser opens a page where you pick the printer and build receipts by dragging blocks around.

## Install

1. Download the binary for your computer from the [latest release](https://github.com/isaackogan/TikTokLivePrinter/releases): `darwin-arm64` (Apple Silicon Mac), `darwin-x64` (Intel Mac), `windows-x64`, or `linux-x64`.
2. Run it. It starts a local server on `http://127.0.0.1:7474` and opens your browser. Nothing leaves your machine except the connection to Euler Stream.
3. Plug in the printer.

## Set up

1. **Connection:** enter the TikTok username to print for and your Euler Stream API key (get one at [eulerstream.com](https://www.eulerstream.com)).
2. **Printer:** leave the connection on Automatic, or pick USB / System printer / Network. Click **Test print**. A short receipt should come out.
3. **Receipts:** the default receipt prints the sender's avatar, `@username` and `THANKS FOR 1 X Rose` for every gift. Add receipts for follows, shares, likes, comments, joins and subscriptions. Each receipt is a list of blocks: avatar, gift image, text, line, blank lines, cut, voice. Drag the handle to reorder; use `{username}`, `{nickname}`, `{gift}`, `{count}`, `{diamonds}`, `{comment}` and `{likes}` in text.
4. **Run:** click **Start printing**. The log shows every event that printed.

Your configuration is saved in the browser. **Export** downloads it as JSON so you can back it up or share it; **Import** loads one back.

## Troubleshooting

- **macOS says the app is from an unidentified developer.** Right-click the binary, choose Open, then Open again.
- **Windows: nothing prints over USB.** Choose *System printer* and pick the queue the vendor driver created (usually named after the printer model). Do not install WinUSB / Zadig; it would break the printer for other apps.
- **Linux: permission denied on USB.** Add a udev rule, for example `/etc/udev/rules.d/99-receipt-printer.rules` with `SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666"`, then replug the printer.
- **Status says "Must provide either apiKey or jwtKey".** Add your Euler Stream API key under Connection.
- **Status says "The specified user is not currently live".** The creator has to be live before you start.
- **Port 7474 is busy.** The app tries the next few ports and prints the one it picked in the terminal.
