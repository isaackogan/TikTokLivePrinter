import { usb } from "usb";
import type { Transport } from "./transport.ts";

type UsbDevice = Awaited<ReturnType<typeof usb.getDevices>>[number];

export type UsbPrinterInfo = { vendorId: number; productId: number; name: string };

const PRINTER_CLASS = 7;
const CHUNK = 4096;

const GET_CONFIG_DESCRIPTOR = { requestType: "standard", recipient: "device", request: 6, value: 0x0200, index: 0 } as const;

type Descriptors = { printerInterface: boolean; bulkOut?: number };

/**
 * Reads the configuration descriptor directly. Cheap printers ship broken string
 * descriptors that make the `configuration` getter throw, so we parse the bytes ourselves.
 */
async function readDescriptors(device: UsbDevice): Promise<Descriptors> {
  const res = await device.controlTransferIn(GET_CONFIG_DESCRIPTOR, 255);
  const d = res.data ? new Uint8Array(res.data.buffer, res.data.byteOffset, res.data.byteLength) : new Uint8Array();
  const out: Descriptors = { printerInterface: false };
  for (let i = 0; i + 1 < d.length && d[i]! > 0; i += d[i]!) {
    const type = d[i + 1];
    if (type === 4 && d[i + 5] === PRINTER_CLASS) out.printerInterface = true;
    if (type === 5 && out.bulkOut === undefined && (d[i + 3]! & 3) === 2 && (d[i + 2]! & 0x80) === 0) out.bulkOut = d[i + 2]! & 0x0f;
  }
  return out;
}

function deviceName(device: UsbDevice): string {
  try {
    const name = [device.manufacturerName, device.productName].filter(Boolean).join(" ");
    if (name) return name;
  } catch {}
  return `USB ${hex(device.vendorId)}:${hex(device.productId)}`;
}

const hex = (n: number) => n.toString(16).padStart(4, "0");

async function isPrinter(device: UsbDevice): Promise<boolean> {
  if (device.deviceClass === PRINTER_CLASS) return true;
  if (device.deviceClass !== 0) return false;
  try {
    await device.open();
    return (await readDescriptors(device)).printerInterface;
  } catch {
    return false;
  } finally {
    await device.close().catch(() => {});
  }
}

export async function listUsbPrinters(): Promise<UsbPrinterInfo[]> {
  const found: UsbPrinterInfo[] = [];
  for (const device of await usb.getDevices()) {
    if (await isPrinter(device)) found.push({ vendorId: device.vendorId, productId: device.productId, name: deviceName(device) });
  }
  return found;
}

/** Direct USB printing. Works without drivers on macOS and Linux; Windows needs WinUSB, prefer the spooler there. */
export class UsbTransport implements Transport {
  private device?: ReturnType<UsbTransport["open"]>;

  constructor(private readonly opts: { vendorId?: number; productId?: number } = {}) {}

  async write(bytes: Uint8Array): Promise<void> {
    const { device, endpoint } = await (this.device ??= this.open().catch((err) => {
      this.device = undefined;
      throw err;
    }));
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const result = await device.transferOut(endpoint, bytes.slice(i, i + CHUNK) as Uint8Array<ArrayBuffer>).catch((err) => ({ status: String(err) }));
      if (result.status !== "ok") {
        await this.close();
        throw new Error(`USB transfer failed: ${result.status}`);
      }
    }
  }

  async close(): Promise<void> {
    const opened = await this.device?.catch(() => undefined);
    this.device = undefined;
    if (!opened) return;
    await opened.device.releaseInterface(0).catch(() => {});
    await opened.device.close().catch(() => {});
  }

  protected async open(): Promise<{ device: Pick<UsbDevice, "transferOut" | "releaseInterface" | "close">; endpoint: number }> {
    const device = await this.find();
    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);
    const { bulkOut } = await readDescriptors(device);
    if (bulkOut === undefined) throw new Error("USB printer has no bulk OUT endpoint");
    return { device, endpoint: bulkOut };
  }

  private async find(): Promise<UsbDevice> {
    const { vendorId, productId } = this.opts;
    if (vendorId !== undefined && productId !== undefined) {
      const device = await usb.findDeviceByIds(vendorId, productId);
      if (!device) throw new Error(`USB printer ${hex(vendorId)}:${hex(productId)} not found`);
      return device;
    }
    for (const device of await usb.getDevices()) if (await isPrinter(device)) return device;
    throw new Error("No USB printer found");
  }
}
