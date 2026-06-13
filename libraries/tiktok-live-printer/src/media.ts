import type { Gift, ImageModel, User } from "@eulerstream/euler-websocket-sdk/v3";
import { Jimp } from "jimp";
import type { RgbaImage } from "./items.ts";

const DECODABLE = /\.(jpe?g|png)(\?|$)/i;
const WEBP = /\.webp(\?|$)/i;

/** Picks a URL our decoder can read. TikTok usually offers a JPEG next to each WebP; otherwise we ask for one. */
export function pickImageUrl(image: Pick<ImageModel, "urlList"> | undefined): string | undefined {
  const urls = image?.urlList ?? [];
  return urls.find((u) => DECODABLE.test(u)) ?? urls.find((u) => WEBP.test(u))?.replace(WEBP, ".jpeg$1") ?? urls[0];
}

export function avatarUrl(user: Pick<User, "avatarThumb" | "avatarMedium"> | undefined): string | undefined {
  return pickImageUrl(user?.avatarThumb) ?? pickImageUrl(user?.avatarMedium);
}

export function giftImageUrl(gift: Pick<Gift, "image" | "icon"> | undefined): string | undefined {
  return pickImageUrl(gift?.image) ?? pickImageUrl(gift?.icon);
}

export async function fetchImage(url: string, opts: { timeoutMs?: number } = {}): Promise<RgbaImage> {
  const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000) });
  if (!res.ok) throw new Error(`Image fetch failed with ${res.status} for ${url}`);
  const { bitmap } = await Jimp.read(Buffer.from(await res.arrayBuffer()));
  return { width: bitmap.width, height: bitmap.height, data: new Uint8ClampedArray(bitmap.data.buffer, bitmap.data.byteOffset, bitmap.data.byteLength) };
}
