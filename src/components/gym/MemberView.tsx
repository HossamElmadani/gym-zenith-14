import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Gift, Sparkles, Target, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DEMO_MEMBER, PROGRESS_DATA } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const WEEK = [
  { day: "Mon", gender: "men" as const },
  { day: "Tue", gender: "women" as const },
  { day: "Wed", gender: "men" as const },
  { day: "Thu", gender: "women" as const },
  { day: "Fri", gender: "men" as const },
  { day: "Sat", gender: "women" as const },
  { day: "Sun", gender: "mixed" as const },
];

export function MemberView() {
  const member = DEMO_MEMBER; // male demo
  const nextReward = 500;
  const progress = Math.min(100, (member.points % nextReward) / nextReward * 100);
  const pointsToNext = nextReward - (member.points % nextReward);

  const canBook = (g: "men" | "women" | "mixed") =>
    g === "mixed" || (g === "men" && member.gender === "male") || (g === "women" && member.gender === "female");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Welcome */}
      <Card className="glass rounded-2xl xl:col-span-3 overflow-hidden relative">
        <div className="absolute inset-0 opacity-60 pointer-events-none"
             style={{ background: "radial-gradient(600px 200px at 0% 0%, color-mix(in oklab, var(--color-primary) 25%, transparent), transparent)" }} />
        <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4 relative">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
              {member.name.split(" ")[0]} <span className="text-muted-foreground font-normal">·</span>{" "}
              <span className="inline-flex items-center gap-1 text-primary">
                <Flame className="size-6" /> {member.streak}-day streak
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Member {member.id} · {member.plan} plan
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border/60 hover:bg-accent">View progress</Button>
            <Button className="glow-primary">Book a session</Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart calendar */}
      <Card className="glass rounded-2xl xl:col-span-2">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-primary" /> Weekly Booking
          </CardTitle>
          <Badge variant="secondary" className="bg-accent">Member: {member.gender === "male" ? "Men's days" : "Women's days"}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {WEEK.map((d) => {
              const allowed = canBook(d.gender);
              const accentColor =
                d.gender === "men" ? "border-mens/40" : d.gender === "women" ? "border-womens/40" : "border-border/60";
              return (
                <button
                  key={d.day}
                  disabled={!allowed}
                  onClick={() => toast.success(`Booked ${d.day} session`, { description: "Confirmation sent to your email." })}
                  className={cn(
                    "rounded-xl p-3 text-left border bg-card/30 transition-all",
                    accentColor,
                    allowed && "hover:-translate-y-0.5 hover:bg-card/60 cursor-pointer",
                    !allowed && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <div className="text-xs text-muted-foreground">{d.day}</div>
                  <div className={cn(
                    "mt-1 text-xs font-medium",
                    d.gender === "men" && "text-mens",
                    d.gender === "women" && "text-womens",
                    d.gender === "mixed" && "text-muted-foreground",
                  )}>
                    {d.gender === "mixed" ? "Mixed" : d.gender === "men" ? "Men's" : "Women's"}
                  </div>
                  <div className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {allowed ? "Available" : "Restricted"}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            As a {member.gender === "male" ? "male" : "female"} member, only{" "}
            {member.gender === "male" ? "Mon · Wed · Fri" : "Tue · Thu · Sat"} sessions are bookable.
          </p>
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card className="glass rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" /> Loyalty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="text-4xl font-semibold tracking-tight">{member.points}</div>
            <div className="text-xs text-muted-foreground mb-1">points</div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-2 text-sm">
            <Gift className="size-4 text-primary" />
            <span className="text-muted-foreground"><span className="text-foreground font-medium">{pointsToNext}</span> away from a free protein shake</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: Flame, label: "Streak", val: member.streak },
              { icon: Sparkles, label: "Tier", val: member.plan },
              { icon: Target, label: "Goals", val: "3/5" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-border/60 bg-card/40 p-3 text-center">
                <b.icon className="size-4 mx-auto text-primary" />
                <div className="text-sm font-semibold mt-1">{b.val}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{b.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress chart */}
      <Card className="glass rounded-2xl xl:col-span-3">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" /> Target Tracking · Weight
          </CardTitle>
          <Badge variant="secondary" className="bg-accent">Goal: 76.0 kg</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PROGRESS_DATA} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[75, 79]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="target" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
