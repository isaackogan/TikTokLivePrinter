export const THEME_KEY = "tiktok-live-printer:theme";

export type Theme = "light" | "dark";

function stored(): Theme | undefined {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** The stored choice, else whatever the OS prefers. */
export function currentTheme(): Theme {
  return stored() ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

export function applyTheme(): Theme {
  const theme = currentTheme();
  document.documentElement.classList.toggle("dark", theme === "dark");
  return theme;
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {}
  return applyTheme();
}
