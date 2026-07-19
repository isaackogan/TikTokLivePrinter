import { describe, expect, it } from "vitest";
import { TEMPLATE_KEYS, renderTemplate, type TemplateContext } from "../src/template.ts";

const ctx: TemplateContext = { username: "kingsaab7868", nickname: "King", gift: "Rose", count: 3, diamonds: 3, comment: "hi", likes: 15 };

describe("renderTemplate", () => {
  it("substitutes every key", () => {
    const template = TEMPLATE_KEYS.map((k) => `{${k}}`).join(" ");
    expect(renderTemplate(template, ctx)).toBe("kingsaab7868 King Rose 3 3 hi 15");
  });

  it("leaves unknown placeholders alone", () => {
    expect(renderTemplate("THANKS FOR {count} X {gift} {nope}", ctx)).toBe("THANKS FOR 3 X Rose {nope}");
  });
});
