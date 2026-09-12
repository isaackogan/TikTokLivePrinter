import { type Block, renderTemplate } from "@tiktok-live-printer/config";
import { Cut, Feed, Image, Line, type PrintItem, type RgbaImage, Text, Voice } from "tiktok-live-printer";
import type { TriggerMatch } from "./context.ts";

type Fetch = (url: string) => Promise<RgbaImage>;

async function imageItem(url: string | undefined, width: number, fetch: Fetch): Promise<PrintItem | undefined> {
  if (!url) return undefined;
  try {
    return Image(await fetch(url), width);
  } catch {
    return undefined;
  }
}

/** Resolves a receipt's blocks into print items. Images that cannot be fetched are left out. */
export async function renderBlocks(blocks: Block[], match: TriggerMatch, fetch: Fetch): Promise<PrintItem[]> {
  const items: (PrintItem | undefined)[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "avatar":
        items.push(await imageItem(match.avatarUrl, block.width, fetch));
        break;
      case "giftImage":
        items.push(await imageItem(match.giftImageUrl, block.width, fetch));
        break;
      case "text":
        items.push(Text(renderTemplate(block.template, match.ctx), { bold: block.bold, align: block.align, size: block.size }));
        break;
      case "voice":
        items.push(Voice(renderTemplate(block.template, match.ctx)));
        break;
      case "line":
        items.push(Line());
        break;
      case "feed":
        items.push(Feed(block.lines));
        break;
      case "cut":
        items.push(Cut());
        break;
    }
  }
  return items.filter((i): i is PrintItem => i !== undefined);
}
