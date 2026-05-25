import { useMemo, useRef, useState } from "react";
import { format, addMonths, addYears } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalendarIcon, CheckCircle2, Info, Loader2, MessageCircle,
  ShieldCheck, Sparkles, Upload, User2, X,
} from "lucide-react";
import { MEMBERS } from "@/lib/gym-data";

type Plan = "1m" | "3m" | "6m" | "1y";
type Goal = "Hypertrophy" | "Weight Loss" | "Strength" | "Mobility" | "Endurance";
type CinStatus = "idle" | "checking" | "ok" | "duplicate";

const PLANS: { value: Plan; label: string; months: number; price: string }[] = [
  { value: "1m", label: "1 Month",  months: 1,  price: "$49" },
  { value: "3m", label: "3 Months", months: 3,  price: "$129" },
  { value: "6m", label: "6 Months", months: 6,  price: "$229" },
  { value: "1y", label: "1 Year",   months: 12, price: "$399" },
];

const GOALS: Goal[] = ["Hypertrophy", "Weight Loss", "Strength", "Mobility", "Endurance"];

// Simulated existing CINs
const KNOWN_CINS = new Set(["AB123456", "CD789012", "EF345678"]);

export function OnboardingView() {
  const [name, setName] = useState("");
  const [cin, setCin] = useState("");
  const [cinStatus, setCinStatus] = useState<CinStatus>("idle");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [plan, setPlan] = useState<Plan>("3m");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<Goal[]>(["Hypertrophy"]);

  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<null | {
    name: string; phone: string; plan: string; gender: "male" | "female";
  }>(null);

  const endDate = useMemo(() => {
    const months = PLANS.find((p) => p.value === plan)?.months ?? 1;
    return months === 12 ? addYears(startDate, 1) : addMonths(startDate, months);
  }, [plan, startDate]);

  const scheduleHelper =
    gender === "male"
      ? "Access schedule: Mon · Wed · Fri (Men's days)"
      : gender === "female"
      ? "Access schedule: Tue · Thu · Sat (Women's days)"
      : "Selecting a gender assigns the weekly access schedule.";

  const handleCinBlur = () => {
    const value = cin.trim().toUpperCase();
    if (!value) return setCinStatus("idle");
    setCinStatus("checking");
    setTimeout(() => {
      const dup =
        KNOWN_CINS.has(value) ||
        MEMBERS.some((m) => m.id.toUpperCase() === value);
      setCinStatus(dup ? "duplicate" : "ok");
    }, 900);
  };

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files are accepted");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const toggleGoal = (g: Goal) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const canSubmit =
    name.trim().length > 1 &&
    cin.trim().length > 3 &&
    cinStatus !== "duplicate" &&
    cinStatus !== "checking" &&
    phone.trim().length >= 6 &&
    (gender === "male" || gender === "female");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !gender) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const planLabel = PLANS.find((p) => p.value === plan)!.label;
      setRegistered({ name: name.trim(), phone: phone.trim(), plan: planLabel, gender });
      toast.success("Member registered", {
        description: `${name} · ${planLabel} · ends ${format(endDate, "PP")}`,
      });
    }, 1100);
  };

  const resetForm = () => {
    setName(""); setCin(""); setCinStatus("idle"); setPhone("");
    setGender(""); setAvatar(null); setPlan("3m"); setStartDate(new Date());
    setGoals(["Hypertrophy"]); setRegistered(null);
  };

  const waMessage = registered
    ? `Hi ${registered.name}! Welcome to Pulse Gym. Your ${registered.plan} plan is active. Your access days: ${registered.gender === "male" ? "Mon/Wed/Fri" : "Tue/Thu/Sat"}. See you soon!`
    : "";
  const waHref = registered
    ? `https://wa.me/${registered.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(waMessage)}`
    : "#";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Identity */}
      <Card className="glass rounded-2xl xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="size-4 text-primary" /> Member Identity
          </CardTitle>
          <CardDescription>Core personal details and access classification.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sofia Martin" className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cin" className="flex items-center justify-between">
              <span>CIN / National ID</span>
              {cinStatus === "checking" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" /> checking…
                </span>
              )}
              {cinStatus === "ok" && (
                <span className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> available
                </span>
              )}
              {cinStatus === "duplicate" && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <X className="size-3" /> already registered
                </span>
              )}
            </Label>
            <Input id="cin" value={cin}
              onChange={(e) => { setCin(e.target.value); setCinStatus("idle"); }}
              onBlur={handleCinBlur}
              placeholder="AB123456" className={cn("bg-background/50 uppercase",
                cinStatus === "duplicate" && "border-destructive/60",
                cinStatus === "ok" && "border-success/60",
              )} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100" className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={gender || undefined} onValueChange={(v) => setGender(v as "male" | "female")}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <p className={cn(
              "text-xs flex items-start gap-1.5 mt-1",
              gender ? "text-foreground/80" : "text-muted-foreground",
            )}>
              <Info className="size-3.5 mt-0.5 shrink-0 text-primary" />
              {scheduleHelper}
            </p>
          </div>

          {/* Avatar dropzone */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Profile picture</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex items-center gap-4 rounded-xl border border-dashed p-4 cursor-pointer transition-all",
                "border-border/70 hover:border-primary/60 hover:bg-accent/30",
                dragOver && "border-primary bg-primary/10",
              )}
            >
              <Avatar className="size-16 ring-2 ring-border">
                {avatar ? <AvatarImage src={avatar} alt="preview" /> : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User2 className="size-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Upload className="size-4 text-primary" /> Drop image or click to upload
                </div>
                <div className="text-xs text-muted-foreground">PNG · JPG · up to 5MB</div>
              </div>
              {avatar && (
                <Button type="button" size="sm" variant="ghost"
                  onClick={(e) => { e.stopPropagation(); setAvatar(null); }}>
                  Remove
                </Button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onFiles(e.target.files)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="glass rounded-2xl xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Subscription
          </CardTitle>
          <CardDescription>End date is auto-calculated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
              <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLANS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center justify-between gap-6 w-full">
                      <span>{p.label}</span>
                      <span className="text-muted-foreground text-xs">{p.price}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline"
                  className={cn("w-full justify-start font-normal bg-background/50",
                    !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 size-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>End date</Label>
            <div className="rounded-md border border-input bg-muted/40 px-3 h-9 flex items-center justify-between">
              <span className="text-sm">{format(endDate, "PPP")}</span>
              <Badge variant="secondary" className="bg-accent text-foreground text-[10px]">auto</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card className="glass rounded-2xl xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> Quick goals
          </CardTitle>
          <CardDescription>Used to personalize coaching feed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => {
              const active = goals.includes(g);
              return (
                <button type="button" key={g} onClick={() => toggleGoal(g)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50",
                  )}>
                  {g}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit / Post-action */}
      <Card className="glass rounded-2xl xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">
            {registered ? "Member created" : "Finalize"}
          </CardTitle>
          <CardDescription>
            {registered ? "Send a warm welcome." : "Review and register the member."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!registered ? (
            <Button type="submit" disabled={!canSubmit || submitting}
              className="w-full glow-primary">
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" /> Registering…</>
              ) : (
                <>Register Member</>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-success/30 bg-success/10 p-3 flex items-start gap-2">
                <CheckCircle2 className="size-4 text-success mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">{registered.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {registered.plan} · ends {format(endDate, "PP")}
                  </div>
                </div>
              </div>
              <Button asChild className="w-full bg-success text-primary-foreground hover:bg-success/90">
                <a href={waHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Send WhatsApp Welcome
                </a>
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                Register another
              </Button>
            </div>
          )}
          {!registered && !canSubmit && (
            <p className="text-xs text-muted-foreground">
              Complete required fields and resolve duplicates to enable submission.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
