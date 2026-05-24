import { describe, expect, it } from "vitest";
import { PrintQueue } from "../src/queue.ts";
import { Text } from "../src/items.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("PrintQueue", () => {
  it("runs jobs one at a time in push order", async () => {
    const gates = [deferred(), deferred(), deferred()];
    const started: number[] = [];
    const queue = new PrintQueue(async (items) => {
      const n = Number((items[0] as { content: string }).content);
      started.push(n);
      await gates[n - 1]!.promise;
    });
    const jobs = [1, 2, 3].map((n) => queue.push([Text(String(n))]));

    await Promise.resolve();
    expect(started).toEqual([1]);
    expect(queue.size).toBe(3);

    gates[0]!.resolve();
    await jobs[0];
    expect(started).toEqual([1, 2]);

    gates[1]!.resolve();
    gates[2]!.resolve();
    await Promise.all(jobs);
    expect(started).toEqual([1, 2, 3]);
    expect(queue.size).toBe(0);
  });

  it("continues after a failing job", async () => {
    const errors: Error[] = [];
    const ran: string[] = [];
    const queue = new PrintQueue(
      async (items) => {
        const content = (items[0] as { content: string }).content;
        if (content === "bad") throw new Error("boom");
        ran.push(content);
      },
      (err) => errors.push(err),
    );
    await queue.push([Text("bad")]);
    await queue.push([Text("good")]);
    expect(errors.map((e) => e.message)).toEqual(["boom"]);
    expect(ran).toEqual(["good"]);
  });
});
