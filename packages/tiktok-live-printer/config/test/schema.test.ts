import { describe, expect, it } from "vitest";
import { defaultConfig, newBlock, newTrigger } from "../src/defaults.ts";
import { parseConfig } from "../src/schema.ts";

describe("parseConfig", () => {
  it("accepts the default config", () => {
    const result = parseConfig(defaultConfig());
    expect(result.ok).toBe(true);
  });

  it("rejects a non-object with a message", () => {
    const result = parseConfig("nope");
    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.error.length > 0).toBe(true);
  });

  it("rejects an unknown block type naming the path", () => {
    const config = defaultConfig();
    (config.triggers[0]!.blocks[0] as { type: string }).type = "hologram";
    const result = parseConfig(config);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/triggers\.0\.blocks\.0/);
  });

  it("rejects a wrong version", () => {
    expect(parseConfig({ ...defaultConfig(), version: 2 }).ok).toBe(false);
  });
});

describe("defaults", () => {
  it("default config reproduces the reference gift receipt", () => {
    const [trigger] = defaultConfig().triggers;
    expect(trigger?.event).toBe("gift");
    expect(trigger?.blocks.map((b) => b.type)).toEqual(["avatar", "text", "text", "line", "feed"]);
  });

  it("newTrigger and newBlock produce valid pieces with unique ids", () => {
    const a = newTrigger("follow");
    const b = newTrigger("follow");
    expect(a.id).not.toBe(b.id);
    expect(newBlock("text")).toMatchObject({ type: "text", template: expect.any(String) });
    expect(parseConfig({ ...defaultConfig(), triggers: [a, b] }).ok).toBe(true);
  });
});
