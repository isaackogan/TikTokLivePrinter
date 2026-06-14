import { psString, run } from "./voice.ts";

const commands: Partial<Record<NodeJS.Platform, (path: string) => [string, string[]]>> = {
  darwin: (path) => ["afplay", [path]],
  linux: (path) => ["aplay", [path]],
  win32: (path) => ["powershell", ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer ${psString(path)}).PlaySync()`]],
};

/** Plays a sound file through whatever the OS ships. Best effort: missing tools are ignored. */
export class SoundEngine {
  async play(path: string): Promise<void> {
    const build = commands[process.platform];
    if (build) await run(...build(path));
  }
}
