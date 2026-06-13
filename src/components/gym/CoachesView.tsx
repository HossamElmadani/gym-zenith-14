import { useMemo, useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Check, ChevronsUpDown, Clock, Copy, Dumbbell, Plus, Sparkles, User2, UserPlus, Users2, Archive, ShieldAlert, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCoaches, coachStore, formatSchedule, WEEKDAYS, ALLOWED_DAYS, isDayAllowed,
  getCoachBillingCycle,
  type Coach, type CoachAudience, type Weekday,
} from "@/lib/coaches-data";
import { MEMBERS, todayGender, daysRemaining, subStatus, type Member } from "@/lib/gym-data";
import { useGymStore, gymStore } from "@/lib/gym-store";
import { tzDayOfWeek, tzFormatDate, tzTodayISO, tzUsedPct } from "@/lib/gym-tz";
import { buildWaLink } from "./WhatsAppButton";
import { useI18n } from "@/lib/i18n";
import { InsuranceShield } from "./InsuranceShield";

const audienceTheme = {
  men:   { ring: "ring-blue-500/40", border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300", chip: "bg-blue-500/15 text-blue-300 border-blue-500/30", dot: "bg-blue-500" },
  women: { ring: "ring-rose-500/40", border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-300", chip: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-500" },
} as const;

// الأيام بالعربية والفرنسية
const AR_DAYS: Record<number, string> = { 0: "الأحد", 1: "الإثنين", 2: "الثلاثاء", 3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت" };
const FR_DAYS: Record<number, string> = { 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" };

function formatLocalSchedule(c: Coach, lang: string) {
  const days = c.workingDays.map(d => lang === "ar" ? AR_DAYS[d] : FR_DAYS[d]).join(" · ");
  return `${days} · ${c.startTime}-${c.endTime}`;
}

export function CoachesView() {
  const { t, lang, dir } = useI18n();
  const allCoaches = useCoaches();
  const coaches = useMemo(() => allCoaches.filter((c) => c.status !== "archived"), [allCoaches]);
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
              <span className="size-2 rounded-full bg-blue-500" /> {lang === "ar" ? "مدربو الرجال" : "Coachs Hommes"}
              <Badge variant="secondary" className="bg-blue-500/15 text-blue-200 border-blue-500/30 mx-1">
                {coaches.filter((c) => c.audience === "men").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="women" className="gap-2 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-200">
              <span className="size-2 rounded-full bg-rose-500" /> {lang === "ar" ? "مدربات النساء" : "Coachs Femmes"}
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

      <CoachDetailSheet coach={openCoach} onClose={() => setOpenCoach(null)} activeCoaches={coaches} />
    </div>
  );
}

function CoachGrid({ coaches, onSelect }: { coaches: Coach[]; onSelect: (c: Coach) => void }) {
  const { t, lang } = useI18n();
  
  if (coaches.length === 0) {
    return (
      <Card className="glass rounded-2xl">
        <CardContent className="py-14 text-center text-muted-foreground text-sm">
          {lang === "ar" ? "لا يوجد مدربون بعد. استخدم " : "Aucun coach. Utilisez "}
          <span className="text-foreground font-medium">+ {t("action.addCoach")}</span> 
          {lang === "ar" ? " لإنشاء واحد." : " pour en ajouter un."}
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
              {c.photoUrl ? (
                <Avatar className="size-12 rounded-xl ring-1 shrink-0">
                  <AvatarImage src={c.photoUrl} alt={c.name} className="object-cover rounded-xl" />
                  <AvatarFallback className={cn("rounded-xl grid place-items-center ring-1 shrink-0 text-sm", theme.bg, theme.text)}>
                    {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={cn("size-12 rounded-xl grid place-items-center ring-1 shrink-0", theme.bg, theme.ring)}>
                  <Dumbbell className={cn("size-5", theme.text)} />
                </div>
              )}
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(""); setSpecialty("");
    setAudience(defaultAudience);
    setDays(ALLOWED_DAYS[defaultAudience]);
    setStartTime("18:00"); setEndTime("20:00");
    setPhotoFile(null); setAvatar(null);
  };

  const onAudienceChange = (a: CoachAudience) => {
    setAudience(a);
    setDays((prev) => prev.filter((d) => isDayAllowed(a, d)));
  };

  const toggleDay = (d: Weekday) => {
    if (!isDayAllowed(audience, d)) return;
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error(lang === "ar" ? "ملفات الصور فقط" : "Only image files");
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!name.trim() || !specialty.trim()) { toast.error(lang === "ar" ? "اسم المدرب والتخصص مطلوبان" : "Le nom et la spécialité du coach sont requis"); return; }
    if (days.length === 0) { toast.error(lang === "ar" ? "اختر يوم عمل واحد على الأقل" : "Choisissez au moins un jour de travail"); return; }
    if (endTime <= startTime) { toast.error(lang === "ar" ? "وقت الانتهاء يجب أن يكون بعد وقت البدء" : "L'heure de fin doit être après l'heure de début"); return; }
    
    try {
      const c = await coachStore.add({
        name: name.trim(), specialty: specialty.trim(), audience,
        workingDays: days.sort((a, b) => a - b), startTime, endTime,
        photoFile: photoFile || undefined,
      });
      
      toast.success(lang === "ar" ? `تمت إضافة المدرب · ${c.name}` : `Coach ajouté · ${c.name}`, {
        description: `${audience === "men" ? t("coach.menOnly") : t("coach.womenOnly")} · ${formatSchedule(c)}`,
      });
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(lang === "ar" ? "فشل إضافة المدرب" : "Failed to add coach");
      console.error(err);
    }
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
            {lang === "ar" ? "المدربون مرتبطون بشكل دائم بجمهور واحد ويمكنهم العمل فقط في أيام هذا الجمهور." : "Les coachs sont liés en permanence à un public et ne peuvent travailler que les jours assignés à ce groupe."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "اسم المدرب" : "Nom du coach"}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "ar" ? "مثال: يونس العمراني" : "ex: Salma Idrissi"} className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("form.specialty")}</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={lang === "ar" ? "مثال: كمال الأجسام، كارديو" : "ex: Musculation, Cardio"} className="bg-background/50" />
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
              {lang === "ar" ? "بمجرد التحديد، لا يمكن تغيير هذا — فهو يحدد الأيام والأعضاء المتاحين." : "Une fois défini, cela ne peut être modifié — cela détermine les jours et les membres disponibles."}
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
                    title={allowed ? w.long : `${w.long} est réservé à l'autre groupe`}
                    className={cn(
                      "h-12 rounded-lg border text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all",
                      allowed && selected && audience === "men"   && "border-blue-500/60 bg-blue-500/15 text-blue-200",
                      allowed && selected && audience === "women" && "border-rose-500/60 bg-rose-500/15 text-rose-200",
                      allowed && !selected && "border-border/60 hover:bg-accent/40 text-foreground",
                      !allowed && "border-dashed border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through",
                    )}
                  >
                    {lang === "ar" ? AR_DAYS[w.idx].substring(0, 3) : FR_DAYS[w.idx]}
                    {selected && allowed && <Check className="size-3" />}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {audience === "men"
                ? (lang === "ar" ? "أيام الرجال: الثلاثاء، الخميس، السبت. الأيام الأخرى مقفلة." : "Créneaux hommes: Mar, Jeu, Sam. Les autres jours sont bloqués.")
                : (lang === "ar" ? "أيام النساء: الإثنين، الأربعاء، الجمعة. الأيام الأخرى مقفلة." : "Créneaux femmes: Lun, Mer, Ven. Les autres jours sont bloqués.")}
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

          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "صورة الملف الشخصي" : "Photo de profil (optionnelle)"}</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={cn("flex items-center gap-4 rounded-xl border border-dashed p-4 cursor-pointer transition-all",
                "border-border/70 hover:border-primary/60 hover:bg-accent/30",
                dragOver && "border-primary bg-primary/10")}
            >
              <Avatar className="size-14 ring-2 ring-border">
                {avatar ? <AvatarImage src={avatar} alt="preview" /> : null}
                <AvatarFallback className="bg-muted text-muted-foreground"><User2 className="size-5" /></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2"><Upload className="size-4 text-primary" /> {lang === "ar" ? "ارفع الصورة" : "Glissez l'image ou cliquez pour importer"}</div>
                <div className="text-xs text-muted-foreground"><bdi>PNG · JPG · {lang === "ar" ? "حتى" : "jusqu'à"} 5MB</bdi></div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
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

function CoachDetailSheet({ coach, onClose, activeCoaches }: { coach: Coach | null; onClose: () => void; activeCoaches: Coach[] }) {
  const { t, lang } = useI18n();
  useGymStore((s) => s.v);
  const [assignOpen, setAssignOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!coach) return null;
  const theme = audienceTheme[coach.audience];
  const members = MEMBERS.filter((m) => m.coachId === coach.id);
  const todayIdx = tzDayOfWeek() as Weekday;
  const isWorkingToday = coach.workingDays.includes(todayIdx);
  const todayRoster = isWorkingToday ? members : [];
  const audienceLabel = coach.audience === "men" ? t("coach.menOnly") : t("coach.womenOnly");
  const cycle = getCoachBillingCycle(coach.joinedAt, tzTodayISO());
  const activeInCycle = members.filter((m) => daysRemaining(m.subEnd) > 0).length;
  const replacementOptions = activeCoaches.filter((c) => c.id !== coach.id && c.audience === coach.audience);
  const cyclePct = tzUsedPct(cycle.start, cycle.end);

  const genderRing = coach.audience === "men" 
    ? "ring-4 ring-blue-500/60 ring-offset-2 ring-offset-background" 
    : "ring-4 ring-rose-500/60 ring-offset-2 ring-offset-background";

  return (
    <Sheet open={!!coach} onOpenChange={(b) => !b && onClose()}>
      <SheetContent className="glass border-border/60 w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
            <Avatar 
              className={cn(
                "size-32 border-2 border-border/30 transition-all",
                coach.photoUrl ? "cursor-pointer hover:scale-105 hover:opacity-90 active:scale-95" : "",
                genderRing
              )}
              onClick={() => coach.photoUrl && setZoomOpen(true)}
            >
              {coach.photoUrl ? (
                <AvatarImage src={coach.photoUrl} alt={coach.name} className="object-cover" />
              ) : null}
              <AvatarFallback className={cn("text-2xl font-bold", theme.bg, theme.text)}>
                {coach.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <SheetTitle className="text-xl font-bold tracking-tight">{coach.name}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground font-mono flex items-center justify-center gap-1.5">
                <span>ID: {coach.id}</span>
                <span>·</span>
                <Badge variant="outline" className={cn("text-[10px] border whitespace-nowrap", theme.chip)}>
                  {audienceLabel}
                </Badge>
              </SheetDescription>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex items-center gap-2 text-sm">
            <CalendarDays className={cn("size-4", theme.text)} />
            <span className="text-muted-foreground">{lang === "ar" ? "الجدول:" : "Planning:"}</span>
            <span className="font-medium"><bdi>{formatLocalSchedule(coach, lang)}</bdi></span>
          </div>
        </SheetHeader>

        <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
          <DialogContent className="max-w-md md:max-w-lg border-border/40 bg-card/90 backdrop-blur-xl p-1 overflow-hidden flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">{coach.name}</DialogTitle>
            <img 
              src={coach.photoUrl || ""} 
              alt={coach.name} 
              className="max-h-[70vh] w-full object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>

        <div className="mt-6 space-y-6">
          {/* Identity Grid */}
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/40 bg-background/20 p-3 text-sm">
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "التخصص" : "Specialty"}</span>
              <div className="font-semibold text-foreground">{coach.specialty}</div>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "الجمهور المستهدف" : "Target Audience"}</span>
              <div className="font-semibold text-foreground">{audienceLabel}</div>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "تاريخ الالتحاق" : "Joined Date"}</span>
              <div className="font-semibold text-foreground font-mono"><bdi dir="ltr">{tzFormatDate(coach.joinedAt)}</bdi></div>
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang === "ar" ? "إجمالي الأعضاء" : "Total Members"}</span>
              <div className="font-semibold text-foreground font-mono"><bdi dir="ltr">{activeInCycle} active / {members.length} total</bdi></div>
            </div>
          </div>

          {/* Billing Cycle Progress Bar */}
          <section className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-wide">{lang === "ar" ? "نسبة استهلاك الدورة المالية" : "Billing Cycle progress"}</span>
              <span><bdi>{cyclePct}%</bdi></span>
            </div>
            <Progress value={cyclePct} className="mt-3 h-3" />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{lang === "ar" ? "البداية" : "Start"} · {tzFormatDate(cycle.start)}</span>
              <span>{lang === "ar" ? "النهاية" : "End"} · {tzFormatDate(cycle.end)}</span>
            </div>
          </section>

          {/* Management actions */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/20">
            <span className="text-xs text-muted-foreground">{lang === "ar" ? "إجراءات المدرب" : "Coach Management"}</span>
            <Button variant="outline" size="sm" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setArchiveOpen(true)}>
              <Archive className="size-3.5" /> {lang === "ar" ? "أرشفة المدرب" : "Archiver le coach"}
            </Button>
          </div>

          {/* Members list */}
          <div className="space-y-3">
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
                  {lang === "ar" ? "الكل" : "Tous les assignés"}
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
                        : `${coach.name} n'est pas prévu aujourd'hui. Ce jour est réservé à l'autre groupe ou c'est un jour de repos.`}
                    </CardContent>
                  </Card>
                ) : (
                  <AssignedMembersTable members={todayRoster} coach={coach} mode="today" />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border/40 bg-card/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <User2 className="size-4 text-primary shrink-0 mt-0.5" />
          {t("member.operationalView")}
        </div>
      </SheetContent>

      <AssignMemberDialog open={assignOpen} onClose={() => setAssignOpen(false)} coach={coach} />
      <ArchiveCoachDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        coach={coach}
        assignedMembers={members}
        replacementOptions={replacementOptions}
        onArchived={() => { setArchiveOpen(false); onClose(); }}
      />
    </Sheet>
  );
}

