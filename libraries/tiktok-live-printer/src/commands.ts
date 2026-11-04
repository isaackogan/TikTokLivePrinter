import { execFile } from "node:child_process";

type Command = [string, string[]];

const psString = (s: string) => `'${s.replace(/'/g, "''")}'`;

// Viewer text ends up in argv, so `--` keeps it from being read as flags.
export function voiceCommand(platform: string, text: string): Command | undefined {
  switch (platform) {
    case "darwin":
      return ["say", ["--", text]];
    case "linux":
      return ["espeak", ["--", text]];
    case "win32":
      return ["powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak(${psString(text)})`]];
    default:
      return undefined;
  }
}

export function soundCommand(platform: string, path: string): Command | undefined {
  switch (platform) {
    case "darwin":
      return ["afplay", ["--", path]];
    case "linux":
      return ["aplay", ["--", path]];
    case "win32":
      return ["powershell", ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer ${psString(path)}).PlaySync()`]];
    default:
      return undefined;
  }
}

/** Runs a command and resolves when it exits; a missing tool is not an error. */
export function run(command: Command | undefined): Promise<void> {
  if (!command) return Promise.resolve();
  return new Promise((resolve) => execFile(command[0], command[1], () => resolve()));
}
