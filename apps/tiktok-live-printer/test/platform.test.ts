import { describe, expect, it } from "vitest";
import { napiPlatform } from "../scripts/platform.ts";

describe("napiPlatform", () => {
  it("names the spooler addon the way napi-rs does per platform", () => {
    expect(napiPlatform("linux", "x64")).toBe("linux-x64-gnu");
    expect(napiPlatform("windows", "x64")).toBe("win32-x64-msvc");
    expect(napiPlatform("darwin", "arm64")).toBe("darwin-arm64");
    expect(napiPlatform("darwin", "x64")).toBe("darwin-x64");
  });
});
