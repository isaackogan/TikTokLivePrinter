export type TemplateContext = { username: string; nickname: string; gift: string; count: number; diamonds: number; comment: string; likes: number };

export const TEMPLATE_KEYS = ["username", "nickname", "gift", "count", "diamonds", "comment", "likes"] as const satisfies (keyof TemplateContext)[];

/** Replaces `{key}` placeholders; anything not in the context is left as written. */
export function renderTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in ctx ? String(ctx[key as keyof TemplateContext]) : match));
}
