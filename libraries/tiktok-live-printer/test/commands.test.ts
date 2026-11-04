import { describe, expect, it } from "vitest";
import { soundCommand, voiceCommand } from "../src/commands.ts";

describe("voiceCommand", () => {
  it("never lets viewer text be parsed as flags", () => {
    expect(voiceCommand("darwin", "-o /tmp/x.aiff hi")).toEqual(["say", ["--", "-o /tmp/x.aiff hi"]]);
    expect(voiceCommand("linux", "-w out.wav hi")).toEqual(["espeak", ["--", "-w out.wav hi"]]);
    const [cmd, args] = voiceCommand("win32", "it's")!;
    expect(cmd).toBe("powershell");
    expect(args.at(-1)).toContain("'it''s'");
  });

  it("is undefined on platforms without a known tool", () => {
    expect(voiceCommand("freebsd", "x")).toBeUndefined();
  });
});

describe("soundCommand", () => {
  it("builds a player per platform", () => {
    expect(soundCommand("darwin", "/a.wav")).toEqual(["afplay", ["--", "/a.wav"]]);
    expect(soundCommand("linux", "/a.wav")).toEqual(["aplay", ["--", "/a.wav"]]);
  });
});
