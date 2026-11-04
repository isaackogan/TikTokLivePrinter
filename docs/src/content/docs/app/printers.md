---
title: Printers and platforms
description: "Which thermal receipt printers work with TikTok Live Printer and how to connect them on macOS, Windows and Linux over USB, the system printer or the network."
sidebar:
  order: 4
---

Any printer that speaks ESC/POS works: the cheap 58 mm USB receipt printers sold as POS58 or similar, 80 mm kitchen printers, and network receipt printers. Label printers and inkjet or laser printers do not.

## Connection options

| Option | Use when | Notes |
| --- | --- | --- |
| Automatic | you want the default for your OS | USB on macOS and Linux, system printer on Windows |
| USB | the printer is on a USB cable | No driver needed on macOS or Linux. Pick a specific printer when more than one is attached. |
| System printer | the printer is installed in the OS | Sends raw receipt data through the printer's own driver (Windows spooler or CUPS). |
| Network | the printer has an IP address | Plain TCP on port 9100. |
| Console | you have no printer yet | Prints the text of each receipt to the app's terminal. |

## macOS

USB works out of the box: the system does not claim receipt printers, so the app talks to them directly. No driver is needed.

## Windows

Use **System printer** and choose the queue created by the printer's vendor driver, usually named after the model. Do not install WinUSB or Zadig to use the USB option: that replaces the vendor driver and breaks the printer for other software.

## Linux

USB needs permission for your user. Create `/etc/udev/rules.d/99-receipt-printer.rules` with the printer's vendor and product ids (shown in the USB printer list) and replug it:

```
SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666"
```

Alternatively add the printer to CUPS as a raw queue and use **System printer**.

## Paper

Choose 58 mm or 80 mm under Printer. The app lays receipts out at 384 or 576 dots accordingly; a wrong setting wraps text early or clips images.