function ArchiveCoachDialog({
  open, onClose, coach, assignedMembers, replacementOptions, onArchived,
}: {
  open: boolean;
  onClose: () => void;
  coach: Coach;
  assignedMembers: Member[];
  replacementOptions: Coach[];
  onArchived: () => void;
}) {
  const { t, lang } = useI18n();
  const [replacement, setReplacement] = useState<string>("");
  const hasMembers = assignedMembers.length > 0;

  const submit = () => {
    if (hasMembers && !replacement) {
      toast.error(lang === "ar" ? "اختر مدرباً بديلاً" : "Choisissez un coach remplaçant");
      return;
    }
    if (hasMembers) {
      assignedMembers.forEach((m) => gymStore.assignCoach(m.id, replacement));
    }
    coachStore.archive(coach.id);
    toast.success(lang === "ar" ? `تمت أرشفة ${coach.name}` : `${coach.name} archivé`, {
      description: hasMembers
        ? (lang === "ar" ? `تم تحويل ${assignedMembers.length} عضو` : `Transfert de ${assignedMembers.length} membre(s)`)
        : undefined,
    });
    setReplacement("");
    onArchived();
  };

  return (
    <Dialog open={open} onOpenChange={(b) => !b && (setReplacement(""), onClose())}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            {lang === "ar" ? "أرشفة المدرب" : "Archiver le coach"}
          </DialogTitle>
          <DialogDescription>
            {hasMembers
              ? (lang === "ar"
                  ? `لدى هذا المدرب ${assignedMembers.length} عضو معيّن. اختر مدرباً بديلاً لتسليم هؤلاء الأعضاء.`
                  : `Ce coach a ${assignedMembers.length} membre(s) assigné(s). Veuillez sélectionner un coach remplaçant pour transférer ces membres.`)
              : (lang === "ar" ? "لا يوجد أعضاء معيّنون. سيتم الأرشفة مباشرة." : "Aucun membre assigné. L'archivage sera direct.")}
          </DialogDescription>
        </DialogHeader>

        {hasMembers && (
          <div className="space-y-2">
            <Label>{lang === "ar" ? "المدرب البديل" : "Coach remplaçant"}</Label>
            {replacementOptions.length === 0 ? (
              <div className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                {lang === "ar"
                  ? "لا يوجد مدرب نشط آخر بنفس الجمهور. أضف مدرباً أولاً."
                  : "Aucun autre coach actif pour ce public. Ajoutez-en un d'abord."}
              </div>
            ) : (
              <select
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
              >
                <option value="">{lang === "ar" ? "اختر مدرباً…" : "Sélectionnez un coach…"}</option>
                {replacementOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.specialty}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("action.cancel")}</Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={hasMembers && replacementOptions.length === 0}
          >
            <Archive className="size-3.5" /> {lang === "ar" ? "أرشفة وتسليم" : "Archiver et transférer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function buildReminder(member: Member, coach: Coach) {
  const first = member.name.split(" ")[0];
  return `سلام ${first}، تذكير سريع بأن حصتك مع الكوتش ${coach.name} ستكون اليوم على الساعة ${coach.startTime}. نراك هناك! 💪`;
}

function AssignedMembersTable({ members, coach, mode }: { members: Member[]; coach: Coach; mode: "all" | "today" }) {
  const { t, lang } = useI18n();
  const theme = audienceTheme[coach.audience];

  const copyAll = async () => {
    if (members.length === 0) return;
    const text = members.map((m) => m.phone).join(", ");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(lang === "ar" ? `تم نسخ ${members.length} رقم` : `${members.length} numéros copiés`, {
        description: lang === "ar" ? "ألصق الأرقام في قائمة رسائل واتساب الخاصة بك." : "Collez les numéros dans votre liste de diffusion WhatsApp.",
      });
    } catch {
      toast.error(lang === "ar" ? "لا يمكن الوصول للحافظة" : "Impossible d'accéder au presse-papiers");
    }
  };

  if (members.length === 0) {
    return (
      <Card className="glass rounded-xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {mode === "today"
            ? (lang === "ar" ? "لا يوجد أعضاء في قائمة اليوم." : "Aucun membre prévu pour aujourd'hui.")
            : (lang === "ar" ? "لا يوجد أعضاء معينون بعد. استخدم زر 'تعيين عضو موجود' بالأعلى." : "Aucun membre assigné. Utilisez 'Assigner un membre existant' ci-dessus.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {mode === "today" && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            {lang === "ar" ? "حصة اليوم على الساعة " : "Séance aujourd'hui à "} 
            <span className={cn("font-medium", theme.text)}>{coach.startTime}</span>
          </span>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={copyAll}>
            <Copy className="size-3" /> {lang === "ar" ? "نسخ جميع الأرقام" : "Copier les numéros"}
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
              
              // استبدل التعريف القديم بـ:
            const message = mode === "today"
              ? buildReminder(m, coach)
              : `سلام ${m.name.split(" ")[0]}، معك نادي PULSE — الكوتش ${coach.name} في انتظارك. نراك في الحصة القادمة 💪`;
              
              const href = buildWaLink(m.phone, message);
              
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {m.photoUrl ? (
                          <AvatarImage src={m.photoUrl} alt={m.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="text-[10px] bg-muted">
                          {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="text-sm font-medium flex items-center gap-1.5">{m.name}<InsuranceShield insuranceEnd={m.insuranceEnd} /></div>
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
                      onClick={() => toast.success(lang === "ar" ? "تم فتح واتساب" : "WhatsApp ouvert")}
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
    if (!chosen) { toast.error(lang === "ar" ? "اختر عضواً أولاً" : "Choisissez un membre d'abord"); return; }
    gymStore.assignCoach(chosen.id, coach.id);
    toast.success(lang === "ar" ? `تم تعيين ${chosen.name} للمدرب ${coach.name}` : `${chosen.name} assigné(e) à ${coach.name}`);
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
              : `Seuls les membres ${coach.audience === "men" ? "hommes" : "femmes"} actifs sont affichés — la séparation des sexes est appliquée.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t("table.member")}</Label>
          <Popover open={popOpen} onOpenChange={setPopOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between bg-background/50">
                {chosen ? (
                  <span className="flex items-center gap-2">
                    <Avatar className="size-5">
                      {chosen.photoUrl ? (
                        <AvatarImage src={chosen.photoUrl} alt={chosen.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="text-[9px] bg-muted">{chosen.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
                    </Avatar>
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
                  <CommandEmpty>{lang === "ar" ? "لا يوجد أعضاء متاحين." : "Aucun membre éligible."}</CommandEmpty>
                  <CommandGroup>
                    {eligible.map((m) => (
                      <CommandItem
                        key={m.id}
                        value={`${m.name} ${m.cin} ${m.id}`}
                        onSelect={() => { setSelected(m.id); setPopOpen(false); }}
                        className="gap-2"
                      >
                        <Avatar className="size-6">
                          {m.photoUrl ? (
                            <AvatarImage src={m.photoUrl} alt={m.name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="text-[10px] bg-muted">{m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback>
                        </Avatar>
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
            {eligible.length} {lang === "ar" ? "عضو متاح للتعيين" : `membre(s) éligible(s)`}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("action.cancel")}</Button>
          <Button onClick={submit} disabled={!chosen}>{lang === "ar" ? "تعيين للمدرب" : "Assigner au coach"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}