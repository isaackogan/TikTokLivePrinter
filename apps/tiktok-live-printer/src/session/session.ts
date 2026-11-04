import type { Config, Trigger } from "@tiktok-live-printer/config";
import { type PrinterEngine, type RgbaImage, TikTokPrinterClient, fetchImage } from "tiktok-live-printer";
import { createEngine } from "../printers.ts";
import { matchEvent, passesFilter } from "./context.ts";
import { renderBlocks } from "./render.ts";

export type SessionStatus = { state: "idle" | "connecting" | "connected" | "disconnected"; detail?: string };

export type SessionDeps = { engine?: PrinterEngine; fetch?: (url: string) => Promise<RgbaImage>; socketFactory?: (url: string) => WebSocket };

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
  readonly client: TikTokPrinterClient;
  private readonly fetch: (url: string) => Promise<RgbaImage>;
  private readonly likeTotals = new Map<string, number>();
  private chain = Promise.resolve();
  private stopped = false;

  constructor(
    private readonly config: Config,
    private readonly onLog: (line: string) => void,
    private readonly onStatus: (status: SessionStatus) => void,
    deps: SessionDeps = {},
  ) {
    this.fetch = deps.fetch ?? fetchImage;
    this.client = new TikTokPrinterClient({ uniqueId: config.uniqueId, apiKey: config.apiKey, printer: deps.engine ?? createEngine(config.printer), socketFactory: deps.socketFactory });
    this.client.on("connected", () => this.status({ state: "connected" }));
    this.client.on("disconnected", ({ code, reason }) => this.status({ state: "disconnected", detail: `${reason} (${code})` }));
    this.client.on("error", (err) => this.log(`error: ${err.message}`));
    for (const type of new Set(this.triggers.map((t) => SOURCE_EVENTS[t.event]))) {
      (this.client.on as (type: string, fn: (data: unknown) => void) => void)(type, (data) => this.handle(type, data));
    }
  }

  private get triggers(): Trigger[] {
    return this.config.triggers.filter((t) => t.enabled);
  }

  async start(): Promise<void> {
    this.status({ state: "connecting" });
    await this.client.connect();
  }

  /** After stop the socket's late close event and any in-flight jobs stay silent. */
  async stop(): Promise<void> {
    this.stopped = true;
    this.client.disconnect();
    await this.client.printer.close();
    this.onStatus({ state: "idle" });
  }

  private status(status: SessionStatus): void {
    if (!this.stopped) this.onStatus(status);
  }

  private log(line: string): void {
    if (!this.stopped) this.onLog(line);
  }

  private handle(type: string, data: unknown): void {
    const prevLikes = type === "WebcastLikeMessage" ? (this.likeTotals.get((data as { user?: { displayId?: string } }).user?.displayId ?? "") ?? 0) : 0;
    const match = matchEvent(type, data, this.likeTotals);
    if (!match) return;
    for (const trigger of this.triggers) {
      if (trigger.event !== match.event || !passesFilter(trigger, match, prevLikes)) continue;
      this.log(`${match.event}: @${match.ctx.username}${match.ctx.gift ? ` ${match.ctx.count} x ${match.ctx.gift}` : ""}${match.ctx.comment ? ` "${match.ctx.comment}"` : ""}`);
      // Rendering (image fetches) is serialized so receipts print in the order events arrived.
      this.chain = this.chain
        .then(() => renderBlocks(trigger.blocks, match, this.fetch))
        .then((items) => (this.stopped ? undefined : this.client.queue(...items)))
        .catch((err) => this.log(`error: ${err}`));
    }
  }
}
