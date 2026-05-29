import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cashCollectedToday, expiringValueThisWeek, useGymStore } from "@/lib/gym-store";

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " MAD";

export function CashFlowWidget() {
  useGymStore((s) => s.v);

  const collected = cashCollectedToday();
  const atRisk = expiringValueThisWeek();

  return (
    <Card className="glass rounded-2xl">
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Today's cash flow
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <div className="flex items-center justify-between text-success">
              <ArrowDownRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Cash collected today</span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-success">{money(collected)}</div>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-center justify-between text-destructive">
              <ArrowUpRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Expiring this week</span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-destructive">{money(atRisk)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
