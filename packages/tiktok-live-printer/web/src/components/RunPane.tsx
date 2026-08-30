import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type SessionStatus, getSession, openEvents, startSession, stopSession } from "@/lib/api";
import { useConfig } from "@/store";

const MAX_LOG = 50;

export function RunPane() {
  const [config] = useConfig();
  const [status, setStatus] = useState<SessionStatus>({ state: "idle" });
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getSession().then(setStatus).catch(() => {});
    return openEvents((event) => {
      if (event.type === "status") setStatus(event.status);
      else setLog((lines) => [...lines.slice(-(MAX_LOG - 1)), event.line]);
    });
  }, []);

  const running = status.state === "connecting" || status.state === "connected";
  const toggle = () => {
    setError(undefined);
    (running ? stopSession() : startSession(config)).catch((e) => setError(e.message));
  };

  return (
    <Card>
      <CardHeader className="flex items-center gap-3">
        <CardTitle>Run</CardTitle>
        <Badge variant={status.state === "connected" ? "default" : "secondary"} className="ml-auto">
          {status.state}
          {status.detail ? `: ${status.detail}` : ""}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button onClick={toggle} variant={running ? "destructive" : "default"} disabled={!running && !config.uniqueId}>
          {running ? "Stop" : "Start printing"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ScrollArea className="h-48 rounded-md border bg-muted/30 p-2 font-mono text-xs">
          {log.length === 0 ? <span className="text-muted-foreground">Events will show up here.</span> : log.map((line, i) => <div key={i}>{line}</div>)}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
