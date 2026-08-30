import { defaultConfig } from "@tiktok-live-printer/config";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, applyImport, exportConfig, importConfig, loadConfig, setConfig } from "./store.ts";

describe("importConfig", () => {
  it("rejects invalid JSON with a message", () => {
    expect(importConfig("{nope")).toMatchObject({ ok: false, error: expect.stringMatching(/JSON/) });
  });

  it("rejects valid JSON that is not a config", () => {
    expect(importConfig(JSON.stringify({ hello: 1 }))).toMatchObject({ ok: false });
  });

  it("round-trips through exportConfig", () => {
    const config = { ...defaultConfig(), uniqueId: "someone" };
    expect(importConfig(exportConfig(config))).toEqual({ ok: true, config });
  });
});

describe("loadConfig", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the default config when storage holds garbage", () => {
    localStorage.setItem(STORAGE_KEY, "garbage");
    const loaded = loadConfig();
    expect(loaded.uniqueId).toBe("");
    expect(loaded.triggers.map((t) => t.event)).toEqual(["gift"]);
  });

  it("returns the stored config when it is valid", () => {
    const config = { ...defaultConfig(), uniqueId: "stored" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    expect(loadConfig()).toEqual(config);
  });
});

describe("applyImport", () => {
  beforeEach(() => localStorage.clear());

  it("returns an error and leaves the current config alone for a bad file", () => {
    setConfig({ ...defaultConfig(), uniqueId: "keep-me" });
    const error = applyImport('{"version":1}');
    expect(error).toMatch(/uniqueId|printer|triggers/);
    expect(loadConfig().uniqueId).toBe("keep-me");
  });

  it("replaces the config for a good file", () => {
    expect(applyImport(exportConfig({ ...defaultConfig(), uniqueId: "imported" }))).toBeUndefined();
    expect(loadConfig().uniqueId).toBe("imported");
  });
});
