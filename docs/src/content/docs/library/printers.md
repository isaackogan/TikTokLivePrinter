---
title: Printer engines
description: "Connect tiktok-live-printer to ESC/POS thermal printers over USB, the Windows or CUPS spooler, TCP port 9100, or a console engine for development."
sidebar:
  order: 2
---

A `PrinterEngine` encodes print items to ESC/POS and sends each job to one transport. Create one with a static factory and pass it to the client.

| Factory | Transport | Notes |
| --- | --- | --- |
| `PrinterEngine.usb({ vendorId?, productId? })` | Direct USB via `usb` (no libusb, no driver) | macOS and Linux. Omit the ids to use the first printer-class device. |
| `PrinterEngine.spooler({ queue? })` | OS print spooler (winspool on Windows, CUPS elsewhere) | Needs the optional dependency `@printers/printers`. Default queue: the first whose name looks like a receipt printer. |
| `PrinterEngine.network({ host, port = 9100 })` | Raw TCP | Ethernet and Wi-Fi printers. |
| `PrinterEngine.console()` | `console.log` | Development without a printer. |

Every factory also takes `width: 384` (58 mm, default) or `width: 576` (80 mm) and `imageGamma` (default `1.6`), a lift applied to images before dithering so profile pictures do not print too dark.

## Finding printers

```ts
import { listSpoolerQueues, listUsbPrinters } from "tiktok-live-printer";

console.log(await listUsbPrinters());     // [{ vendorId: 1046, productId: 20497, name: "POS58 Printer USB" }]
console.log(await listSpoolerQueues());   // ["POS58 Printer"]
```

## Platform notes

- **macOS:** USB works without a driver; the kernel does not claim printer-class interfaces. Cheap printers often ship broken string descriptors, so the transport reads the configuration descriptor itself to find the bulk OUT endpoint.
- **Windows:** use the spooler with the vendor's driver. Do not replace the driver with WinUSB (Zadig); that breaks the printer for other software.
- **Linux:** USB needs a udev rule granting your user access, or add the printer to CUPS as a raw queue and use the spooler engine.

## Your own transport

Implement `Transport` (`write(bytes: Uint8Array): Promise<void>` and `close(): Promise<void>`) and pass it to `new PrinterEngine(transport, { width })`. Bluetooth or serial printers fit here.
