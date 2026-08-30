import type { Trigger } from "@tiktok-live-printer/config";
import { Trash2 } from "lucide-react";
import { BlockList } from "@/components/BlockList";
import { FilterRow } from "@/components/FilterRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const EVENT_LABELS: Record<Trigger["event"], string> = {
  gift: "Gift",
  follow: "Follow",
  share: "Share",
  like: "Like",
  comment: "Comment",
  join: "Join",
  subscribe: "Subscribe",
};

export function TriggerCard({ trigger, onChange, onRemove }: { trigger: Trigger; onChange: (trigger: Trigger) => void; onRemove: () => void }) {
  return (
    <Card className={trigger.enabled ? "" : "opacity-70"}>
      <CardHeader className="flex items-center gap-3">
        <CardTitle className="flex items-center gap-2">
          <Badge>{EVENT_LABELS[trigger.event]}</Badge>
          <span className="text-sm font-normal text-muted-foreground">when someone {trigger.event === "gift" ? "sends a gift" : trigger.event === "comment" ? "comments" : `${trigger.event}s`}</span>
        </CardTitle>
        <div className="ml-auto flex items-center gap-2">
          <Switch checked={trigger.enabled} onCheckedChange={(enabled) => onChange({ ...trigger, enabled })} aria-label="Enabled" />
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Delete trigger">
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FilterRow trigger={trigger} onChange={(filter) => onChange({ ...trigger, filter })} />
        <BlockList blocks={trigger.blocks} onChange={(blocks) => onChange({ ...trigger, blocks })} />
      </CardContent>
    </Card>
  );
}
