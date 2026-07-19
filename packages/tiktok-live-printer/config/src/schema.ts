import { z } from "zod";

export const TriggerEventSchema = z.enum(["gift", "follow", "share", "like", "comment", "join", "subscribe"]);
export type TriggerEvent = z.infer<typeof TriggerEventSchema>;

const AlignSchema = z.enum(["left", "center", "right"]);

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("avatar"), width: z.number().int().min(8).max(576) }),
  z.object({ id: z.string(), type: z.literal("giftImage"), width: z.number().int().min(8).max(576) }),
  z.object({ id: z.string(), type: z.literal("text"), template: z.string(), bold: z.boolean(), align: AlignSchema, size: z.union([z.literal(1), z.literal(2)]) }),
  z.object({ id: z.string(), type: z.literal("line") }),
  z.object({ id: z.string(), type: z.literal("feed"), lines: z.number().int().min(1).max(20) }),
  z.object({ id: z.string(), type: z.literal("cut") }),
  z.object({ id: z.string(), type: z.literal("voice"), template: z.string() }),
]);
export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block["type"];

export const FilterSchema = z.object({
  minDiamonds: z.number().int().min(0).optional(),
  giftNames: z.array(z.string()).optional(),
  likeEvery: z.number().int().min(1).optional(),
});
export type Filter = z.infer<typeof FilterSchema>;

export const TriggerSchema = z.object({
  id: z.string(),
  event: TriggerEventSchema,
  enabled: z.boolean(),
  filter: FilterSchema,
  blocks: z.array(BlockSchema),
});
export type Trigger = z.infer<typeof TriggerSchema>;

export const PrinterConfigSchema = z.object({
  transport: z.enum(["auto", "usb", "spooler", "network", "console"]),
  vendorId: z.number().int().optional(),
  productId: z.number().int().optional(),
  queue: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().optional(),
  width: z.union([z.literal(384), z.literal(576)]),
});
export type PrinterConfig = z.infer<typeof PrinterConfigSchema>;

export const ConfigSchema = z.object({
  version: z.literal(1),
  uniqueId: z.string(),
  apiKey: z.string().optional(),
  printer: PrinterConfigSchema,
  triggers: z.array(TriggerSchema),
});
export type Config = z.infer<typeof ConfigSchema>;

export function parseConfig(input: unknown): { ok: true; config: Config } | { ok: false; error: string } {
  const result = ConfigSchema.safeParse(input);
  if (result.success) return { ok: true, config: result.data };
  const issue = result.error.issues[0]!;
  return { ok: false, error: `${issue.path.join(".") || "config"}: ${issue.message}` };
}
