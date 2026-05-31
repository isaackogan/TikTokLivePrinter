import type { Transport } from "./transport.ts";

const JOB_NAME = "tiktok-live-printer";
const QUEUE_HINT = /pos|receipt|thermal|printer/i;

async function spooler() {
  try {
    return await import("@printers/printers");
  } catch {
    throw new Error("Spooler printing needs the optional dependency @printers/printers");
  }
}

export async function listSpoolerQueues(): Promise<string[]> {
  return (await spooler()).getAllPrinterNames();
}

/** Prints through the OS print spooler (winspool on Windows, CUPS elsewhere) using the vendor's own driver. */
export class SpoolerTransport implements Transport {
  private queue?: Promise<string>;

  constructor(private readonly opts: { queue?: string } = {}) {}

  async write(bytes: Uint8Array): Promise<void> {
    const queue = await (this.queue ??= this.resolveQueue());
    const options: Record<string, string> = { "job-name": JOB_NAME };
    if (process.platform !== "win32") options["document-format"] = "application/vnd.cups-raw";
    await (await spooler()).printBytes(queue, bytes, options);
  }

  async close(): Promise<void> {}

  private async resolveQueue(): Promise<string> {
    if (this.opts.queue) return this.opts.queue;
    const names = await listSpoolerQueues();
    const queue = names.find((n) => QUEUE_HINT.test(n)) ?? names[0];
    if (!queue) throw new Error("No printer queues found");
    return queue;
  }
}
