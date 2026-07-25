import type { RgbaImage } from "./items.ts";

/** Gamma lift: thermal paper swallows midtones, so avatars dither too dark. Black and white stay put. */
export function lighten(image: RgbaImage, gamma: number): RgbaImage {
  if (gamma === 1) return image;
  const curve = Uint8ClampedArray.from({ length: 256 }, (_, v) => Math.round(255 * (v / 255) ** (1 / gamma)));
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = curve[data[i]!]!;
    data[i + 1] = curve[data[i + 1]!]!;
    data[i + 2] = curve[data[i + 2]!]!;
  }
  return { width: image.width, height: image.height, data };
}
