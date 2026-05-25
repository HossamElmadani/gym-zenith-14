import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { AlertTriangle, CheckCircle2, Flame, TrendingUp, Users, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import { MEMBERS, PEAK_HOURS, WAITLISTS, type Gender } from "@/lib/gym-data";

type Props = { todayMode: "men" | "women" | "mixed"; dayLabel: string };

export function AdminView({ todayMode, dayLabel }: Props) {
  const allowedGender: Gender | null = todayMode === "men" ? "male" : todayMode === "women" ? "female" : null;
  const filtered = useMemo(
    () => (allowedGender ? MEMBERS.filter((m) => m.gender === allowedGender) : MEMBERS),
    [allowedGender],
  );

  const [memberId, setMemberId] = useState("");

  const handleCheckIn = () => {
    const id = memberId.trim().toUpperCase();
    if (!id) return;
    const member = MEMBERS.find((m) => m.id.toUpperCase() === id);
    if (!member) {
      toast.error("Member not found", { description: `No record for ${id}` });
      return;
    }
    if (todayMode === "mixed") {
      toast.success(`Welcome ${member.name}`, { description: "Mixed day — all members allowed." });
      setMemberId("");
      return;
    }
    if ((todayMode === "men" && member.gender !== "male") || (todayMode === "women" && member.gender !== "female")) {
      toast.error("Access Denied", {
        description: `${dayLabel} is reserved for ${todayMode === "men" ? "Men" : "Women"}. ${member.name} cannot check in today.`,
      });
      return;
    }
    toast.success(`Checked in: ${member.name}`, { description: `+10 loyalty points · ${member.plan} plan` });
    setMemberId("");
  };

  const churnList = filtered.filter((m) => m.churnRisk >= 70).sort((a, b) => b.churnRisk - a.churnRisk);

  const stats = [
    { label: "Active today",      value: filtered.length,                        icon: Users,    accent: "text-primary" },
    { label: "Check-ins",         value: 142,                                    icon: CheckCircle2, accent: "text-success" },
    { label: "Peak hour",         value: "7 PM",                                 icon: Flame,    accent: "text-warning" },
    { label: "Retention",         value: "92%",                                  icon: TrendingUp, accent: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* KPIs */}
      <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`size-4 ${s.accent}`} />
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Check-in */}
      <Card className="glass rounded-2xl xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" /> Smart Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Today is <span className="text-foreground font-medium">{dayLabel}</span> —{" "}
            {todayMode === "mixed" ? (
              <span>open to all members.</span>
            ) : (
              <span>
                only <span className="text-primary font-medium">{todayMode === "men" ? "Men" : "Women"}</span> may check in.
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Input
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
              placeholder="Enter Member ID (e.g. M-1041)"
              className="bg-background/50"
            />
            <Button onClick={handleCheckIn} className="shrink-0">
              Check in
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            Try:{" "}
            <button className="underline hover:text-foreground" onClick={() => setMemberId("M-1041")}>M-1041</button>
            <button className="underline hover:text-foreground" onClick={() => setMemberId("F-2031")}>F-2031</button>
            <button className="underline hover:text-foreground" onClick={() => setMemberId("M-9999")}>M-9999</button>
          </div>
        </CardContent>
      </Card>

      {/* Crowd heatmap */}
      <Card className="glass rounded-2xl xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Crowd Heatmap · {dayLabel}</CardTitle>
          <Badge variant="secondary" className="bg-accent text-foreground">Live simulation</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PEAK_HOURS} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="crowdFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#crowdFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Churn risk */}
      <Card className="glass rounded-2xl xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4 text-destructive" /> Churn Risk
          </CardTitle>
          <span className="text-xs text-muted-foreground">No check-in &gt; 2 weeks</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {churnList.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">No high-risk members today. 🎉</div>
          )}
          {churnList.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 hover:bg-destructive/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-destructive/20 grid place-items-center">
                  <AlertTriangle className="size-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.id} · {m.plan}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-destructive">{m.churnRisk}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">risk</div>
                </div>
                <Button size="sm" variant="outline" className="border-destructive/40 hover:bg-destructive/20">
                  Reach out
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Waitlist */}
      <Card className="glass rounded-2xl xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Class Waitlists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {WAITLISTS.map((w) => (
            <div key={w.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{w.klass}</div>
                  <div className="text-xs text-muted-foreground">{w.time} · {w.waiting} waiting</div>
                </div>
                <Badge className={w.gender === "men" ? "bg-mens text-mens-foreground" : "bg-womens text-womens-foreground"}>
                  {w.gender === "men" ? "Men" : "Women"}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full justify-between hover:bg-accent"
                onClick={() => toast.success(`Promoted next in line — ${w.klass}`)}
              >
                Promote next <ArrowRight className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
