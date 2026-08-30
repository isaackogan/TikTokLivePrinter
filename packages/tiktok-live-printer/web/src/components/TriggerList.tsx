import { type Trigger, TriggerEventSchema, newTrigger } from "@tiktok-live-printer/config";
import { useState } from "react";
import { EVENT_LABELS, TriggerCard } from "@/components/TriggerCard";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useConfig } from "@/store";

export function TriggerList() {
  const [config, update] = useConfig();
  const [event, setEvent] = useState<Trigger["event"]>("gift");
  const setTriggers = (fn: (triggers: Trigger[]) => Trigger[]) => update((c) => ({ ...c, triggers: fn(c.triggers) }));

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Receipts</h2>
        <div className="flex items-center gap-2">
          <NativeSelect value={event} onChange={(e) => setEvent(e.target.value as Trigger["event"])}>
            {TriggerEventSchema.options.map((ev) => (
              <NativeSelectOption key={ev} value={ev}>
                {EVENT_LABELS[ev]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button onClick={() => setTriggers((t) => [...t, newTrigger(event)])}>Add receipt</Button>
        </div>
      </div>
      {config.triggers.map((trigger) => (
        <TriggerCard key={trigger.id} trigger={trigger} onChange={(t) => setTriggers((all) => all.map((x) => (x.id === t.id ? t : x)))} onRemove={() => setTriggers((all) => all.filter((x) => x.id !== trigger.id))} />
      ))}
    </section>
  );
}
