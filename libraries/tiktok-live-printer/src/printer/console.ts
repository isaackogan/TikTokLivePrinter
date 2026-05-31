import type { Transport } from "./transport.ts";

/** Logs the printable text of each job. Handy for development without a printer. */
export class ConsoleTransport implements Transport {
  async write(bytes: Uint8Array): Promise<void> {
    const text = new TextDecoder().decode(bytes).replace(/[^\x20-\x7e\n]/g, "");
    console.log(text.replace(/\n{3,}/g, "\n\n").trim());
  }

  async close(): Promise<void> {}
}

/** Keeps every chunk in memory. For tests. */
export class MemoryTransport implements Transport {
  readonly chunks: Uint8Array[] = [];

  async write(bytes: Uint8Array): Promise<void> {
    this.chunks.push(bytes);
  }

  async close(): Promise<void> {}
}
