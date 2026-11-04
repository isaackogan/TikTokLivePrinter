import { run, voiceCommand } from "./commands.ts";

/** Text to speech through whatever the OS ships. Best effort: missing tools are ignored. */
export class VoiceEngine {
  speak(text: string): Promise<void> {
    return run(voiceCommand(process.platform, text));
  }
}
