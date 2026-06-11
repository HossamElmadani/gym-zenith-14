import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, CheckCircle, Activity, Clock, Users, AlertTriangle, Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MEMBERS, daysRemaining, subStatus, todayGender, type Member,
} from "@/lib/gym-data";
import { useCoaches, type Coach } from "@/lib/coaches-data";
import { gymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";

type Role = "Member" | "Coach";
type CheckIn = {
  id: string;
  personId: string;
  name: string;
  role: Role;
  gender?: "male" | "female";
  ts: number;
};

const initials = (n: string) =>
  n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

export function ReceptionDesk() {
  const { t, lang, dir } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"members" | "coaches">("members");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const coaches = useCoaches();

  const shift = useMemo(() => todayGender(), []);

  useEffect(() => { inputRef.current?.focus(); }, [tab]);

  const checkedInMemberIds = useMemo(
    () => new Set(checkIns.filter((c) => c.role === "Member").map((c) => c.personId)),
    [checkIns],
  );
  const checkedInCoachIds = useMemo(
    () => new Set(checkIns.filter((c) => c.role === "Coach").map((c) => c.personId)),
    [checkIns],
  );

  const eligibleMembers = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (checkedInMemberIds.has(m.id)) return false;
      if (shift === "men" && m.gender !== "male") return false;
      if (shift === "women" && m.gender !== "female") return false;
      if (shift === "closed") return false;
      return true;
    });
  }, [shift, checkedInMemberIds]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligibleMembers;
    return eligibleMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.cin.toLowerCase().includes(q),
    );
  }, [eligibleMembers, query]);

  const eligibleCoaches = useMemo(() => {
    return coaches.filter((c) => {
      if (c.status !== "active") return false;
      if (checkedInCoachIds.has(c.id)) return false;
      if (shift === "men"   && c.audience !== "men")   return false;
      if (shift === "women" && c.audience !== "women") return false;
      if (shift === "closed") return false;
      return true;
    });
  }, [coaches, shift, checkedInCoachIds]);

  const filteredCoaches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligibleCoaches;
    return eligibleCoaches.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q),
    );
  }, [eligibleCoaches, query]);

  const handleCheckInMember = (m: Member) => {
    if (daysRemaining(m.subEnd) <= 0) {
      toast.error(lang === "ar" ? `الاشتراك منتهي: ${m.name}` : `Abonnement expiré : ${m.name}`);
      return;
    }
    
    // تسجيل محلي للواجهة (وهذه الدالة ستقوم آلياً بالمزامنة السحابية عبر gym-store)
    gymStore.recordCheckIn(m.id);
    const now = Date.now();
    setCheckIns((prev) => [
      { id: `${m.id}-${now}`, personId: m.id, name: m.name, role: "Member", gender: m.gender, ts: now },
      ...prev,
    ]);
    
    toast.success(lang === "ar" ? `تم تسجيل دخول: ${m.name}` : `Pointage réussi pour ${m.name}`);
    setQuery("");
    inputRef.current?.focus();
  };

