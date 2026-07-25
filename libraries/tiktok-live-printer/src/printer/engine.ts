import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { lighten } from "../image.ts";
import type { PrintItem, TextStyle } from "../items.ts";
import { ConsoleTransport } from "./console.ts";
import { NetworkTransport } from "./network.ts";
import { SpoolerTransport } from "./spooler.ts";
import type { Transport } from "./transport.ts";
import { UsbTransport } from "./usb.ts";

export type PaperWidth = 384 | 576;
/** `imageGamma` above 1 lifts midtones before dithering; 1 prints images as they are. */
export type EngineOptions = { width?: PaperWidth; imageGamma?: number };

const DOTS_PER_COLUMN = 12;
const DEFAULT_IMAGE_GAMMA = 1.6;

/** Encodes print items to ESC/POS and sends each job to a transport in one write. */
export class PrinterEngine {
  readonly width: PaperWidth;
  readonly imageGamma: number;

  constructor(
    private readonly transport: Transport,
    opts: EngineOptions = {},
  ) {
    this.width = opts.width ?? 384;
    this.imageGamma = opts.imageGamma ?? DEFAULT_IMAGE_GAMMA;
  }

  static usb(opts: { vendorId?: number; productId?: number } & EngineOptions = {}): PrinterEngine {
    return new PrinterEngine(new UsbTransport(opts), opts);
  }

  static spooler(opts: { queue?: string } & EngineOptions = {}): PrinterEngine {
    return new PrinterEngine(new SpoolerTransport(opts), opts);
  }

  static network(opts: { host: string; port?: number } & EngineOptions): PrinterEngine {
    return new PrinterEngine(new NetworkTransport(opts.host, opts.port), opts);
  }

  static console(opts: EngineOptions = {}): PrinterEngine {
    return new PrinterEngine(new ConsoleTransport(), opts);
  }

  get columns(): number {
    return this.width / DOTS_PER_COLUMN;
  }

  encode(items: PrintItem[]): Uint8Array {
    const encoder = new ReceiptPrinterEncoder({ language: "esc-pos", columns: this.columns, imageMode: "raster", feedBeforeCut: 0 }).initialize();
    for (const item of items) this.encodeItem(encoder, item);
    return encoder.encode();
  }

  async print(items: PrintItem[]): Promise<void> {
    const printable = items.filter((item) => item.type !== "voice" && item.type !== "sound");
    if (printable.length) await this.transport.write(this.encode(printable));
  }

  close(): Promise<void> {
    return this.transport.close();
  }

  private encodeItem(encoder: ReceiptPrinterEncoder, item: PrintItem): void {
    switch (item.type) {
      case "text":
        return this.encodeText(encoder, item.content, item.style);
      case "image": {
        const width = Math.floor(Math.min(item.width ?? this.width, this.width) / 8) * 8;
        encoder.align("center").image(lighten(item.image, this.imageGamma), { width, algorithm: "atkinson" }).align("left");
        return;
      }
      case "line":
        encoder.line("-".repeat(this.columns));
        return;
      case "feed":
        encoder.newline(item.lines);
        return;
      case "cut":
        encoder.cut("partial");
        return;
    }
  }

  private encodeText(encoder: ReceiptPrinterEncoder, content: string, style: TextStyle): void {
    encoder.align(style.align ?? "left").bold(style.bold ?? false).size(style.size ?? 1, style.size ?? 1);
    encoder.line(content);
    encoder.size(1, 1).bold(false).align("left");
  }
}
