import { type Config, defaultConfig, parseConfig } from "@tiktok-live-printer/config";
import { useSyncExternalStore } from "react";

export const STORAGE_KEY = "tiktok-live-printer:config";

export type ImportResult = { ok: true; config: Config } | { ok: false; error: string };

export function importConfig(text: string): ImportResult {
  try {
    return parseConfig(JSON.parse(text));
  } catch (err) {
    return { ok: false, error: `Not valid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export function exportConfig(config: Config): string {
  return JSON.stringify(config, null, 2);
}

export function loadConfig(): Config {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const result = stored ? importConfig(stored) : undefined;
    if (result?.ok) return result.config;
  } catch {}
  return defaultConfig();
}

let current: Config | undefined;
const listeners = new Set<() => void>();

function get(): Config {
  return (current ??= loadConfig());
}

export function setConfig(next: Config): void {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, exportConfig(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConfig(): [Config, (update: (c: Config) => Config) => void] {
  const config = useSyncExternalStore(subscribe, get, get);
  return [config, (update) => setConfig(update(get()))];
}
