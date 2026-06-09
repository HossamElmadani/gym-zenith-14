import { useMemo, useRef, useState } from "react";
import { arMA, enUS } from "date-fns/locale"; // arMA هي العربية الخاصة بالمغرب
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon, CheckCircle2, Dumbbell, Info, Loader2, MessageCircle,
  Printer, Shield, ShieldCheck, Upload, User2, Wallet, X, Sparkles,
} from "lucide-react";
import {
  MEMBERS, getPlanOptions, PLAN_PRICES, type PlanCode
} from "@/lib/gym-data";
import { useCoaches } from "@/lib/coaches-data";
import { tzAddMonthsISO, tzFormatDate, tzTodayISO } from "@/lib/gym-tz";
import { gymStore } from "@/lib/gym-store";
import { MemberQR } from "./MemberQR";
import { ReceiptDialog, type ReceiptPayload } from "./ReceiptDialog";
import { useI18n } from "@/lib/i18n";

type CinStatus = "idle" | "checking" | "ok" | "duplicate";

export function OnboardingView() {
  const { t, lang } = useI18n();
  const PLAN_OPTIONS = useMemo(() => getPlanOptions(), [lang]);
  const [name, setName] = useState("");
  const [cin, setCin] = useState("");
  const [cinStatus, setCinStatus] = useState<CinStatus>("idle");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [plan, setPlan] = useState<PlanCode>("3M");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [cashAmount, setCashAmount] = useState<string>(String(PLAN_PRICES["3M"]));
  const [insurance, setInsurance] = useState<boolean>(false);
  const [coachId, setCoachId] = useState<string>("none");
  const coaches = useCoaches();
  const eligibleCoaches = useMemo(
    () => (gender ? coaches.filter((c) => (gender === "male" ? c.audience === "men" : c.audience === "women")) : []),
    [coaches, gender],
  );

  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<null | {
    id: string; name: string; cin: string; phone: string; planCode: PlanCode;
    amount: number; startDate: string; endDate: string; gender: "male" | "female";
  }>(null);
  const [receipt, setReceipt] = useState<ReceiptPayload | null>(null);

  const endDate = useMemo(
    () => tzAddMonthsISO(tzTodayISO(startDate), PLAN_OPTIONS.find((p) => p.code === plan)!.months),
    [plan, startDate],
  );

  const scheduleHelper =
    gender === "male"
      ? (lang === "ar" ? "أوقات الدخول: الإثنين · الأربعاء · الجمعة (أيام الرجال)" : "Access schedule: Mon · Wed · Fri (Men's days)")
      : gender === "female"
      ? (lang === "ar" ? "أوقات الدخول: الثلاثاء · الخميس · السبت (أيام النساء)" : "Access schedule: Tue · Thu · Sat (Women's days)")
      : t("onboard.genderHelper");

  const handleCinBlur = () => {
    const value = cin.trim().toUpperCase();
    if (!value) return setCinStatus("idle");
    setCinStatus("checking");
    setTimeout(() => {
      const dup = MEMBERS.some((m) => m.cin.toUpperCase() === value || m.id.toUpperCase() === value);
      setCinStatus(dup ? "duplicate" : "ok");
    }, 700);
  };

  const onPlanChange = (p: PlanCode) => {
    setPlan(p);
    setCashAmount(String(PLAN_PRICES[p] + (insurance ? 100 : 0)));
  };

  const onInsuranceToggle = (next: boolean) => {
    setInsurance(next);
    const cur = parseFloat(cashAmount) || 0;
    setCashAmount(String(Math.max(0, cur + (next ? 100 : -100))));
  };


  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error(lang === "ar" ? "ملفات الصور فقط" : "Only image files");
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const cashNumber = parseFloat(cashAmount);
  
  // شرط ذكي: إذا كان اشتراك يوم واحد، نحتاج فقط للجنس والمبلغ!
  const canSubmit = plan === "1D" 
    ? (gender === "male" || gender === "female") && cashNumber > 0
    : name.trim().length > 1 &&
      cin.trim().length > 3 &&
      cinStatus !== "duplicate" &&
      cinStatus !== "checking" &&
      phone.trim().length >= 6 &&
      (gender === "male" || gender === "female") &&
      cashNumber > 0;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !gender) return;
    setSubmitting(true);
    
    setTimeout(() => {
      const start = tzTodayISO(startDate);
      const months = PLAN_OPTIONS.find((p) => p.code === plan)?.months || 0;
      const prefix = gender === "male" ? "M" : "F";
      const next = String(
        Math.max(0, ...MEMBERS.filter((m) => m.id.startsWith(prefix + "-")).map((m) => parseInt(m.id.split("-")[1], 10) || 0)) + 1,
      ).padStart(4, "0");
      const id = `${prefix}-${next}`;
      
      // التوليد التلقائي لزوار الحصة الواحدة إذا كانت الحقول فارغة
      const finalName = name.trim() || (lang === "ar" ? `زائر عابر #${next}` : `Walk-in Guest #${next}`);
      const finalCin = cin.trim().toUpperCase() || "PASS";
      const finalPhone = phone.trim() || "0000000000";

      const added = gymStore.addMember({
        id,
        name: finalName,
        cin: finalCin,
        phone: finalPhone,
        gender,
        plan,
        subStart: start,
        subEnd: endDate,
        subMonths: months,
        history: [{ date: start, plan, months, amount: cashNumber }],
        coachId: coachId === "none" ? null : coachId,
      });
      
      gymStore.logCash({
        amount: cashNumber, kind: "registration", planCode: plan,
        memberId: added.id, memberName: added.name,
        note: `Registration · ${plan}`,
      });
      
      setSubmitting(false);
      setRegistered({
        id: added.id, name: added.name, cin: added.cin, phone: added.phone,
        planCode: plan, amount: cashNumber, startDate: start, endDate, gender,
      });
      
      toast.success(lang === "ar" ? "تم التسجيل بنجاح" : "Registered successfully", {
        description: `${added.name} · ${added.id} · ${lang === "ar" ? "دفع" : "paid"} ${cashNumber} ${t("common.currency")}`,
      });
    }, 600);
  };

  const resetForm = () => {
    setName(""); setCin(""); setCinStatus("idle"); setPhone("");
    setGender(""); setAvatar(null); setPlan("3M");
    setStartDate(new Date()); setCashAmount(String(PLAN_PRICES["3M"]));
    setCoachId("none");
    setRegistered(null);
  };

  const openReceipt = () => {
    if (!registered) return;
    setReceipt({
      kind: "registration",
      member: { id: registered.id, cin: registered.cin, name: registered.name, phone: registered.phone },
      planCode: registered.planCode,
      amount: registered.amount,
      startDate: registered.startDate,
      endDate: registered.endDate,
    });
  };

  const waMessage = registered
    ? (lang === "ar" 
        ? `مرحباً ${registered.name}! أهلاً بك في PULSE Gym. اشتراكك (${PLAN_OPTIONS.find((p) => p.code === registered.planCode)!.label}) فعّال حتى ${tzFormatDate(registered.endDate)}. أيام الدخول: ${registered.gender === "male" ? "الإثنين/الأربعاء/الجمعة" : "الثلاثاء/الخميس/السبت"}.`
        : `Hi ${registered.name}! Welcome to PULSE Gym. Your ${PLAN_OPTIONS.find((p) => p.code === registered.planCode)!.label} access is active until ${tzFormatDate(registered.endDate)}. Days: ${registered.gender === "male" ? "Mon/Wed/Fri" : "Tue/Thu/Sat"}.`)
    : "";
  const waHref = registered
    ? `https://wa.me/${registered.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(waMessage)}`
    : "#";

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Identity */}
        <Card className="glass rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="size-4 text-primary" /> {t("onboard.identity")}
            </CardTitle>
            <CardDescription>{t("onboard.identitySub")}</CardDescription>
            <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="size-4 text-primary" /> {t("onboard.identity")}
            </CardTitle>
            <CardDescription>{t("onboard.identitySub")}</CardDescription>
            
            {/* التنبيه الذكي يظهر فقط لاشتراك 1D */}
            {plan === "1D" && (
              <div className="mt-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-300 flex items-center gap-2">
                <Sparkles className="size-4 shrink-0" />
                <span>
                  {lang === "ar" 
                    ? "أنت في وضع الحصة الواحدة: يمكنك ترك الاسم والهاتف والبطاقة فارغة، سيقوم النظام بتوليد زائر تلقائياً. اختر الجنس فقط." 
                    : "Day Pass Mode: Name, phone, and CIN are optional. System will auto-generate them. Just pick a gender."}
                </span>
              </div>
            )}
          </CardHeader>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("form.fullName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("onboard.namePlaceholder")} className="bg-background/50" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cin" className="flex items-center justify-between">
                <span>{t("form.cin")}</span>
                {cinStatus === "checking" && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> {lang === "ar" ? "جاري التحقق…" : "checking..."}</span>}
                {cinStatus === "ok" && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="size-3" /> {lang === "ar" ? "متاح" : "available"}</span>}
                {cinStatus === "duplicate" && <span className="text-xs text-destructive flex items-center gap-1"><X className="size-3" /> {lang === "ar" ? "مسجل مسبقاً" : "already registered"}</span>}
              </Label>
              <Input id="cin" value={cin}
                onChange={(e) => { setCin(e.target.value); setCinStatus("idle"); }}
                onBlur={handleCinBlur}
                placeholder="AB123456"
                className={cn("bg-background/50 uppercase",
                  cinStatus === "duplicate" && "border-destructive/60",
                  cinStatus === "ok" && "border-success/60")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("form.phone")}</Label>
              <Input id="phone" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 600 000 000" className="bg-background/50" />
            </div>

            <div className="space-y-1.5">
              <Label>{t("form.gender")}</Label>
              <Select value={gender || undefined} onValueChange={(v) => { setGender(v as "male" | "female"); setCoachId("none"); }}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder={t("form.selectGender")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("gender.male")}</SelectItem>
                  <SelectItem value="female">{t("gender.female")}</SelectItem>
                </SelectContent>
              </Select>
              <p className={cn("text-xs flex items-start gap-1.5 mt-1", gender ? "text-foreground/80" : "text-muted-foreground")}>
                <Info className="size-3.5 mt-0.5 shrink-0 text-primary" />
                {scheduleHelper}
              </p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Dumbbell className="size-3.5 text-primary" /> {t("form.assignCoach")}
              </Label>
              <Select
                value={coachId}
                onValueChange={setCoachId}
                disabled={!gender}
              >
                <SelectTrigger className={cn(
                  "bg-background/50",
                  gender === "male" && "border-blue-500/40",
                  gender === "female" && "border-rose-500/40",
                )}>
                  <SelectValue placeholder={gender ? t("form.selectCoach") : t("form.pickGenderFirst")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("form.none")}</SelectItem>
                  {eligibleCoaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", c.audience === "men" ? "bg-blue-500" : "bg-rose-500")} />
                        {c.name} <span className="text-muted-foreground text-xs">· {c.specialty}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3 text-primary" />
                {gender
                  ? (lang === "ar" 
                      ? `يتم عرض مدربي ${gender === "male" ? "الرجال" : "النساء"} فقط — تم تطبيق العزل التام.` 
                      : `Only ${gender === "male" ? "Men Only" : "Women Only"} coaches are shown — gender isolation enforced.`)
                  : t("onboard.coachHelper")}
              </p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label>{t("onboard.picture")}</Label>
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
                  <div className="text-sm font-medium flex items-center gap-2"><Upload className="size-4 text-primary" /> {t("onboard.upload")}</div>
                  <div className="text-xs text-muted-foreground"><bdi>{t("onboard.uploadSub")}</bdi></div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription + Cash */}
        <Card className="glass rounded-2xl xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" /> {t("onboard.planCash")}
            </CardTitle>
            <CardDescription>{t("onboard.planCashSub")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("form.plan")}</Label>
              <Select value={plan} onValueChange={(v) => onPlanChange(v as PlanCode)}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      <span className="flex items-center justify-between gap-6 w-full">
                        <span>{p.label}</span>
                        <span className="text-muted-foreground text-xs"><bdi>{p.price} {t("common.currency")}</bdi></span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("form.startDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal bg-background/50">
                    <CalendarIcon className="mr-2 size-4" />
                    {tzFormatDate(tzTodayISO(startDate))}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={lang === "ar" ? arMA : enUS} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label>{t("form.endDate")}</Label>
              <div className="rounded-md border border-input bg-muted/40 px-3 h-9 flex items-center justify-between">
                <span className="text-sm">{tzFormatDate(endDate)}</span>
                <Badge variant="secondary" className="bg-accent text-foreground text-[10px]">auto</Badge>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label className="flex items-center gap-1.5">
                <Wallet className="size-3.5 text-success" />
                {t("form.cashAmount")}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder={String(PLAN_PRICES[plan])}
                className="bg-background/50 text-xl font-semibold text-success"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("onboard.cashRequired")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit / Post-action */}
        <Card className="glass rounded-2xl xl:col-span-3">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            {!registered ? (
              <>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium">{t("onboard.ready")}</div>
                  <p className="text-xs text-muted-foreground">
                    {t("onboard.readySub")}
                  </p>
                </div>
                <Button type="submit" disabled={!canSubmit || submitting} className="min-w-[200px]">
                  {submitting ? (
                    <><Loader2 className="size-4 animate-spin" /> {t("onboard.registering")}</>
                  ) : (
                    <><Wallet className="size-4" /> {t("action.register")} {lang === "ar" ? "واستلام" : "& take"} <bdi>{cashNumber || 0} {t("common.currency")}</bdi></>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                  <CheckCircle2 className="size-6 text-success" />
                  <div>
                    <div className="text-sm font-medium">{registered.name} · {registered.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {lang === "ar" ? "تم الدفع" : "Paid"} <bdi>{registered.amount} {t("common.currency")}</bdi> · {lang === "ar" ? "ينتهي" : "ends"} <bdi dir="ltr">{tzFormatDate(registered.endDate)}</bdi>
                    </div>
                  </div>
                </div>
                <MemberQR member={registered} size={72} withCaption={false} />
                <Button type="button" onClick={openReceipt} className="bg-success text-black hover:bg-success/90">
                  <Printer className="size-4" /> {lang === "ar" ? "طباعة الإيصال" : "Print receipt"}
                </Button>
                <Button asChild type="button" variant="secondary">
                  <a href={waHref} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> {lang === "ar" ? "رسالة واتساب" : "WhatsApp welcome"}</a>
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {lang === "ar" ? "تسجيل عضو آخر" : "Register another"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </form>

      <ReceiptDialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} payload={receipt} />
    </>
  );
}