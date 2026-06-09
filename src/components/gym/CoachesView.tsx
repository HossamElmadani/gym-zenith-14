import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Check, ChevronsUpDown, Clock, Copy, Dumbbell, Plus, Sparkles, User2, UserPlus, Users2, Archive, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCoaches, coachStore, formatSchedule, WEEKDAYS, ALLOWED_DAYS, isDayAllowed,
  getCoachBillingCycle,
  type Coach, type CoachAudience, type Weekday,
} from "@/lib/coaches-data";
import { MEMBERS, todayGender, daysRemaining, subStatus, type Member } from "@/lib/gym-data";
import { useGymStore, gymStore } from "@/lib/gym-store";
import { tzDayOfWeek, tzFormatDate, tzTodayISO } from "@/lib/gym-tz";
import { buildWaLink } from "./WhatsAppButton";
import { useI18n } from "@/lib/i18n";
import { InsuranceShield } from "./InsuranceShield";

const audienceTheme = {
  men:   { ring: "ring-blue-500/40", border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300", chip: "bg-blue-500/15 text-blue-300 border-blue-500/30", dot: "bg-blue-500" },
  women: { ring: "ring-rose-500/40", border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-300", chip: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-500" },
} as const;

// --- أضف هذا الكود هنا ---
const AR_DAYS: Record<number, string> = { 0: "الأحد", 1: "الإثنين", 2: "الثلاثاء", 3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت" };
const EN_DAYS: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

function formatLocalSchedule(c: Coach, lang: string) {
  const days = c.workingDays.map(d => lang === "ar" ? AR_DAYS[d] : EN_DAYS[d]).join(" · ");
  return `${days} · ${c.startTime}-${c.endTime}`;
}
// -----------------------

export function CoachesView() {
  const { t, lang, dir } = useI18n();
  const coaches = useCoaches();
  useGymStore((s) => s.v);

  const todayMode = todayGender(new Date());
  const defaultTab: CoachAudience = todayMode === "women" ? "women" : "men";
  const [tab, setTab] = useState<CoachAudience>(defaultTab);
  const [openCoach, setOpenCoach] = useState<Coach | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => coaches.filter((c) => c.audience === tab), [coaches, tab]);

  return (
    <div dir={dir}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as CoachAudience)} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="glass border border-border/60 bg-card/40 p-1 h-auto">
            <TabsTrigger value="men" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200">
              <span className="size-2 rounded-full bg-blue-500" /> {lang === "ar" ? "مدربو الرجال" : "Men's Coaches"}
              <Badge variant="secondary" className="bg-blue-500/15 text-blue-200 border-blue-500/30 mx-1">
                {coaches.filter((c) => c.audience === "men").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="women" className="gap-2 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-200">
              <span className="size-2 rounded-full bg-rose-500" /> {lang === "ar" ? "مدربات النساء" : "Women's Coaches"}
              <Badge variant="secondary" className="bg-rose-500/15 text-rose-200 border-rose-500/30 mx-1">
                {coaches.filter((c) => c.audience === "women").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {todayMode !== "closed" && (
              <Badge variant="secondary" className="bg-accent/40 text-muted-foreground border-border/60">
                <Sparkles className="size-3 mx-1" /> {t("coach.autoOpened")}
              </Badge>
            )}
            <AddCoachDialog open={addOpen} setOpen={setAddOpen} defaultAudience={tab} />
          </div>
        </div>

        <TabsContent value="men" className="mt-0">
          <CoachGrid coaches={filtered} onSelect={setOpenCoach} />
        </TabsContent>
        <TabsContent value="women" className="mt-0">
          <CoachGrid coaches={filtered} onSelect={setOpenCoach} />
        </TabsContent>
      </Tabs>

      <CoachDetailSheet coach={openCoach} onClose={() => setOpenCoach(null)} />
    </div>
  );
}

function CoachGrid({ coaches, onSelect }: { coaches: Coach[]; onSelect: (c: Coach) => void }) {
  const { t, lang } = useI18n();
  
  if (coaches.length === 0) {
    return (
      <Card className="glass rounded-2xl">
        <CardContent className="py-14 text-center text-muted-foreground text-sm">
          {lang === "ar" ? "لا يوجد مدربون بعد. استخدم " : "No coaches yet. Use "}
          <span className="text-foreground font-medium">+ {t("action.addCoach")}</span> 
          {lang === "ar" ? " لإنشاء واحد." : " to create one."}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {coaches.map((c) => {
        const theme = audienceTheme[c.audience];
        const assignedCount = MEMBERS.filter((m) => m.coachId === c.id).length;
        const audienceLabel = c.audience === "men" ? t("coach.menOnly") : t("coach.womenOnly");
        
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              "glass rounded-2xl text-start p-4 border transition-all hover:-translate-y-0.5 hover:shadow-lg",
              theme.border, "hover:" + theme.ring,
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("size-12 rounded-xl grid place-items-center ring-1 shrink-0", theme.bg, theme.ring)}>
                <Dumbbell className={cn("size-5", theme.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold tracking-tight truncate">{c.name}</div>
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.specialty}</div>
              </div>
              <Badge variant="outline" className={cn("text-[10px] border whitespace-nowrap", theme.chip)}>{audienceLabel}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" /> <bdi>{formatLocalSchedule(c, lang)}</bdi>
              </span>
            </div>
            <div className={cn("mt-3 flex items-center justify-between rounded-lg px-2.5 py-1.5", theme.bg)}>
              <span className="text-[11px] text-muted-foreground">{t("coach.assignedMembers")}</span>
              <span className={cn("text-sm font-semibold flex items-center gap-1.5", theme.text)}>
                <Users2 className="size-3.5" /> {assignedCount}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AddCoachDialog({ open, setOpen, defaultAudience }: { open: boolean; setOpen: (b: boolean) => void; defaultAudience: CoachAudience }) {
  const { t, lang } = useI18n();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [audience, setAudience] = useState<CoachAudience>(defaultAudience);
  const [days, setDays] = useState<Weekday[]>(ALLOWED_DAYS[defaultAudience]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");

  const reset = () => {
    setName(""); setSpecialty("");
    setAudience(defaultAudience);
    setDays(ALLOWED_DAYS[defaultAudience]);
    setStartTime("18:00"); setEndTime("20:00");
  };

  const onAudienceChange = (a: CoachAudience) => {
    setAudience(a);
    setDays((prev) => prev.filter((d) => isDayAllowed(a, d)));
  };

  const toggleDay = (d: Weekday) => {
    if (!isDayAllowed(audience, d)) return;
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const submit = () => {
    if (!name.trim() || !specialty.trim()) { toast.error(lang === "ar" ? "اسم المدرب والتخصص مطلوبان" : "Coach name and specialty are required"); return; }
    if (days.length === 0) { toast.error(lang === "ar" ? "اختر يوم عمل واحد على الأقل" : "Pick at least one working day"); return; }
    if (endTime <= startTime) { toast.error(lang === "ar" ? "وقت الانتهاء يجب أن يكون بعد وقت البدء" : "End time must be after start time"); return; }
    
    const c = coachStore.add({
      name: name.trim(), specialty: specialty.trim(), audience,
      workingDays: days.sort((a, b) => a - b), startTime, endTime,
    });
    
    toast.success(lang === "ar" ? `تمت إضافة المدرب · ${c.name}` : `Coach added · ${c.name}`, {
      description: `${audience === "men" ? t("coach.menOnly") : t("coach.womenOnly")} · ${formatSchedule(c)}`,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { setOpen(b); if (!b) reset(); else { setAudience(defaultAudience); setDays(ALLOWED_DAYS[defaultAudience]); } }}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Plus className="size-4" /> {t("action.addCoach")}</Button>
      </DialogTrigger>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("action.addCoach")}</DialogTitle>
          <DialogDescription>
            {lang === "ar" ? "المدربون مرتبطون بشكل دائم بجمهور واحد ويمكنهم العمل فقط في أيام هذا الجمهور." : "Coaches are permanently tied to one audience and can only work on that group's shift days."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "اسم المدرب" : "Coach name"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "مثال: يونس العمراني" : "e.g. Salma Idrissi"} className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("form.specialty")}</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={lang === "ar" ? "مثال: كمال الأجسام، كارديو" : "e.g. Aerobics, Bodybuilding"} className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label>{t("form.targetAudience")}</Label>
            <RadioGroup value={audience} onValueChange={(v) => onAudienceChange(v as CoachAudience)} className="grid grid-cols-2 gap-2">
              <label className={cn("flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors", audience === "men" ? "border-blue-500/60 bg-blue-500/10" : "border-border/60 hover:bg-accent/40")}>
                <RadioGroupItem value="men" className="border-blue-500 text-blue-500" />
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">{t("coach.menOnly")}</span>
              </label>
              <label className={cn("flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors", audience === "women" ? "border-rose-500/60 bg-rose-500/10" : "border-border/60 hover:bg-accent/40")}>
                <RadioGroupItem value="women" className="border-rose-500 text-rose-500" />
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="text-sm font-medium">{t("coach.womenOnly")}</span>
              </label>
            </RadioGroup>
            <p className="text-[11px] text-muted-foreground">
              {lang === "ar" ? "بمجرد التحديد، لا يمكن تغيير هذا — فهو يحدد الأيام والأعضاء المتاحين." : "Once set, this cannot be changed — it gates which days and members are available."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("form.workingDays")}</Label>
            <div className="grid grid-cols-7 gap-1.5" dir="ltr">
              {WEEKDAYS.map((w) => {
                const allowed = isDayAllowed(audience, w.idx);
                const selected = days.includes(w.idx);
                return (
                  <button
                    type="button"
                    key={w.idx}
                    onClick={() => toggleDay(w.idx)}
                    disabled={!allowed}
                    title={allowed ? w.long : `${w.long} is reserved for the other group`}
                    className={cn(
                      "h-12 rounded-lg border text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all",
                      allowed && selected && audience === "men"   && "border-blue-500/60 bg-blue-500/15 text-blue-200",
                      allowed && selected && audience === "women" && "border-rose-500/60 bg-rose-500/15 text-rose-200",
                      allowed && !selected && "border-border/60 hover:bg-accent/40 text-foreground",
                      !allowed && "border-dashed border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through",
                    )}
                  >
                    {w.short}
                    {selected && allowed && <Check className="size-3" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {audience === "men"
                ? (lang === "ar" ? "أيام الرجال: الثلاثاء، الخميس، السبت. الأيام الأخرى مقفلة." : "Men's shifts: Tue, Thu, Sat. Other days are locked.")
                : (lang === "ar" ? "أيام النساء: الإثنين، الأربعاء، الجمعة. الأيام الأخرى مقفلة." : "Women's shifts: Mon, Wed, Fri. Other days are locked.")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Clock className="size-3.5" /> {t("form.startTime")}</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Clock className="size-3.5" /> {t("form.endTime")}</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-background/50" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("action.cancel")}</Button>
          <Button onClick={submit}>{t("action.addCoach")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoachDetailSheet({ coach, onClose }: { coach: Coach | null; onClose: () => void }) {
  const { t, lang } = useI18n();
  useGymStore((s) => s.v);
  const [assignOpen, setAssignOpen] = useState(false);
  
  if (!coach) return null;
  const theme = audienceTheme[coach.audience];
  const members = MEMBERS.filter((m) => m.coachId === coach.id);
  const todayIdx = tzDayOfWeek() as Weekday;
  const isWorkingToday = coach.workingDays.includes(todayIdx);
  const todayRoster = isWorkingToday ? members : [];
  const audienceLabel = coach.audience === "men" ? t("coach.menOnly") : t("coach.womenOnly");

  return (
    <Sheet open={!!coach} onOpenChange={(b) => !b && onClose()}>
      <SheetContent className="glass border-border/60 w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={cn("size-14 rounded-2xl grid place-items-center ring-1 shrink-0", theme.bg, theme.ring)}>
              <Dumbbell className={cn("size-6", theme.text)} />
            </div>
            <div className="flex-1 text-start">
              <SheetTitle className="text-lg">{coach.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <span>{coach.specialty}</span>
                <span className="text-border">·</span>
                <Badge variant="outline" className={cn("text-[10px] border", theme.chip)}>{audienceLabel}</Badge>
              </SheetDescription>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex items-center gap-2 text-sm">
            <CalendarDays className={cn("size-4", theme.text)} />
            <span className="text-muted-foreground">{lang === "ar" ? "الجدول:" : "Schedule:"}</span>
            <span className="font-medium"><bdi>{formatLocalSchedule(coach, lang)}</bdi></span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users2 className="size-4 text-primary" /> {t("nav.members")}
            </h3>
            <Button size="sm" className="gap-1.5" onClick={() => setAssignOpen(true)}>
              <UserPlus className="size-3.5" /> {t("member.assign")}
            </Button>
          </div>

          <Tabs defaultValue="all" dir={lang === "ar" ? "rtl" : "ltr"}>
            <TabsList className="glass border border-border/60 bg-card/40 p-1 h-auto w-full grid grid-cols-2">
              <TabsTrigger value="all" className="gap-1.5">
                {lang === "ar" ? "الكل" : "All Assigned"}
                <Badge variant="secondary" className="bg-accent/40 text-[10px]">{members.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-1.5">
                {t("member.roster")}
                <Badge variant="secondary" className={cn("text-[10px]", isWorkingToday ? "bg-success/15 text-success" : "bg-muted/40")}>
                  {todayRoster.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-3">
              <AssignedMembersTable members={members} coach={coach} mode="all" />
            </TabsContent>
            <TabsContent value="today" className="mt-3">
              {!isWorkingToday ? (
                <Card className="glass rounded-xl">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    {lang === "ar" 
                      ? `${coach.name} ليس لديه دوام اليوم. هذا اليوم مخصص للمجموعة الأخرى أو يوم راحة.` 
                      : `${coach.name} is not scheduled today. Today is reserved for the other group or off-day.`}
                  </CardContent>
                </Card>
              ) : (
                <AssignedMembersTable members={todayRoster} coach={coach} mode="today" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 rounded-xl border border-border/40 bg-card/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <User2 className="size-4 text-primary shrink-0 mt-0.5" />
          {t("member.operationalView")}
        </div>
      </SheetContent>

      <AssignMemberDialog open={assignOpen} onClose={() => setAssignOpen(false)} coach={coach} />
    </Sheet>
  );
}

function buildReminder(member: Member, coach: Coach, lang: string) {
  const first = member.name.split(" ")[0];
  if (lang === "ar") {
    return `سلام ${first}، تذكير سريع بأن حصتك مع الكوتش ${coach.name} ستكون اليوم على الساعة ${coach.startTime}. نراك هناك! 💪`;
  }
  return `Salam ${first}, a quick reminder that your session with Coach ${coach.name} is today at ${coach.startTime}. See you there! 💪`;
}

function AssignedMembersTable({ members, coach, mode }: { members: Member[]; coach: Coach; mode: "all" | "today" }) {
  const { t, lang } = useI18n();
  const theme = audienceTheme[coach.audience];

  const copyAll = async () => {
    if (members.length === 0) return;
    const text = members.map((m) => m.phone).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(lang === "ar" ? `تم نسخ ${members.length} رقم` : `Copied ${members.length} numbers`, {
        description: lang === "ar" ? "ألصق الأرقام في قائمة رسائل واتساب الخاصة بك." : "Paste into your WhatsApp broadcast list.",
      });
    } catch {
      toast.error(lang === "ar" ? "لا يمكن الوصول للحافظة" : "Couldn't access clipboard");
    }
  };

  if (members.length === 0) {
    return (
      <Card className="glass rounded-xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {mode === "today"
            ? (lang === "ar" ? "لا يوجد أعضاء في قائمة اليوم." : "No members on today's roster yet.")
            : (lang === "ar" ? "لا يوجد أعضاء معينون بعد. استخدم زر 'تعيين عضو موجود' بالأعلى." : "No members assigned yet. Use “Assign Existing Member” above.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {mode === "today" && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            {lang === "ar" ? "حصة اليوم على الساعة " : "Session today at "} 
            <span className={cn("font-medium", theme.text)}>{coach.startTime}</span>
          </span>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={copyAll}>
            <Copy className="size-3" /> {lang === "ar" ? "نسخ جميع الأرقام" : "Copy All Numbers"}
          </Button>
        </div>
      )}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50">
              <TableHead>{t("table.member")}</TableHead>
              <TableHead>{t("table.daysLeft")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-end">WhatsApp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const d = daysRemaining(m.subEnd);
              const status = subStatus(m.subEnd);
              const statusLabel = t(`status.${status}` as any) || status;
              
              const message = mode === "today"
                ? buildReminder(m, coach, lang)
                : (lang === "ar" 
                    ? `سلام ${m.name.split(" ")[0]}، معك نادي PULSE — الكوتش ${coach.name} في انتظارك. نراك في الحصة القادمة 💪`
                    : `Salam ${m.name.split(" ")[0]}, this is PULSE — your coach ${coach.name} is here for you. See you at the next session 💪`);
              
              const href = buildWaLink(m.phone, message);
              
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground">{m.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium"><bdi>{d}d</bdi></TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px]",
                        status === "active"   && "bg-success/15 text-success border-success/30",
                        status === "expiring" && "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
                        status === "expired"  && "bg-destructive/15 text-destructive border-destructive/30",
                      )}
                      variant="outline"
                    >
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      asChild
                      size="sm"
                      className="gap-1.5 h-7 bg-[#25D366] hover:bg-[#1ebe5d] text-black text-[11px] font-medium shadow-[0_6px_20px_-6px_rgba(37,211,102,0.55)]"
                      onClick={() => toast.success(lang === "ar" ? "تم فتح واتساب" : "WhatsApp opened")}
                    >
                      <a href={href} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${m.name}`}>
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
                          <path d="M19.05 4.91A10 10 0 0 0 12.04 2C6.5 2 2 6.5 2 12c0 1.76.46 3.47 1.34 4.98L2 22l5.16-1.35A10 10 0 0 0 22 12a9.94 9.94 0 0 0-2.95-7.09Zm-7 15.42a8.34 8.34 0 0 1-4.25-1.16l-.3-.18-3.06.8.82-2.98-.2-.31A8.32 8.32 0 1 1 20.36 12a8.36 8.36 0 0 1-8.31 8.33Zm4.57-6.24c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.56.13s-.65.81-.79.97c-.15.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.42.06-.65.32s-.85.83-.85 2.02.87 2.34 1 2.5c.13.17 1.72 2.62 4.16 3.67.58.25 1.04.4 1.39.51.59.18 1.12.16 1.55.1.47-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.11-.23-.17-.48-.3Z" />
                        </svg>
                        {t("action.remind")}
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AssignMemberDialog({ open, onClose, coach }: { open: boolean; onClose: () => void; coach: Coach }) {
  const { t, lang } = useI18n();
  useGymStore((s) => s.v);
  const [popOpen, setPopOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const targetGender = coach.audience === "men" ? "male" : "female";
  const eligible = useMemo(
    () => MEMBERS.filter((m) =>
      m.gender === targetGender &&
      daysRemaining(m.subEnd) > 0 &&
      m.coachId !== coach.id,
    ),
    [coach.id, targetGender],
  );

  const chosen = eligible.find((m) => m.id === selected) ?? null;

  const submit = () => {
    if (!chosen) { toast.error(lang === "ar" ? "اختر عضواً أولاً" : "Pick a member first"); return; }
    gymStore.assignCoach(chosen.id, coach.id);
    toast.success(lang === "ar" ? `تم تعيين ${chosen.name} للمدرب ${coach.name}` : `${chosen.name} assigned to ${coach.name}`);
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(b) => !b && (setSelected(null), onClose())}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("member.assign")}</DialogTitle>
          <DialogDescription>
            {lang === "ar" 
              ? `يتم عرض الأعضاء النشطين من فئة (${coach.audience === "men" ? "الذكور" : "الإناث"}) فقط — تم تطبيق العزل التام.` 
              : `Only active ${coach.audience === "men" ? "male" : "female"} members are shown — gender isolation is enforced.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t("table.member")}</Label>
          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between bg-background/50">
                {chosen ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="size-5"><AvatarFallback className="text-[9px] bg-muted">{chosen.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                    {chosen.name}
                    <span className="text-[10px] text-muted-foreground">{chosen.id}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("search.members")}</span>
                )}
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass border-border/60">
              <Command>
                <CommandInput placeholder={t("search.members")} />
                <CommandList>
                  <CommandEmpty>{lang === "ar" ? "لا يوجد أعضاء متاحين." : "No eligible members."}</CommandEmpty>
                  <CommandGroup>
                    {eligible.map((m) => (
                      <CommandItem
                        key={m.id}
                        value={`${m.name} ${m.cin} ${m.id}`}
                        onSelect={() => { setSelected(m.id); setPopOpen(false); }}
                        className="gap-2"
                      >
                        <Avatar className="size-6"><AvatarFallback className="text-[10px] bg-muted">{m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                        <div className="flex-1 leading-tight">
                          <div className="text-sm">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground"><bdi>{m.id}</bdi> · CIN <bdi>{m.cin}</bdi> · {daysRemaining(m.subEnd)}d left</div>
                        </div>
                        {selected === m.id && <Check className="size-4 text-primary" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-[11px] text-muted-foreground">
            {eligible.length} {lang === "ar" ? "عضو متاح للتعيين" : `eligible member${eligible.length === 1 ? "" : "s"}`}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("action.cancel")}</Button>
          <Button onClick={submit} disabled={!chosen}>{lang === "ar" ? "تعيين للمدرب" : "Assign to coach"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}