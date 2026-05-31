import { connect, type Socket } from "node:net";
import type { Transport } from "./transport.ts";

/** Raw TCP printing, port 9100 on almost every network ESC/POS printer. */
export class NetworkTransport implements Transport {
  private socket?: Promise<Socket>;

  constructor(
    private readonly host: string,
    private readonly port = 9100,
  ) {}

  async write(bytes: Uint8Array): Promise<void> {
    const socket = await (this.socket ??= this.open());
    await new Promise<void>((resolve, reject) => socket.write(bytes, (err) => (err ? reject(err) : resolve())));
  }

  async close(): Promise<void> {
    const socket = await this.socket?.catch(() => undefined);
    socket?.end();
    this.socket = undefined;
  }

  private open(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = connect({ host: this.host, port: this.port });
      socket.once("connect", () => resolve(socket));
      socket.once("error", reject);
      socket.once("close", () => (this.socket = undefined));
    });
  }
}
