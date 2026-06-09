import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  CheckCircle,
  Activity,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MEMBERS,
  daysRemaining,
  subStatus,
  todayGender,
  type Member,
} from "@/lib/gym-data";
import { useI18n } from "@/lib/i18n";

type CheckIn = {
  id: string;
  memberId: string;
  name: string;
  gender: "male" | "female";
  ts: number;
};

const initials = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function ReceptionDesk() {
  const { t, lang, dir } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const shift = useMemo(() => todayGender(), []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const checkedInIds = useMemo(
    () => new Set(checkIns.map((c) => c.memberId)),
    [checkIns],
  );

  const eligible = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (checkedInIds.has(m.id)) return false;
      if (shift === "men" && m.gender !== "male") return false;
      if (shift === "women" && m.gender !== "female") return false;
      if (shift === "closed") return false;
      return true;
    });
  }, [shift, checkedInIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.cin.toLowerCase().includes(q),
    );
  }, [eligible, query]);

  const handleCheckIn = (m: Member) => {
    if (daysRemaining(m.subEnd) <= 0) {
      toast.error(
        lang === "ar"
          ? `الاشتراك منتهي: ${m.name}`
          : `Subscription expired: ${m.name}`,
      );
      return;
    }
    setCheckIns((prev) => [
      {
        id: `${m.id}-${Date.now()}`,
        memberId: m.id,
        name: m.name,
        gender: m.gender,
        ts: Date.now(),
      },
      ...prev,
    ]);
    toast.success(
      lang === "ar"
        ? `تم تسجيل دخول: ${m.name}`
        : `Check-in successful for ${m.name}`,
    );
    inputRef.current?.focus();
  };

  const shiftLabel =
    shift === "men"
      ? t("shift.men")
      : shift === "women"
        ? t("shift.women")
        : t("shift.closed");

  return (
    <div dir={dir} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* LEFT: Live Check-ins */}
      <Card className="glass rounded-2xl xl:col-span-1 order-2 xl:order-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" />
            {lang === "ar" ? "تسجيلات الدخول اليوم" : "Live Check-ins Today"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "إجمالي الدخول" : "Total entries"}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">
              <bdi dir="ltr">{checkIns.length}</bdi>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {shiftLabel}
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {checkIns.length === 0 && (
              <div className="text-sm text-muted-foreground py-10 text-center">
                <Users className="size-8 mx-auto mb-2 opacity-40" />
                {lang === "ar"
                  ? "في انتظار أول تسجيل دخول…"
                  : "Waiting for first check-in…"}
              </div>
            )}
            {checkIns.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="size-9">
                    <AvatarFallback
                      className={cn(
                        "text-[11px]",
                        c.gender === "male"
                          ? "bg-mens/20 text-mens-foreground"
                          : "bg-womens/20 text-womens-foreground",
                      )}
                    >
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      <bdi dir="ltr">{c.memberId}</bdi>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <bdi dir="ltr">{formatTime(c.ts)}</bdi>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Smart Visual Grid */}
      <div className="xl:col-span-2 space-y-4 order-1 xl:order-2">
        <Card className="glass rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {lang === "ar" ? "تسجيل دخول ذكي" : "Smart Visual Check-in"}
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {lang === "ar"
                    ? "اختر العضو لتسجيل الدخول"
                    : "Tap a member to check in"}
                </h2>
              </div>
              <Badge
                variant="secondary"
                className="self-start sm:self-auto bg-primary/10 text-primary border border-primary/20"
              >
                {shiftLabel}
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === "ar"
                    ? "ابحث بالاسم أو رقم العضو…"
                    : "Search by name or ID…"
                }
                className="h-12 ps-10 bg-background/50 rounded-xl"
              />
            </div>

            {shift === "closed" ? (
              <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                <AlertTriangle className="size-8 mx-auto mb-2 opacity-50" />
                {t("shift.closed")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground text-sm">
                {lang === "ar"
                  ? "لا يوجد أعضاء مطابقون."
                  : "No matching members."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-auto pr-1">
                {filtered.map((m) => (
                  <MemberCheckInCard
                    key={m.id}
                    member={m}
                    lang={lang}
                    onCheckIn={handleCheckIn}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberCheckInCard({
  member,
  lang,
  onCheckIn,
}: {
  member: Member;
  lang: "ar" | "en";
  onCheckIn: (m: Member) => void;
}) {
  const days = daysRemaining(member.subEnd);
  const status = subStatus(member.subEnd);
  const expired = status === "expired";

  const statusTone =
    status === "active"
      ? "bg-success/20 text-success border-success/30"
      : status === "expiring"
        ? "bg-warning/20 text-warning border-warning/30"
        : "bg-destructive/20 text-destructive border-destructive/30";

  const statusLabel =
    status === "active"
      ? lang === "ar"
        ? "نشط"
        : "Active"
      : status === "expiring"
        ? lang === "ar"
          ? "قارب الانتهاء"
          : "Expiring"
        : lang === "ar"
          ? "منتهي"
          : "Expired";

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border/60 bg-card/40 p-3 flex flex-col gap-3 transition-all hover:border-primary/40 hover:bg-card/60",
        expired && "opacity-80",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback
            className={cn(
              "text-sm font-semibold",
              member.gender === "male"
                ? "bg-mens/25 text-foreground"
                : "bg-womens/25 text-foreground",
            )}
          >
            {initials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{member.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            <bdi dir="ltr">{member.id}</bdi>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn("text-[10px] px-2 py-0.5", statusTone)}
        >
          {statusLabel}
        </Badge>
        <div className="text-[11px] text-muted-foreground">
          <bdi dir="ltr">
            {days > 0 ? days : 0}d {lang === "ar" ? "" : "left"}
          </bdi>
        </div>
      </div>

      <Button
        onClick={() => onCheckIn(member)}
        disabled={expired}
        size="sm"
        className={cn(
          "w-full gap-1.5",
          expired &&
            "bg-destructive/20 text-destructive hover:bg-destructive/20 cursor-not-allowed",
        )}
        variant={expired ? "secondary" : "default"}
      >
        <CheckCircle className="size-4" />
        {expired
          ? lang === "ar"
            ? "منتهي"
            : "Expired"
          : lang === "ar"
            ? "تسجيل الدخول"
            : "Check-in"}
      </Button>
    </div>
  );
}
