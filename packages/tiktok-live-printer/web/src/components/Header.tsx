import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { applyImport, exportConfig, useConfig } from "@/store";

export function Header() {
  const [config] = useConfig();
  const [error, setError] = useState<string>();
  const file = useRef<HTMLInputElement>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (picked) setError(applyImport(await picked.text()));
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportConfig(config)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "tiktok-live-printer-config.json" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div>
        <h1 className="text-xl font-semibold">TikTok Live Printer</h1>
        <p className="text-sm text-muted-foreground">Print gifts, follows and comments from your LIVE to a receipt printer.</p>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-sm text-destructive">Import failed: {error}</span>}
        <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={onFile} />
        <Button variant="outline" onClick={() => file.current?.click()}>
          <Upload /> Import
        </Button>
        <Button variant="outline" onClick={download}>
          <Download /> Export
        </Button>
      </div>
    </header>
  );
}
