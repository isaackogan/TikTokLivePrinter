import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_KEY, applyTheme, currentTheme, toggleTheme } from "./theme.ts";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  });

  it("follows the system preference when nothing is stored", () => {
    expect(currentTheme()).toBe("light");
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    expect(currentTheme()).toBe("dark");
  });

  it("applyTheme sets the dark class from the stored choice", () => {
    localStorage.setItem(THEME_KEY, "dark");
    applyTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggleTheme flips, stores and applies the choice", () => {
    expect(toggleTheme()).toBe("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(toggleTheme()).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
