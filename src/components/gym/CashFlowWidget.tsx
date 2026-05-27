import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { cashCollectedToday, expiringValueThisWeek, useGymStore } from "@/lib/gym-store";

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

export function CashFlowWidget() {
  // Subscribe to store updates (cash list + frozen state both affect numbers)
  useGymStore((s) => s.v);

  const collected = cashCollectedToday();
  const atRisk = expiringValueThisWeek();
  const net = collected - atRisk;

  return (
    <Card className="glass rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Today's cash flow</span>
          <span className={`text-[11px] font-medium flex items-center gap-1 ${net >= 0 ? "text-success" : "text-destructive"}`}>
            {net >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            Net {money(net)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <div className="flex items-center justify-between text-success">
              <ArrowDownRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Collected today</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-success">{money(collected)}</div>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-center justify-between text-destructive">
              <ArrowUpRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Expiring this week</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-destructive">{money(atRisk)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