const handleCheckInCoach = (c: Coach) => {
    // تسجيل محلي للواجهة (وهذه الدالة ستقوم آلياً بالمزامنة السحابية عبر gym-store)
    gymStore.recordCoachAttendance(c.id, c.name); // 👈 التعديل هنا
    const now = Date.now();
    setCheckIns((prev) => [
      { id: `${c.id}-${now}`, personId: c.id, name: c.name, role: "Coach", ts: now },
      ...prev,
    ]);
    
    toast.success(lang === "ar" ? `تم تسجيل المدرب: ${c.name}` : `Coach pointé : ${c.name}`);
    setQuery("");
    inputRef.current?.focus();
  };

  const shiftLabel =
    shift === "men" ? t("shift.men")
    : shift === "women" ? t("shift.women")
    : t("shift.closed");

  return (
    <div dir={dir} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* LEFT: Live Check-ins */}
      <Card className="glass rounded-2xl xl:col-span-1 order-2 xl:order-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-primary" />
            {lang === "ar" ? "تسجيلات الدخول اليوم" : "Présences d'Aujourd'hui"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="text-xs text-muted-foreground">
              {lang === "ar" ? "إجمالي الدخول" : "Total des entrées"}
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">
              <bdi dir="ltr">{checkIns.length}</bdi>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{shiftLabel}</div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {checkIns.length === 0 && (
              <div className="text-sm text-muted-foreground py-10 text-center">
                <Users className="size-8 mx-auto mb-2 opacity-40" />
                {lang === "ar" ? "في انتظار أول تسجيل دخول…" : "En attente du premier pointage..."}
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
                        c.role === "Coach"
                          ? "bg-primary/20 text-primary"
                          : c.gender === "male"
                            ? "bg-mens/20 text-mens-foreground"
                            : "bg-womens/20 text-womens-foreground",
                      )}
                    >
                      {initials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {c.name}
                      {c.role === "Coach" && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[9px] border-primary/30 text-primary">
                          {lang === "ar" ? "مدرب" : "Coach"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <bdi dir="ltr">{c.personId}</bdi>
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
                  {lang === "ar" ? "تسجيل دخول ذكي" : "Pointage Visuel Intelligent"}
                </div>
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                  {lang === "ar" ? "اختر الشخص لتسجيل الدخول" : "Cliquez sur une personne pour la pointer"}
                </h2>
              </div>
              <Badge variant="secondary" className="self-start sm:self-auto bg-primary/10 text-primary border border-primary/20">
                {shiftLabel}
              </Badge>
            </div>

            <Tabs value={tab} onValueChange={(v) => { setTab(v as "members" | "coaches"); setQuery(""); }}>
              <TabsList className="grid grid-cols-2 w-full sm:w-72">
                <TabsTrigger value="members" className="gap-1.5">
                  <Users className="size-4" />
                  {lang === "ar" ? "الأعضاء" : "Membres"}
                </TabsTrigger>
                <TabsTrigger value="coaches" className="gap-1.5">
                  <Dumbbell className="size-4" />
                  {lang === "ar" ? "المدربون" : "Coachs"}
                </TabsTrigger>
              </TabsList>

              <div className="relative mt-4">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    tab === "members"
                      ? (lang === "ar" ? "ابحث بالاسم أو رقم العضو…" : "Rechercher par nom ou ID...")
                      : (lang === "ar" ? "ابحث عن مدرب…" : "Rechercher un coach...")
                  }
                  className="h-12 ps-10 bg-background/50 rounded-xl"
                />
              </div>

              <TabsContent value="members" className="mt-4">
                {shift === "closed" ? (
                  <ClosedState label={t("shift.closed")} />
                ) : filteredMembers.length === 0 ? (
                  <EmptyState text={lang === "ar" ? "لا يوجد أعضاء مطابقون." : "Aucun membre correspondant."} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-auto pr-1">
                    {filteredMembers.map((m) => (
                      <MemberCheckInCard key={m.id} member={m} lang={lang} onCheckIn={handleCheckInMember} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="coaches" className="mt-4">
                {shift === "closed" ? (
                  <ClosedState label={t("shift.closed")} />
                ) : filteredCoaches.length === 0 ? (
                  <EmptyState text={lang === "ar" ? "لا يوجد مدربون نشطون لهذا الدوام." : "Aucun coach actif pour ce service."} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[640px] overflow-auto pr-1">
                    {filteredCoaches.map((c) => (
                      <CoachCheckInCard key={c.id} coach={c} lang={lang} onCheckIn={handleCheckInCoach} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

function ClosedState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
      <AlertTriangle className="size-8 mx-auto mb-2 opacity-50" />
      {label}
    </div>
  );
}

function MemberCheckInCard({
  member, lang, onCheckIn,
}: {
  member: Member; lang: "ar" | "fr"; onCheckIn: (m: Member) => void;
}) {
  const days = daysRemaining(member.subEnd);
  const status = subStatus(member.subEnd);
  const expired = status === "expired";

  const statusTone =
    status === "active"   ? "bg-success/20 text-success border-success/30"
  : status === "expiring" ? "bg-warning/20 text-warning border-warning/30"
                          : "bg-destructive/20 text-destructive border-destructive/30";

  const statusLabel =
    status === "active"   ? (lang === "ar" ? "نشط" : "Actif")
  : status === "expiring" ? (lang === "ar" ? "قارب الانتهاء" : "Expire Bientôt")
                          : (lang === "ar" ? "منتهي" : "Expiré");

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
              member.gender === "male" ? "bg-mens/25 text-foreground" : "bg-womens/25 text-foreground",
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
        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", statusTone)}>
          {statusLabel}
        </Badge>
        <div className="text-[11px] text-muted-foreground">
          <bdi dir="ltr">{days > 0 ? days : 0}j {lang === "ar" ? "" : "restants"}</bdi>
        </div>
      </div>

      <Button
        onClick={() => onCheckIn(member)}
        disabled={expired}
        size="sm"
        className={cn(
          "w-full gap-1.5",
          expired && "bg-destructive/20 text-destructive hover:bg-destructive/20 cursor-not-allowed",
        )}
        variant={expired ? "secondary" : "default"}
      >
        <CheckCircle className="size-4" />
        {expired
          ? (lang === "ar" ? "منتهي" : "Expiré")
          : (lang === "ar" ? "تسجيل الدخول" : "Pointer")}
      </Button>
    </div>
  );
}

function CoachCheckInCard({
  coach, lang, onCheckIn,
}: {
  coach: Coach; lang: "ar" | "fr"; onCheckIn: (c: Coach) => void;
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-card/40 p-3 flex flex-col gap-3 transition-all hover:border-primary/40 hover:bg-card/60">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="text-sm font-semibold bg-primary/20 text-primary">
            {initials(coach.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{coach.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{coach.specialty}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary">
          {lang === "ar" ? "مدرب" : "Coach"}
        </Badge>
        <div className="text-[11px] text-muted-foreground">
          <bdi dir="ltr">{coach.startTime}–{coach.endTime}</bdi>
        </div>
      </div>

      <Button onClick={() => onCheckIn(coach)} size="sm" className="w-full gap-1.5">
        <CheckCircle className="size-4" />
        {lang === "ar" ? "بدء الحصة" : "Démarrer le service"}
      </Button>
    </div>
  );
}