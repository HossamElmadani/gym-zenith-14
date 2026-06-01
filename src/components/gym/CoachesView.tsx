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
import { CalendarDays, Dumbbell, Plus, Sparkles, User2, Users2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCoaches, coachStore, type Coach, type CoachAudience } from "@/lib/coaches-data";
import { MEMBERS, todayGender, daysRemaining, subStatus } from "@/lib/gym-data";
import { useGymStore } from "@/lib/gym-store";
import { WhatsAppButton } from "./WhatsAppButton";

const audienceTheme = {
  men:   { ring: "ring-blue-500/40", border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-300", chip: "bg-blue-500/15 text-blue-300 border-blue-500/30", dot: "bg-blue-500", label: "Men Only" },
  women: { ring: "ring-rose-500/40", border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-300", chip: "bg-rose-500/15 text-rose-300 border-rose-500/30", dot: "bg-rose-500", label: "Women Only" },
} as const;

export function CoachesView() {
  const coaches = useCoaches();
  // force re-render when members change (assignments)
  useGymStore((s) => s.v);

  const todayMode = todayGender(new Date());
  const defaultTab: CoachAudience = todayMode === "women" ? "women" : "men";
  const [tab, setTab] = useState<CoachAudience>(defaultTab);
  const [openCoach, setOpenCoach] = useState<Coach | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => coaches.filter((c) => c.audience === tab), [coaches, tab]);

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as CoachAudience)} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="glass border border-border/60 bg-card/40 p-1 h-auto">
            <TabsTrigger value="men" className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-200">
              <span className="size-2 rounded-full bg-blue-500" /> Men's Coaches
              <Badge variant="secondary" className="bg-blue-500/15 text-blue-200 border-blue-500/30 ml-1">
                {coaches.filter((c) => c.audience === "men").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="women" className="gap-2 data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-200">
              <span className="size-2 rounded-full bg-rose-500" /> Women's Coaches
              <Badge variant="secondary" className="bg-rose-500/15 text-rose-200 border-rose-500/30 ml-1">
                {coaches.filter((c) => c.audience === "women").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {todayMode !== "mixed" && (
              <Badge variant="secondary" className="bg-accent/40 text-muted-foreground border-border/60">
                <Sparkles className="size-3 mr-1" /> Auto-opened today's group
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
    </>
  );
}

function CoachGrid({ coaches, onSelect }: { coaches: Coach[]; onSelect: (c: Coach) => void }) {
  if (coaches.length === 0) {
    return (
      <Card className="glass rounded-2xl">
        <CardContent className="py-14 text-center text-muted-foreground text-sm">
          No coaches yet. Use <span className="text-foreground font-medium">+ Add Coach</span> to create one.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {coaches.map((c) => {
        const t = audienceTheme[c.audience];
        const assignedCount = MEMBERS.filter((m) => m.coachId === c.id).length;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              "glass rounded-2xl text-left p-4 border transition-all hover:-translate-y-0.5 hover:shadow-lg",
              t.border, "hover:" + t.ring,
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("size-12 rounded-xl grid place-items-center ring-1", t.bg, t.ring)}>
                <Dumbbell className={cn("size-5", t.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold tracking-tight truncate">{c.name}</div>
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.specialty}</div>
              </div>
              <Badge variant="outline" className={cn("text-[10px] border", t.chip)}>{t.label}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5" /> {c.schedule}
              </span>
            </div>
            <div className={cn("mt-3 flex items-center justify-between rounded-lg px-2.5 py-1.5", t.bg)}>
              <span className="text-[11px] text-muted-foreground">Assigned members</span>
              <span className={cn("text-sm font-semibold flex items-center gap-1.5", t.text)}>
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
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [schedule, setSchedule] = useState("");
  const [audience, setAudience] = useState<CoachAudience>(defaultAudience);

  const reset = () => { setName(""); setSpecialty(""); setSchedule(""); setAudience(defaultAudience); };

  const submit = () => {
    if (!name.trim() || !specialty.trim()) {
      toast.error("Coach name and specialty are required");
      return;
    }
    const c = coachStore.add({
      name: name.trim(),
      specialty: specialty.trim(),
      schedule: schedule.trim() || "Schedule TBD",
      audience,
    });
    toast.success(`Coach added · ${c.name}`, {
      description: `${audience === "men" ? "Men Only" : "Women Only"} · ${c.specialty}`,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { setOpen(b); if (!b) reset(); else setAudience(defaultAudience); }}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Plus className="size-4" /> Add Coach</Button>
      </DialogTrigger>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a coach</DialogTitle>
          <DialogDescription>Coaches are permanently tied to one audience to enforce gender isolation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Coach name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salma Idrissi" className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label>Specialty</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Aerobics, Bodybuilding" className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label>Weekly schedule</Label>
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Mon · Wed · Fri · 18:00-21:00" className="bg-background/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Target audience</Label>
            <RadioGroup value={audience} onValueChange={(v) => setAudience(v as CoachAudience)} className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                  audience === "men" ? "border-blue-500/60 bg-blue-500/10" : "border-border/60 hover:bg-accent/40",
                )}
              >
                <RadioGroupItem value="men" className="border-blue-500 text-blue-500" />
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Men Only</span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                  audience === "women" ? "border-rose-500/60 bg-rose-500/10" : "border-border/60 hover:bg-accent/40",
                )}
              >
                <RadioGroupItem value="women" className="border-rose-500 text-rose-500" />
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="text-sm font-medium">Women Only</span>
              </label>
            </RadioGroup>
            <p className="text-[11px] text-muted-foreground">Once set, this cannot be changed — it gates which members can be assigned.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add coach</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoachDetailSheet({ coach, onClose }: { coach: Coach | null; onClose: () => void }) {
  useGymStore((s) => s.v);
  if (!coach) return null;
  const t = audienceTheme[coach.audience];
  const members = MEMBERS.filter((m) => m.coachId === coach.id);

  return (
    <Sheet open={!!coach} onOpenChange={(b) => !b && onClose()}>
      <SheetContent className="glass border-border/60 w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={cn("size-14 rounded-2xl grid place-items-center ring-1", t.bg, t.ring)}>
              <Dumbbell className={cn("size-6", t.text)} />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{coach.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-0.5">
                <span>{coach.specialty}</span>
                <span className="text-border">·</span>
                <Badge variant="outline" className={cn("text-[10px] border", t.chip)}>{t.label}</Badge>
              </SheetDescription>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex items-center gap-2 text-sm">
            <CalendarDays className={cn("size-4", t.text)} />
            <span className="text-muted-foreground">Schedule:</span>
            <span className="font-medium">{coach.schedule}</span>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users2 className="size-4 text-primary" /> Assigned members
            </h3>
            <Badge variant="secondary" className="bg-accent/40">{members.length}</Badge>
          </div>

          {members.length === 0 ? (
            <Card className="glass rounded-xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No members assigned yet. Pick this coach during onboarding.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50">
                    <TableHead>Member</TableHead>
                    <TableHead>Days left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const d = daysRemaining(m.subEnd);
                    const status = subStatus(m.subEnd);
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
                        <TableCell className="text-sm font-medium">{d}d</TableCell>
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
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <WhatsAppButton member={m} tone={status === "expiring" || status === "expired" ? "renew" : "welcome"} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border/40 bg-card/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <User2 className="size-4 text-primary shrink-0 mt-0.5" />
          Operational view only — no financial data. Use the Members tab to renew or freeze.
        </div>
      </SheetContent>
    </Sheet>
  );
}
