import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScanLine, CheckCircle2, XCircle, AlertOctagon, Activity, Clock, User2, Zap, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { MEMBERS, dayName, daysRemaining, type Member } from "@/lib/gym-data";
import { useCurrentShift, type ShiftAudience } from "@/lib/gym-shift";
import { WhatsAppButton } from "./WhatsAppButton";
import { FreezeDialog } from "./FreezeDialog";

type Entry = {
  ts: string;
  memberId: string;
  name: string;
  gender: "male" | "female";
  status: "granted" | "wrong-day" | "expired" | "unknown";
};

type Result =
  | { kind: "idle" }
  | { kind: "unknown"; raw: string }
  | { kind: "granted"; member: (typeof MEMBERS)[number]; days: number }
  | { kind: "wrong-shift"; member: (typeof MEMBERS)[number] }
  | { kind: "closed"; member: (typeof MEMBERS)[number] }
  | { kind: "expired"; member: (typeof MEMBERS)[number] };

const initials = (n: string) =>
  n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function ReceptionDesk() {
  const today = useMemo(() => new Date(), []);
  const mode = todayGender(today);
  const label = dayName(today);
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [log, setLog] = useState<Entry[]>([]);
  const [doorPulse, setDoorPulse] = useState(0);
  const [freezeFor, setFreezeFor] = useState<Member | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const evaluate = () => {
    const q = value.trim().toUpperCase();
    if (!q) return;
    const member = MEMBERS.find(
      (m) => m.id.toUpperCase() === q || m.cin.toUpperCase() === q,
    );
    if (!member) {
      setResult({ kind: "unknown", raw: q });
      setValue("");
      inputRef.current?.focus();
      return;
    }
    const days = daysRemaining(member.subEnd);
    let r: Result;
    if (days <= 0) {
      r = { kind: "expired", member };
    } else if (
      (mode === "men" && member.gender !== "male") ||
      (mode === "women" && member.gender !== "female")
    ) {
      r = { kind: "wrong-day", member };
    } else {
      r = { kind: "granted", member, days };
      setDoorPulse((n) => n + 1);
      setLog((prev) =>
        [
          {
            ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            memberId: member.id,
            name: member.name,
            gender: member.gender,
            status: "granted" as const,
          },
          ...prev,
        ].slice(0, 20),
      );
    }
    setResult(r);
    setValue("");
    inputRef.current?.focus();
  };

  const grantedCount = log.length;
  const menCount = log.filter((l) => l.gender === "male").length;
  const womenCount = log.filter((l) => l.gender === "female").length;

  const allowedLabel =
    mode === "men" ? "Men's Day" : mode === "women" ? "Women's Day" : "Mixed Day";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Scanner + result */}
      <div className="xl:col-span-2 space-y-4">
        <Card className="glass rounded-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <ScanLine className="size-3.5 text-primary" />
                Reception scanner · {label} · {allowedLabel}
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Scan QR or enter CIN / ID
              </h2>
              <div className="relative w-full max-w-xl">
                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary" />
                <Input
                  ref={inputRef}
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && evaluate()}
                  placeholder="e.g. M-1041 or AB123456"
                  className="h-16 pl-12 pr-32 text-lg bg-background/50 rounded-xl tracking-wide"
                />
                <Button
                  onClick={evaluate}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6"
                >
                  Validate
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                Try:{" "}
                <button className="underline hover:text-foreground" onClick={() => setValue("M-1041")}>M-1041</button>
                <button className="underline hover:text-foreground" onClick={() => setValue("F-2031")}>F-2031</button>
                <button className="underline hover:text-foreground" onClick={() => setValue("CD456789")}>CD456789 (expired-ish)</button>
                <button className="underline hover:text-foreground" onClick={() => setValue("M-9999")}>M-9999 (unknown)</button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ResultCard
          result={result}
          mode={mode}
          label={label}
          doorPulse={doorPulse}
          onFreeze={(m) => setFreezeFor(m)}
        />
      </div>

      <FreezeDialog member={freezeFor} open={!!freezeFor} onOpenChange={(o) => !o && setFreezeFor(null)} />

      {/* Live traffic */}
      <Card className="glass rounded-2xl xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" /> Live Check-ins Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">Granted entries</div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">{grantedCount}</div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge className="bg-mens text-mens-foreground">Men · {menCount}</Badge>
              <Badge className="bg-womens text-womens-foreground">Women · {womenCount}</Badge>
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Gender-isolation proof: only <span className="text-foreground font-medium">{allowedLabel}</span> members can be granted access.
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {log.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Waiting for first check-in…
              </div>
            )}
            {log.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-8">
                    <AvatarFallback
                      className={cn(
                        "text-[10px]",
                        l.gender === "male"
                          ? "bg-mens/20 text-mens-foreground"
                          : "bg-womens/20 text-womens-foreground",
                      )}
                    >
                      {initials(l.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground">{l.memberId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" /> {l.ts}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultCard({
  result,
  mode,
  label,
  doorPulse,
  onFreeze,
}: {
  result: Result;
  mode: "men" | "women" | "mixed";
  label: string;
  doorPulse: number;
  onFreeze: (m: Member) => void;
}) {
  if (result.kind === "idle") {
    return (
      <Card className="glass rounded-2xl border-dashed">
        <CardContent className="p-10 text-center text-muted-foreground">
          <User2 className="size-8 mx-auto mb-2 opacity-50" />
          Scan a member to see validation results.
        </CardContent>
      </Card>
    );
  }

  if (result.kind === "unknown") {
    return (
      <Card className="glass rounded-2xl border-destructive/40 bg-destructive/10">
        <CardContent className="p-8 flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-destructive/20 grid place-items-center">
            <XCircle className="size-7 text-destructive" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-destructive">Not Found</div>
            <div className="text-xl font-semibold">No member matches "{result.raw}"</div>
            <div className="text-sm text-muted-foreground">Verify the ID or CIN and try again.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const m = result.member;
  const tone =
    result.kind === "granted"
      ? "border-success/40 bg-success/10"
      : result.kind === "expired"
        ? "border-warning/40 bg-warning/10"
        : "border-destructive/40 bg-destructive/10";

  const Icon =
    result.kind === "granted" ? CheckCircle2 : result.kind === "expired" ? AlertOctagon : XCircle;

  const iconTone =
    result.kind === "granted"
      ? "bg-success/20 text-success"
      : result.kind === "expired"
        ? "bg-warning/20 text-warning"
        : "bg-destructive/20 text-destructive";

  const headline =
    result.kind === "granted"
      ? "Access Granted"
      : result.kind === "expired"
        ? "Access Denied · Subscription Expired"
        : `Access Denied · ${mode === "men" ? "Men's" : "Women's"} Day Today`;

  const subline =
    result.kind === "granted"
      ? `${result.days} day${result.days === 1 ? "" : "s"} left on ${m.plan} plan`
      : result.kind === "expired"
        ? `Subscription ended. Renew to restore access.`
        : `${m.name} is registered as ${m.gender === "male" ? "Male" : "Female"}. ${label} is reserved for ${mode === "men" ? "Men" : "Women"}.`;

  return (
    <Card className={cn("glass rounded-2xl border-2 overflow-hidden", tone)}>
      <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
        <Avatar className="size-24 ring-2 ring-border/60">
          <AvatarFallback
            className={cn(
              "text-2xl font-semibold",
              m.gender === "male"
                ? "bg-mens/30 text-foreground"
                : "bg-womens/30 text-foreground",
            )}
          >
            {initials(m.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs uppercase tracking-widest">
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md", iconTone)}>
              <Icon className="size-3.5" /> {result.kind === "granted" ? "OK" : "DENY"}
            </span>
            <span className="text-muted-foreground">{m.id} · {m.cin}</span>
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">{m.name}</div>
          <div className="mt-1 text-lg font-medium">{headline}</div>
          <div className="text-sm text-muted-foreground mt-1">{subline}</div>

          {result.kind === "granted" && (
            <div
              key={doorPulse}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-success/50 bg-success/15 px-3 py-2 animate-in fade-in zoom-in-95 duration-500"
            >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full size-2.5 bg-success" />
              </span>
              <Zap className="size-4 text-success" />
              <div className="text-left">
                <div className="text-sm font-semibold text-success">Door Unlocked</div>
                <div className="text-[11px] text-muted-foreground">Webhook fired to Turnstile API</div>
              </div>
            </div>
          )}

          {(result.kind === "expired" || result.kind === "wrong-day") && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <WhatsAppButton
                member={m}
                tone={result.kind === "expired" ? "renew" : "denied"}
                size="sm"
                label={result.kind === "expired" ? "WhatsApp renewal link" : "Notify member"}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onFreeze(m)}
                className="gap-1.5 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30"
              >
                <Snowflake className="size-4" /> Freeze account
              </Button>
            </div>
          )}
        </div>

        <div className={cn("size-20 rounded-2xl grid place-items-center shrink-0", iconTone)}>
          <Icon className="size-10" />
        </div>
      </CardContent>
    </Card>
  );
}
