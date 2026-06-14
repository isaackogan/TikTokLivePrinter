import { execFile } from "node:child_process";

const commands: Partial<Record<NodeJS.Platform, (text: string) => [string, string[]]>> = {
  darwin: (text) => ["say", [text]],
  linux: (text) => ["espeak", [text]],
  win32: (text) => ["powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(${psString(text)})`]],
};

export const psString = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve) => execFile(command, args, () => resolve()));
}

/** Text to speech through whatever the OS ships. Best effort: missing tools are ignored. */
export class VoiceEngine {
  async speak(text: string): Promise<void> {
    const build = commands[process.platform];
    if (build) await run(...build(text));
  }
}
