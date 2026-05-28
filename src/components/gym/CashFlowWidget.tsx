import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { cashCollectedToday, expensesToday, expiringValueThisWeek, useGymStore } from "@/lib/gym-store";

const money = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);

export function CashFlowWidget() {
  useGymStore((s) => s.v);

  const collected = cashCollectedToday();
  const expenses = expensesToday();
  const atRisk = expiringValueThisWeek();
  const net = collected - expenses;

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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <div className="flex items-center justify-between text-success">
              <ArrowDownRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Collected today</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-success">{money(collected)}</div>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-center justify-between text-warning">
              <Receipt className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Expenses today</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-warning">{money(expenses)}</div>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-center justify-between text-destructive">
              <ArrowUpRight className="size-4" />
              <span className="text-[10px] uppercase tracking-wider">Expiring this week</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-destructive">{money(atRisk)}</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          Net Cash = Collected − Expenses · live across staff devices.
        </div>
      </CardContent>
    </Card>
  );
}
