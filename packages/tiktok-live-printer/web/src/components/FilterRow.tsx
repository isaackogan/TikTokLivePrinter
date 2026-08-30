import type { Trigger } from "@tiktok-live-printer/config";
import { Field } from "@/components/Field";
import { Input } from "@/components/ui/input";

export function FilterRow({ trigger, onChange }: { trigger: Trigger; onChange: (filter: Trigger["filter"]) => void }) {
  const { filter } = trigger;
  if (trigger.event === "gift")
    return (
      <div className="grid grid-cols-2 gap-2">
        <Field label="Minimum diamonds">
          <Input type="number" min={0} value={filter.minDiamonds ?? ""} placeholder="any" onChange={(e) => onChange({ ...filter, minDiamonds: e.target.value ? Number(e.target.value) : undefined })} />
        </Field>
        <Field label="Only these gifts" hint="Comma separated, e.g. Rose, Galaxy">
          <Input value={filter.giftNames?.join(", ") ?? ""} placeholder="any gift" onChange={(e) => onChange({ ...filter, giftNames: e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : undefined })} />
        </Field>
      </div>
    );
  if (trigger.event === "like")
    return (
      <Field label="Print every N likes from one viewer">
        <Input type="number" min={1} value={filter.likeEvery ?? ""} placeholder="every like message" onChange={(e) => onChange({ ...filter, likeEvery: e.target.value ? Number(e.target.value) : undefined })} />
      </Field>
    );
  return null;
}
