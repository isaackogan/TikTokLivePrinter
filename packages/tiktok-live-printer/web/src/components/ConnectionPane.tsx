import { Field } from "@/components/Field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConfig } from "@/store";

export function ConnectionPane() {
  const [config, update] = useConfig();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Field label="TikTok username" hint="The creator whose LIVE to print, with or without the @.">
          <Input value={config.uniqueId} placeholder="@creator" onChange={(e) => update((c) => ({ ...c, uniqueId: e.target.value }))} />
        </Field>
        <Field label="Euler Stream API key (required)" hint="Get one at eulerstream.com. Stored only in this browser.">
          <Input type="password" value={config.apiKey ?? ""} onChange={(e) => update((c) => ({ ...c, apiKey: e.target.value || undefined }))} />
        </Field>
      </CardContent>
    </Card>
  );
}
