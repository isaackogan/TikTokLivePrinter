import { run, soundCommand } from "./commands.ts";

/** Plays a sound file through whatever the OS ships. Best effort: missing tools are ignored. */
export class SoundEngine {
  play(path: string): Promise<void> {
    return run(soundCommand(process.platform, path));
  }
}
