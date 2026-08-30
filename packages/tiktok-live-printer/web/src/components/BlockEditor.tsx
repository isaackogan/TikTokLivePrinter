import { type Block, TEMPLATE_KEYS } from "@tiktok-live-printer/config";
import { Field } from "@/components/Field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const placeholders = TEMPLATE_KEYS.map((k) => `{${k}}`).join(" ");

export function BlockEditor({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
  switch (block.type) {
    case "avatar":
    case "giftImage":
      return (
        <Field label="Width (dots)">
          <Input type="number" min={8} max={576} step={8} value={block.width} onChange={(e) => onChange({ ...block, width: Number(e.target.value) || 8 })} />
        </Field>
      );
    case "text":
      return (
        <div className="grid gap-2">
          <Field label="Text" hint={`Placeholders: ${placeholders}`}>
            <Textarea rows={2} value={block.template} onChange={(e) => onChange({ ...block, template: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={block.bold} onCheckedChange={(bold) => onChange({ ...block, bold })} /> Bold
            </label>
            <NativeSelect size="sm" value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as Block & { type: "text" } extends { align: infer A } ? A : never })}>
              <NativeSelectOption value="left">Left</NativeSelectOption>
              <NativeSelectOption value="center">Center</NativeSelectOption>
              <NativeSelectOption value="right">Right</NativeSelectOption>
            </NativeSelect>
            <NativeSelect size="sm" value={block.size} onChange={(e) => onChange({ ...block, size: Number(e.target.value) === 2 ? 2 : 1 })}>
              <NativeSelectOption value={1}>Normal</NativeSelectOption>
              <NativeSelectOption value={2}>Large</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
      );
    case "feed":
      return (
        <Field label="Blank lines">
          <Input type="number" min={1} max={20} value={block.lines} onChange={(e) => onChange({ ...block, lines: Number(e.target.value) || 1 })} />
        </Field>
      );
    case "voice":
      return (
        <Field label="Say out loud" hint={`Placeholders: ${placeholders}`}>
          <Input value={block.template} onChange={(e) => onChange({ ...block, template: e.target.value })} />
        </Field>
      );
    default:
      return null;
  }
}
