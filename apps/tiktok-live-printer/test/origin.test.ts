import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "../src/origin.ts";

describe("isAllowedOrigin", () => {
  it("allows requests without an Origin header and same-origin pages", () => {
    expect(isAllowedOrigin(null, 7474)).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:7474", 7474)).toBe(true);
    expect(isAllowedOrigin("http://localhost:7474", 7474)).toBe(true);
  });

  it("rejects other websites", () => {
    expect(isAllowedOrigin("https://evil.example", 7474)).toBe(false);
    expect(isAllowedOrigin("http://127.0.0.1:5173", 7474)).toBe(false);
  });
});
