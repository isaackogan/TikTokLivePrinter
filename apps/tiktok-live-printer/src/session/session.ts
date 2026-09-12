import type { Config, Trigger } from "@tiktok-live-printer/config";
import { TikTokPrinterClient, fetchImage } from "tiktok-live-printer";
import { createEngine } from "../printers.ts";
import { matchEvent, passesFilter } from "./context.ts";
import { renderBlocks } from "./render.ts";

export type SessionStatus = { state: "idle" | "connecting" | "connected" | "disconnected"; detail?: string };

const SOURCE_EVENTS: Record<Trigger["event"], string> = {
  gift: "WebcastGiftMessage",
  comment: "WebcastChatMessage",
  like: "WebcastLikeMessage",
  follow: "WebcastSocialMessage",
  share: "WebcastSocialMessage",
  join: "WebcastMemberMessage",
  subscribe: "WebcastSubNotifyMessage",
};

/** One running printer: a client for the configured creator, printing every enabled trigger that matches. */
export class Session {
  private readonly client: TikTokPrinterClient;
  private readonly likeTotals = new Map<string, number>();

  constructor(
    private readonly config: Config,
    private readonly onLog: (line: string) => void,
    private readonly onStatus: (status: SessionStatus) => void,
  ) {
    this.client = new TikTokPrinterClient({ uniqueId: config.uniqueId, apiKey: config.apiKey, printer: createEngine(config.printer) });
    this.client.on("connected", () => this.onStatus({ state: "connected" }));
    this.client.on("disconnected", ({ code, reason }) => this.onStatus({ state: "disconnected", detail: `${reason} (${code})` }));
    this.client.on("error", (err) => this.onLog(`error: ${err.message}`));
    for (const type of new Set(this.triggers.map((t) => SOURCE_EVENTS[t.event]))) {
      (this.client.on as (type: string, fn: (data: unknown) => void) => void)(type, (data) => this.handle(type, data));
    }
  }

  private get triggers(): Trigger[] {
    return this.config.triggers.filter((t) => t.enabled);
  }

  async start(): Promise<void> {
    this.onStatus({ state: "connecting" });
    await this.client.connect();
  }

  async stop(): Promise<void> {
    this.client.disconnect();
    await this.client.printer.close();
    this.onStatus({ state: "idle" });
  }

  private handle(type: string, data: unknown): void {
    const prevLikes = type === "WebcastLikeMessage" ? (this.likeTotals.get((data as { user?: { displayId?: string } }).user?.displayId ?? "") ?? 0) : 0;
    const match = matchEvent(type, data, this.likeTotals);
    if (!match) return;
    for (const trigger of this.triggers) {
      if (trigger.event !== match.event || !passesFilter(trigger, match, prevLikes)) continue;
      this.onLog(`${match.event}: @${match.ctx.username}${match.ctx.gift ? ` ${match.ctx.count} x ${match.ctx.gift}` : ""}${match.ctx.comment ? ` "${match.ctx.comment}"` : ""}`);
      void renderBlocks(trigger.blocks, match, fetchImage).then((items) => this.client.queue(...items));
    }
  }
}
