import type { Config, PrinterConfig } from "@tiktok-live-printer/config";
import { Cut, Feed, Line, PrinterEngine, Text, type UsbPrinterInfo, listSpoolerQueues, listUsbPrinters } from "tiktok-live-printer";

export async function listPrinters(): Promise<{ usb: UsbPrinterInfo[]; spooler: string[] }> {
  const [usb, spooler] = await Promise.all([listUsbPrinters().catch(() => []), listSpoolerQueues().catch(() => [])]);
  return { usb, spooler };
}

export function resolveTransport(transport: PrinterConfig["transport"]): Exclude<PrinterConfig["transport"], "auto"> {
  return transport === "auto" ? (process.platform === "win32" ? "spooler" : "usb") : transport;
}

export function createEngine(printer: PrinterConfig): PrinterEngine {
  const opts = { width: printer.width };
  switch (resolveTransport(printer.transport)) {
    case "usb":
      return PrinterEngine.usb({ ...opts, vendorId: printer.vendorId, productId: printer.productId });
    case "spooler":
      return PrinterEngine.spooler({ ...opts, queue: printer.queue });
    case "network":
      return PrinterEngine.network({ ...opts, host: printer.host ?? "", port: printer.port });
    case "console":
      return PrinterEngine.console(opts);
  }
}

export async function testPrint(config: Config): Promise<void> {
  const engine = createEngine(config.printer);
  try {
    await engine.print([Text("TikTok Live Printer", { bold: true, align: "center", size: 2 }), Text(`via ${resolveTransport(config.printer.transport)}`, { align: "center" }), Line(), Text("If you can read this, you are ready to go.", { align: "center" }), Feed(3), Cut()]);
  } finally {
    await engine.close();
  }
}
