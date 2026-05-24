import type { PrintItem } from "./items.ts";

type Runner = (items: PrintItem[]) => Promise<void>;

/** Runs print jobs strictly one after another so receipts never interleave. */
export class PrintQueue {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  constructor(
    private readonly run: Runner,
    private readonly onError: (err: Error) => void = (err) => console.error(err),
  ) {}

  get size(): number {
    return this.pending;
  }

  push(items: PrintItem[]): Promise<void> {
    this.pending++;
    const job = this.tail
      .then(() => this.run(items))
      .catch((err) => this.onError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => this.pending--);
    this.tail = job;
    return job;
  }

  drain(): Promise<void> {
    return this.tail;
  }
}
