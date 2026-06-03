import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, Users, Wallet } from "lucide-react";
import { MEMBERS, daysRemaining, type Gender } from "@/lib/gym-data";
import { WhatsAppButton } from "./WhatsAppButton";
import { CashFlowWidget } from "./CashFlowWidget";
import { cashCollectedToday, isFrozenToday, useGymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";

type Props = { todayMode: "men" | "women" | "closed"; dayLabel: string };

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

export function AdminView({ todayMode, dayLabel }: Props) {
  useGymStore((s) => s.v);
  const { t } = useI18n();
  const allowed: Gender | null = todayMode === "men" ? "male" : todayMode === "women" ? "female" : null;

  const activeToday = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (isFrozenToday(m.id)) return false;
        if (daysRemaining(m.subEnd) === 0) return false;
        return allowed ? m.gender === allowed : true;
      }),
    [allowed],
  );

  const expiringSoon = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (isFrozenToday(m.id)) return false;
        const d = daysRemaining(m.subEnd);
        return d > 0 && d <= 7;
      }).sort((a, b) => daysRemaining(a.subEnd) - daysRemaining(b.subEnd)),
    [],
  );

  const collected = cashCollectedToday();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Two big numbers + cash widget */}
      <Card className="glass rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("metric.activeToday")}</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-semibold tracking-tight">{activeToday.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {todayMode === "closed" ? "Transition / Closed — no gender shift active" : `${todayMode === "men" ? "Men's" : "Women's"} shift · ${dayLabel}`}
          </div>
        </CardContent>
      </Card>

      <Card className="glass rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("metric.cashToday")}</span>
            <Wallet className="size-4 text-success" />
          </div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-success">
            {new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(collected)} <span className="text-base text-muted-foreground font-normal">MAD</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">All payments are cash · Africa/Casablanca</div>
        </CardContent>
      </Card>

      <Card className="glass rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("metric.expiringWeek")}</span>
            <AlertTriangle className="size-4 text-warning" />
          </div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-warning">{expiringSoon.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Members due to renew in &lt; 7 days</div>
        </CardContent>
      </Card>

      <div className="xl:col-span-3">
        <CashFlowWidget />
      </div>

      {/* Expiring list */}
      <Card className="glass rounded-2xl xl:col-span-3 border-warning/30 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-warning" /> {t("admin.expiringSoon")}
          </CardTitle>
          <Badge className="bg-warning/20 text-warning border border-warning/40">
            <bdi>{expiringSoon.length}</bdi>
          </Badge>
        </CardHeader>
        <CardContent>
          {expiringSoon.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <bdi>{t("admin.noRenewals")}</bdi> 🎉
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {expiringSoon.map((m) => {
                const d = daysRemaining(m.subEnd);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-warning/30 bg-card/40 px-3 py-2.5 hover:bg-card/70 transition-colors"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-warning/20 text-warning text-xs font-semibold">
                        {initials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d} day{d === 1 ? "" : "s"} · {m.phone}
                      </div>
                    </div>
                    <WhatsAppButton member={m} tone="renew" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
