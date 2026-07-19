import type { Block, BlockType, Config, Trigger, TriggerEvent } from "./schema.ts";

const id = () => Math.random().toString(36).slice(2, 10);

export function textBlock(template: string, bold = false): Block {
  return { id: id(), type: "text", template, bold, align: "center", size: 1 };
}

export function newBlock(type: BlockType): Block {
  switch (type) {
    case "avatar":
    case "giftImage":
      return { id: id(), type, width: 160 };
    case "text":
      return textBlock("@{username}");
    case "feed":
      return { id: id(), type, lines: 2 };
    case "voice":
      return { id: id(), type, template: "Thank you {username}" };
    default:
      return { id: id(), type };
  }
}

export function newTrigger(event: TriggerEvent): Trigger {
  return { id: id(), event, enabled: true, filter: {}, blocks: [] };
}

/** One gift trigger that prints the classic receipt: avatar, @username, THANKS FOR n X gift. */
export function defaultConfig(): Config {
  return {
    version: 1,
    uniqueId: "",
    printer: { transport: "auto", width: 384 },
    triggers: [
      {
        ...newTrigger("gift"),
        blocks: [
          newBlock("avatar"),
          textBlock("@{username}", true),
          textBlock("THANKS FOR {count} X {gift}"),
          newBlock("line"),
          newBlock("feed"),
        ],
      },
    ],
  };
}
