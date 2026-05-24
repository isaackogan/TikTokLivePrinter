export type TextStyle = { bold?: boolean; align?: "left" | "center" | "right"; size?: 1 | 2 };

export type RgbaImage = { width: number; height: number; data: Uint8ClampedArray };

export type PrintItem =
  | { type: "text"; content: string; style: TextStyle }
  | { type: "image"; image: RgbaImage; width?: number }
  | { type: "line" }
  | { type: "feed"; lines: number }
  | { type: "cut" }
  | { type: "voice"; content: string }
  | { type: "sound"; path: string };

export const Text = (content: string, style: TextStyle = {}): PrintItem => ({ type: "text", content, style });
export const Image = (image: RgbaImage, width?: number): PrintItem => ({ type: "image", image, width });
export const Line = (): PrintItem => ({ type: "line" });
export const Feed = (lines = 1): PrintItem => ({ type: "feed", lines });
export const Cut = (): PrintItem => ({ type: "cut" });
export const Voice = (content: string): PrintItem => ({ type: "voice", content });
export const Sound = (path: string): PrintItem => ({ type: "sound", path });
