import { describe, expect, it } from "vitest";
import { UsbTransport } from "../src/printer/usb.ts";

class FlakyUsb extends UsbTransport {
  attempts = 0;
  protected override async open(): ReturnType<UsbTransport["open"]> {
    this.attempts++;
    if (this.attempts === 1) throw new Error("printer is off");
    const device = { transferOut: async (_ep: number, data: Uint8Array) => ({ status: "ok" as const, bytesWritten: data.length }), releaseInterface: async () => {}, close: async () => {} };
    return { device: device as never, endpoint: 3 };
  }
}

describe("UsbTransport", () => {
  it("retries opening the printer on the next job after a failed open", async () => {
    const transport = new FlakyUsb();
    await expect(transport.write(new Uint8Array([1]))).rejects.toThrow(/off/);
    await expect(transport.write(new Uint8Array([1]))).resolves.toBeUndefined();
    expect(transport.attempts).toBe(2);
  });
});
