import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle, Users, Wallet, CalendarRange, TrendingUp,
  UserCheck, DollarSign, ShieldCheck, RefreshCw, UserPlus,
} from "lucide-react";
import { MEMBERS, daysRemaining, subStatus, type Gender } from "@/lib/gym-data";
import { WhatsAppButton } from "./WhatsAppButton";
import { isFrozenToday, useGymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";
import { tzTodayISO, tzAddDaysISO, tzFormatDate } from "@/lib/gym-tz";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = { todayMode: "men" | "women" | "closed"; dayLabel: string };

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

export function AdminView({ todayMode, dayLabel }: Props) {
  const storeVersion = useGymStore((s) => s.v);
  const { t, lang } = useI18n();
  const allowed: Gender | null = todayMode === "men" ? "male" : todayMode === "women" ? "female" : null;

  // 1. Date Range Filter State
  const [filter, setFilter] = useState<"7d" | "30d" | "this_month" | "all">("this_month");

  // 2. Date Range Boundaries
  const { startDate, endDate } = useMemo(() => {
    const today = tzTodayISO();
    if (filter === "7d") {
      return { startDate: tzAddDaysISO(-6), endDate: today };
    }
    if (filter === "30d") {
      return { startDate: tzAddDaysISO(-29), endDate: today };
    }
    if (filter === "this_month") {
      const [year, month] = today.split("-");
      return { startDate: `${year}-${month}-01`, endDate: today };
    }
    return { startDate: "", endDate: "" };
  }, [filter]);

  // 3. Select and filter Cash Logs
  const cash = useGymStore((s) => s.cash);
  const filteredCash = useMemo(() => {
    return cash.filter((c) => {
      if (filter === "all") return true;
      const logDate = tzTodayISO(new Date(c.ts));
      return logDate >= startDate && logDate <= endDate;
    });
  }, [cash, filter, startDate, endDate, storeVersion]);

  // 4. Filter Members by registration date (subStart)
  const filteredMembers = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (filter === "all") return true;
      return m.subStart >= startDate && m.subStart <= endDate;
    });
  }, [filter, startDate, endDate, storeVersion]);

  // 5. Active Members Today (keeps its real-time behavior for the shift view)
  const activeToday = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (isFrozenToday(m.id)) return false;
        if (daysRemaining(m.subEnd) === 0) return false;
        return allowed ? m.gender === allowed : true;
      }),
    [allowed],
  );

  // Expiring list (global, to let receptionists view expiring members)
  const expiringSoon = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (isFrozenToday(m.id)) return false;
        const d = daysRemaining(m.subEnd);
        return d > 0 && d <= 7;
      }).sort((a, b) => daysRemaining(a.subEnd) - daysRemaining(b.subEnd)),
    [],
  );

  // 6. Revenue Calculations
  const totalRevenue = useMemo(() => {
    return filteredCash.reduce((sum, c) => sum + c.amount, 0);
  }, [filteredCash]);

  const registrationLogs = useMemo(() => {
    return filteredCash.filter((c) => c.kind === "registration");
  }, [filteredCash]);
  const registrationCount = registrationLogs.length;
  const registrationMAD = registrationLogs.reduce((sum, c) => sum + c.amount, 0);

  const renewalLogs = useMemo(() => {
    return filteredCash.filter((c) => c.kind === "renewal");
  }, [filteredCash]);
  const renewalCount = renewalLogs.length;
  const renewalMAD = renewalLogs.reduce((sum, c) => sum + c.amount, 0);

  const insuranceLogs = useMemo(() => {
    return filteredCash.filter((c) => c.kind === "insurance");
  }, [filteredCash]);
  const insuranceCount = insuranceLogs.length;
  const insuranceMAD = insuranceLogs.reduce((sum, c) => sum + c.amount, 0);

  // 7. Member status overview calculations (for all members in the system)
  const memberStats = useMemo(() => {
    const total = MEMBERS.length;
    if (total === 0) return { active: 0, activePct: 0, expiring: 0, expiringPct: 0, expired: 0, expiredPct: 0, pending: 0, pendingPct: 0 };
    
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let pending = 0;
    
    MEMBERS.forEach((m) => {
      const status = subStatus(m.subEnd, m.subStart);
      if (status === "active") active++;
      else if (status === "expiring") expiring++;
      else if (status === "expired") expired++;
      else if (status === "pending") pending++;
    });
    
    return {
      active,
      activePct: Math.round((active / total) * 100),
      expiring,
      expiringPct: Math.round((expiring / total) * 100),
      expired,
      expiredPct: Math.round((expired / total) * 100),
      pending,
      pendingPct: Math.round((pending / total) * 100),
    };
  }, [storeVersion]);

  // 8. Last 7 Days Daily Revenue Trend
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => tzAddDaysISO(i - 6));
    return days.map((dayStr) => {
      const dailyRevenue = cash
        .filter((c) => {
          if (!c.ts) return false;
          try {
            const dateObj = new Date(c.ts);
            if (isNaN(dateObj.getTime())) return false;
            return tzTodayISO(dateObj) === dayStr;
          } catch {
            return false;
          }
        })
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        
      const dayNameShort = tzFormatDate(dayStr, { weekday: "short" });
      
      return {
        dateStr: dayStr,
        dayLabel: dayNameShort,
        amount: dailyRevenue,
      };
    });
  }, [cash, storeVersion]);

  const maxDailyRevenue = useMemo(() => {
    const vals = last7DaysData.map((d) => d.amount).filter((val) => !isNaN(val) && val >= 0);
    return Math.max(...vals, 1);
  }, [last7DaysData]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card/25 border border-border/40 p-4 rounded-2xl glass">
        <div>
          <div className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
            <CalendarRange className="size-4 text-primary" />
            {t("admin.filterTitle")}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {t("admin.filterRangeFrom")} {startDate || t("admin.filterRangeStartDefault")} {t("admin.filterRangeTo")} {endDate || t("admin.filterRangeEndDefault")}
          </div>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-56 bg-background/50 border-border/60 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass border-border/60">
            <SelectItem value="7d">{t("admin.filter.7d")}</SelectItem>
            <SelectItem value="30d">{t("admin.filter.30d")}</SelectItem>
            <SelectItem value="this_month">{t("admin.filter.thisMonth")}</SelectItem>
            <SelectItem value="all">{t("admin.filter.all")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid for Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: New Members */}
        <Card className="glass rounded-2xl border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("admin.newMembers")}
              </span>
              <UserCheck className="size-4 text-primary" />
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">{registrationCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("admin.newMembersSub")}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="glass rounded-2xl border-success/20 bg-success/5 hover:border-success/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("admin.totalRevenue")}
              </span>
              <Wallet className="size-4 text-success" />
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight text-success">
              {new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(totalRevenue)}{" "}
              <span className="text-base text-muted-foreground font-normal">{t("common.currency")}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("admin.totalRevenueSub")}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Cash Transactions */}
        <Card className="glass rounded-2xl border-warning/20 bg-warning/5 hover:border-warning/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("admin.transactions")}
              </span>
              <TrendingUp className="size-4 text-warning" />
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight text-warning">{filteredCash.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("admin.transactionsSub")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Revenue timeline (last 7 days) + Members Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue timeline */}
        <Card className="glass rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              {t("admin.revenueTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {/* Visual CSS bars */}
            <div className="flex items-end justify-between h-40 gap-2 border-b border-border/40 pb-2">
              {last7DaysData.map((d) => {
                const heightPct = (d.amount / maxDailyRevenue) * 90 + 10; // min 10% for visual presence
                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className="w-full max-w-[24px] rounded-t-md bg-gradient-to-t from-primary/30 to-primary group-hover:from-primary/60 group-hover:to-primary transition-all duration-300 cursor-pointer relative group"
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground border border-border/80 text-[10px] font-semibold py-1 px-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
                        {d.amount} MAD
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Day Labels */}
            <div className="flex justify-between mt-2 text-[10px] font-medium text-muted-foreground">
              {last7DaysData.map((d) => (
                <div key={d.dateStr} className="flex-1 text-center truncate">
                  {d.dayLabel}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Member Status Card */}
        <Card className="glass rounded-2xl xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {t("admin.membersOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">
              {t("admin.membersOverviewSubPrefix")} {MEMBERS.length})
            </div>

            {/* CSS Horizontal Progress Bars */}
            <div className="space-y-3">
              {/* Active */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-success" />
                    {t("admin.status.active")}
                  </span>
                  <span>
                    {memberStats.active} <span className="text-muted-foreground font-normal">({memberStats.activePct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${memberStats.activePct}%` }}
                  />
                </div>
              </div>

              {/* Expiring Soon */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-warning" />
                    {t("admin.status.expiring")}
                  </span>
                  <span>
                    {memberStats.expiring} <span className="text-muted-foreground font-normal">({memberStats.expiringPct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-500"
                    style={{ width: `${memberStats.expiringPct}%` }}
                  />
                </div>
              </div>

              {/* Expired */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive" />
                    {t("admin.status.expired")}
                  </span>
                  <span>
                    {memberStats.expired} <span className="text-muted-foreground font-normal">({memberStats.expiredPct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full transition-all duration-500"
                    style={{ width: `${memberStats.expiredPct}%` }}
                  />
                </div>
              </div>

              {/* En attente */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    {t("admin.status.pending")}
                  </span>
                  <span>
                    {memberStats.pending} <span className="text-muted-foreground font-normal">({memberStats.pendingPct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${memberStats.pendingPct}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Financial Breakdown cards */}
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
          {t("admin.financialBreakdown")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenues */}
          <Card className="glass rounded-2xl border-l-4 border-l-primary hover:bg-card/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                  {t("admin.breakdown.total")}
                </span>
                <span className="text-xl font-bold block mt-1 tracking-tight text-foreground">
                  {totalRevenue} <span className="text-xs font-normal text-muted-foreground">MAD</span>
                </span>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                <DollarSign className="size-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Inscriptions */}
          <Card className="glass rounded-2xl border-l-4 border-l-success hover:bg-card/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                  {t("admin.breakdown.inscriptions")}
                </span>
                <span className="text-xl font-bold block mt-1 tracking-tight text-success">
                  {registrationMAD} <span className="text-xs font-normal text-muted-foreground">MAD</span>
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {registrationCount} {t("admin.transactionCount")}
                </span>
              </div>
              <div className="size-10 rounded-xl bg-success/10 grid place-items-center shrink-0">
                <UserPlus className="size-5 text-success" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Renouvellements */}
          <Card className="glass rounded-2xl border-l-4 border-l-blue-500 hover:bg-card/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                  {t("admin.breakdown.renewals")}
                </span>
                <span className="text-xl font-bold block mt-1 tracking-tight text-blue-400">
                  {renewalMAD} <span className="text-xs font-normal text-muted-foreground">MAD</span>
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {renewalCount} {t("admin.transactionCount")}
                </span>
              </div>
              <div className="size-10 rounded-xl bg-blue-500/10 grid place-items-center shrink-0">
                <RefreshCw className="size-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Assurance */}
          <Card className="glass rounded-2xl border-l-4 border-l-warning hover:bg-card/40 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                  {t("admin.breakdown.insurance")}
                </span>
                <span className="text-xl font-bold block mt-1 tracking-tight text-warning">
                  {insuranceMAD} <span className="text-xs font-normal text-muted-foreground">MAD</span>
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {insuranceCount} {t("admin.transactionCount")}
                </span>
              </div>
              <div className="size-10 rounded-xl bg-warning/10 grid place-items-center shrink-0">
                <ShieldCheck className="size-5 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expiring list */}
      <Card className="glass rounded-2xl border-warning/30 bg-warning/5">
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
                        <bdi>{d} {t("common.days")}</bdi> · <bdi dir="ltr">{m.phone}</bdi>
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
