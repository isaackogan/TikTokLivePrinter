import { BASE_URL, CloseMessageMap, createWebSocketUrl, type DecodedData, SchemaVersion } from "@eulerstream/euler-websocket-sdk";
import EventEmitter from "eventemitter3";
import type { PrintItem, RgbaImage, TextStyle } from "./items.ts";
import { Image, Sound, Text, Voice } from "./items.ts";
import type { PrinterEngine } from "./printer/engine.ts";
import { PrintQueue } from "./queue.ts";
import { SoundEngine } from "./sound.ts";
import { VoiceEngine } from "./voice.ts";
import type { EulerEvents, WebcastEvents } from "./webcast.ts";

export type ClientOptions = {
  uniqueId: string;
  apiKey?: string;
  jwtKey?: string;
  printer: PrinterEngine;
  voice?: VoiceEngine;
  sound?: SoundEngine;
  /** Override the Euler WebSocket host, e.g. for a self-hosted gateway. */
  wsUrl?: string;
  socketFactory?: (url: string) => WebSocket;
};

export type ClientEvents = WebcastEvents &
  EulerEvents & {
  connected: () => void;
  disconnected: (info: { code: number; reason: string }) => void;
  error: (err: Error) => void;
};

type Frame = DecodedData | { timestamp: number; messages: DecodedData[] };

/** Receives TikTok LIVE events from Euler Stream and prints them through a serial queue. */
export class TikTokPrinterClient extends EventEmitter<ClientEvents> {
  readonly printer: PrinterEngine;
  private readonly voiceEngine: VoiceEngine;
  private readonly soundEngine: SoundEngine;
  private readonly queueRunner: PrintQueue;
  private readonly socketFactory: (url: string) => WebSocket;
  private socket?: WebSocket;

  constructor(private readonly opts: ClientOptions) {
    super();
    this.printer = opts.printer;
    this.voiceEngine = opts.voice ?? new VoiceEngine();
    this.soundEngine = opts.sound ?? new SoundEngine();
    this.socketFactory = opts.socketFactory ?? ((url) => new WebSocket(url));
    this.queueRunner = new PrintQueue(
      (items) => this.runJob(items),
      (err) => this.emit("error", err),
    );
  }

  get url(): string {
    const { uniqueId, apiKey, jwtKey, wsUrl } = this.opts;
    const url = createWebSocketUrl({ uniqueId, apiKey, jwtKey, features: { schemaVersion: SchemaVersion.v3 } });
    return wsUrl ? url.replace(BASE_URL, wsUrl) : url;
  }

  connect(): Promise<void> {
    const socket = this.socketFactory(this.url);
    this.socket = socket;
    return new Promise((resolve, reject) => {
      socket.addEventListener("open", () => {
        this.emit("connected");
        resolve();
      });
      socket.addEventListener("message", (event) => this.handleFrame(String(event.data)));
      socket.addEventListener("error", () => this.emit("error", new Error("WebSocket error")));
      socket.addEventListener("close", (event) => {
        const info = { code: event.code, reason: event.reason || CloseMessageMap[event.code as keyof typeof CloseMessageMap] || "" };
        if (this.socket === socket) this.socket = undefined;
        this.emit("disconnected", info);
        reject(new Error(`WebSocket closed (${info.code}): ${info.reason}`));
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  /** Parses one WebSocket frame (a bundle or a single event) and emits its messages. */
  handleFrame(raw: string): void {
    let frame: Frame;
    try {
      frame = JSON.parse(raw);
    } catch (err) {
      this.emit("error", new Error(`Malformed frame: ${err}`));
      return;
    }
    const messages = "messages" in frame ? frame.messages : [frame];
    for (const message of messages) (this.emit as (type: string, data: unknown) => void)(message.type, message.data);
  }

  text(content: string, style?: TextStyle): Promise<void> {
    return this.queue(Text(content, style));
  }

  image(image: RgbaImage, width?: number): Promise<void> {
    return this.queue(Image(image, width));
  }

  voice(content: string): Promise<void> {
    return this.queue(Voice(content));
  }

  sound(path: string): Promise<void> {
    return this.queue(Sound(path));
  }

  /** Runs the items as one job: nothing from another event lands between them. */
  queue(...items: PrintItem[]): Promise<void> {
    return this.queueRunner.push(items);
  }

  private async runJob(items: PrintItem[]): Promise<void> {
    await this.printer.print(items);
    for (const item of items) {
      if (item.type === "voice") await this.voiceEngine.speak(item.content);
      if (item.type === "sound") await this.soundEngine.play(item.path);
    }
  }
}
