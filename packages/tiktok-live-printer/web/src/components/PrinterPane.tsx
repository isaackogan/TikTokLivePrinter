import type { PrinterConfig } from "@tiktok-live-printer/config";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { type PrinterList, getPrinters, testPrint } from "@/lib/api";
import { useConfig } from "@/store";

const TRANSPORTS: { value: PrinterConfig["transport"]; label: string }[] = [
  { value: "auto", label: "Automatic (USB on macOS/Linux, system printer on Windows)" },
  { value: "usb", label: "USB" },
  { value: "spooler", label: "System printer" },
  { value: "network", label: "Network (TCP 9100)" },
  { value: "console", label: "Console (no printer)" },
];

const hex = (n: number) => n.toString(16).padStart(4, "0");

export function PrinterPane() {
  const [config, update] = useConfig();
  const [printers, setPrinters] = useState<PrinterList>({ usb: [], spooler: [] });
  const [result, setResult] = useState<string>();
  const printer = config.printer;
  const patch = (p: Partial<PrinterConfig>) => update((c) => ({ ...c, printer: { ...c.printer, ...p } }));

  const refresh = () => getPrinters().then(setPrinters).catch((e) => setResult(String(e)));
  useEffect(() => void refresh(), []);

  const test = () => {
    setResult("Printing…");
    testPrint(config).then(() => setResult("Sent a test receipt.")).catch((e) => setResult(`Test print failed: ${e.message}`));
  };

  const usbValue = printer.vendorId !== undefined && printer.productId !== undefined ? `${printer.vendorId}:${printer.productId}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Printer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Field label="Connection">
          <NativeSelect value={printer.transport} onChange={(e) => patch({ transport: e.target.value as PrinterConfig["transport"] })}>
            {TRANSPORTS.map((t) => (
              <NativeSelectOption key={t.value} value={t.value}>
                {t.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {printer.transport === "usb" && (
          <Field label="USB printer">
            <div className="flex gap-2">
              <NativeSelect
                value={usbValue}
                onChange={(e) => {
                  const [v, p] = e.target.value.split(":").map(Number);
                  patch({ vendorId: e.target.value ? v : undefined, productId: e.target.value ? p : undefined });
                }}
              >
                <NativeSelectOption value="">First printer found</NativeSelectOption>
                {printers.usb.map((d) => (
                  <NativeSelectOption key={`${d.vendorId}:${d.productId}`} value={`${d.vendorId}:${d.productId}`}>
                    {d.name} ({hex(d.vendorId)}:{hex(d.productId)})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh printers">
                <RefreshCw />
              </Button>
            </div>
          </Field>
        )}
        {printer.transport === "spooler" && (
          <Field label="System printer queue">
            <div className="flex gap-2">
              <NativeSelect value={printer.queue ?? ""} onChange={(e) => patch({ queue: e.target.value || undefined })}>
                <NativeSelectOption value="">First receipt printer found</NativeSelectOption>
                {printers.spooler.map((q) => (
                  <NativeSelectOption key={q} value={q}>
                    {q}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh printers">
                <RefreshCw />
              </Button>
            </div>
          </Field>
        )}
        {printer.transport === "network" && (
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <Field label="Host">
              <Input value={printer.host ?? ""} placeholder="192.168.1.50" onChange={(e) => patch({ host: e.target.value || undefined })} />
            </Field>
            <Field label="Port">
              <Input type="number" value={printer.port ?? 9100} onChange={(e) => patch({ port: Number(e.target.value) || 9100 })} />
            </Field>
          </div>
        )}
        <Field label="Paper width">
          <NativeSelect value={printer.width} onChange={(e) => patch({ width: Number(e.target.value) as PrinterConfig["width"] })}>
            <NativeSelectOption value={384}>58 mm</NativeSelectOption>
            <NativeSelectOption value={576}>80 mm</NativeSelectOption>
          </NativeSelect>
        </Field>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={test}>
            Test print
          </Button>
          {result && <span className="text-sm text-muted-foreground">{result}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
