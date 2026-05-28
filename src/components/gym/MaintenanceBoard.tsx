import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertOctagon, ArrowRight, CheckCircle2, Clock, Wrench } from "lucide-react";
import { gymStore, useGymStore, type MaintenanceStatus } from "@/lib/gym-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLUMNS: { key: MaintenanceStatus; label: string; tone: string; icon: typeof Wrench }[] = [
  { key: "open",        label: "Open",        tone: "border-destructive/40 bg-destructive/10 text-destructive", icon: AlertOctagon },
  { key: "in_progress", label: "In Progress", tone: "border-warning/40 bg-warning/10 text-warning",             icon: Wrench },
  { key: "resolved",    label: "Resolved",    tone: "border-success/40 bg-success/10 text-success",             icon: CheckCircle2 },
];

const sevTone: Record<"low" | "medium" | "high", string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const nextStatus: Record<MaintenanceStatus, MaintenanceStatus | null> = {
  open: "in_progress",
  in_progress: "resolved",
  resolved: null,
};

export function MaintenanceBoard() {
  useGymStore((s) => s.v);
  const tickets = gymStore.getState().maintenance;

  const grouped = useMemo(() => {
    const g: Record<MaintenanceStatus, typeof tickets> = { open: [], in_progress: [], resolved: [] };
    tickets.forEach((t) => g[t.status].push(t));
    return g;
  }, [tickets]);

  const advance = (id: string, current: MaintenanceStatus) => {
    const n = nextStatus[current];
    if (!n) return;
    gymStore.setMaintenanceStatus(id, n);
    toast.success(`Moved to ${n.replace("_", " ")}`);
  };

  return (
    <div className="space-y-4">
      <Card className="glass rounded-2xl">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Maintenance board</div>
            <div className="text-lg font-semibold mt-0.5">{tickets.length} tickets · {grouped.open.length} open</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-destructive" /> Open
            <span className="size-2 rounded-full bg-warning ml-3" /> In progress
            <span className="size-2 rounded-full bg-success ml-3" /> Resolved
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = grouped[col.key];
          return (
            <Card key={col.key} className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-7 rounded-lg grid place-items-center border", col.tone)}>
                      <col.icon className="size-3.5" />
                    </span>
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="bg-accent text-foreground">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[120px]">
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground py-8 text-center">No tickets here.</div>
                )}
                {items.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border/60 bg-card/40 p-3 hover:bg-accent/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.machine}</div>
                        {t.note && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.note}</div>}
                      </div>
                      <Badge className={cn("text-[10px] uppercase", sevTone[t.severity])}>{t.severity}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" /> {formatTime(t.ts)}
                      </span>
                      {nextStatus[t.status] && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs hover:bg-accent" onClick={() => advance(t.id, t.status)}>
                          {nextStatus[t.status] === "in_progress" ? "Start" : "Resolve"} <ArrowRight className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
