import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw, Search,
  History as HistoryIcon, Snowflake, QrCode, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MEMBERS, daysRemaining, subStatus, subUsedPct, PLAN_OPTIONS, type Member,
} from "@/lib/gym-data";
import { coachStore } from "@/lib/coaches-data";
import { tzFormatDate, tzTodayISO } from "@/lib/gym-tz";
import { WhatsAppButton } from "./WhatsAppButton";
import { FreezeDialog } from "./FreezeDialog";
import { RenewDialog } from "./RenewDialog";
import { MemberQR } from "./MemberQR";
import { MemberEditModal } from "./MemberEditModal";
import { gymStore, isFrozenToday, useGymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";
import { InsuranceShield } from "./InsuranceShield";

const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");

function statusMeta(s: ReturnType<typeof subStatus> | "frozen", t: (k: import("@/lib/i18n").DictKey) => string) {
  if (s === "pending")   return { label: t("admin.status.pending"), cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
  if (s === "active")    return { label: t("status.active"),   cls: "bg-success/15 text-success border-success/30" };
  if (s === "expiring")  return { label: t("status.expiring"), cls: "bg-warning/15 text-warning border-warning/30" };
  if (s === "frozen")    return { label: t("status.frozen"),   cls: "bg-sky-500/15 text-sky-300 border-sky-500/40" };
  return                 { label: t("status.expired"),  cls: "bg-destructive/15 text-destructive border-destructive/30" };
}

export function MembersDirectory() {
  const { t, lang } = useI18n();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired" | "frozen" | "pending">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [freezeFor, setFreezeFor] = useState<Member | null>(null);
  const [renewFor, setRenewFor] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const version = useGymStore((s) => s.v);

  const effectiveStatus = (m: Member): "pending" | "active" | "expiring" | "expired" | "frozen" =>
    isFrozenToday(m.id) ? "frozen" : subStatus(m.subEnd, m.subStart);

  const expiringSoon = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (isFrozenToday(m.id)) return false;
        const d = daysRemaining(m.subEnd);
        return d > 0 && d <= 7;
      }).sort((a, b) => daysRemaining(a.subEnd) - daysRemaining(b.subEnd)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const rows = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (genderFilter !== "all" && m.gender !== genderFilter) return false;
      if (statusFilter !== "all" && effectiveStatus(m) !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.cin.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, genderFilter, query, version]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Expiring widget */}
        <Card className="glass rounded-2xl border-warning/40 bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" /> {t("admin.expiringSoon")}
            </CardTitle>
            <Badge className="bg-warning/20 text-warning border border-warning/40">
              <bdi>{expiringSoon.length}</bdi>
            </Badge>
          </CardHeader>
          <CardContent>
            {expiringSoon.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center"><bdi>{t("admin.noRenewals")}</bdi> 🎉</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {expiringSoon.map((m) => {
                  const d = daysRemaining(m.subEnd);
                  const planLabel = PLAN_OPTIONS.find((p) => p.code === m.plan)?.label;
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-warning/30 bg-card/40 px-3 py-2.5">
                      <Avatar className="size-9">
                        {m.photoUrl ? (
                          <AvatarImage src={m.photoUrl} alt={m.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-warning/20 text-warning text-xs font-semibold">{initials(m.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5"><span className="truncate">{m.name}</span><InsuranceShield insuranceEnd={m.insuranceEnd} /></div>
                        <div className="text-xs text-muted-foreground"><bdi>{d} {t("common.days")}</bdi> · <bdi dir="ltr">{planLabel}</bdi></div>
                      </div>
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => setRenewFor(m)}>
                        <RefreshCw className="size-3.5" /> {t("action.renew")}
                      </Button>
                      <WhatsAppButton member={m} tone="renew" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Minimalist Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{t("nav.members")}</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[11px] px-2 py-0.5">
              {rows.length} {t("common.of")} {MEMBERS.length}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder={t("search.byNameCinId")} 
                className="ps-9 bg-background/25 border-border/40 focus-visible:ring-primary rounded-xl h-9 text-sm" 
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[140px] bg-background/25 border-border/40 rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="expiring">{t("status.expiring")}</SelectItem>
                <SelectItem value="expired">{t("status.expired")}</SelectItem>
                <SelectItem value="frozen">{t("status.frozen")}</SelectItem>
                <SelectItem value="pending">{t("admin.status.pending")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as typeof genderFilter)}>
              <SelectTrigger className="w-[130px] bg-background/25 border-border/40 rounded-xl h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="glass border-border/60">
                <SelectItem value="all">{t("filter.allGenders")}</SelectItem>
                <SelectItem value="male">{t("gender.men")}</SelectItem>
                <SelectItem value="female">{t("gender.women")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Members table */}
        <Card className="glass rounded-2xl overflow-hidden border-border/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead>{t("table.member")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("table.cin")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("table.gender")}</TableHead>
                  <TableHead>{t("table.daysLeft")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-end">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">{t("members.noMatch")}</TableCell></TableRow>
                )}
                {rows.map((m) => {
                  const eff = effectiveStatus(m);
                  const d = daysRemaining(m.subEnd);
                  const s = statusMeta(eff, t);
                  const isAtRisk = eff === "expiring" || eff === "expired";
                  const planLabel = PLAN_OPTIONS.find((p) => p.code === m.plan)?.label;
                  return (
                    <TableRow key={m.id} onClick={() => setSelected(m)} className="cursor-pointer border-border/40 hover:bg-accent/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            {m.photoUrl ? (
                              <AvatarImage src={m.photoUrl} alt={m.name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className={m.gender === "male" ? "bg-mens/20 text-mens text-xs font-semibold" : "bg-womens/20 text-womens text-xs font-semibold"}>
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate flex items-center gap-1.5"><span className="truncate">{m.name}</span><InsuranceShield insuranceEnd={m.insuranceEnd} /></div>
                            <div className="text-xs text-muted-foreground"><bdi dir="ltr">{m.id}</bdi> · <bdi dir="ltr">{planLabel}</bdi></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground font-mono"><bdi dir="ltr">{m.cin}</bdi></TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={m.gender === "male" ? "border-mens/40 text-mens bg-mens/10" : "border-womens/40 text-womens bg-womens/10"}>
                          {m.gender === "male" ? t("gender.male") : t("gender.female")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {eff === "frozen" ? <span className="text-sky-300">{t("status.paused")}</span>
                          : eff === "pending" ? <span className="text-amber-400 text-xs">
                              {t("members.startsOn")} {tzFormatDate(m.subStart, { day: "numeric", month: "long" })}
                            </span>
                          : d === 0 ? <span className="text-destructive">—</span>
                          : <bdi>{d} {t("common.days")}</bdi>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span className={cn("size-1.5 rounded-full shrink-0",
                            eff === "active" ? "bg-success"
                            : eff === "frozen" ? "bg-sky-400"
                            : eff === "pending" ? "bg-amber-400"
                            : eff === "expiring" ? "bg-warning"
                            : "bg-destructive"
                          )} />
                          <span className="text-foreground/90">{s.label}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg"
                                onClick={() => {
                                  setEditMember(m);
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="glass border-border/40 text-xs">
                              {t("edit.title")}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg"
                                onClick={() => setRenewFor(m)}
                              >
                                <RefreshCw className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="glass border-border/40 text-xs">
                              {t("action.renew")}
                            </TooltipContent>
                          </Tooltip>

                          {isAtRisk && <WhatsAppButton member={m} tone="renew" />}

                          {eff === "frozen" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg"
                                  onClick={() => {
                                    gymStore.unfreeze(m.id);
                                    toast.success(t("members.toast.unfrozen"));
                                  }}
                                >
                                  <Snowflake className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="glass border-border/40 text-xs">
                                {t("action.unfreeze")}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-muted-foreground hover:text-sky-300 hover:bg-sky-500/10 rounded-lg"
                                  onClick={() => setFreezeFor(m)}
                                >
                                  <Snowflake className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="glass border-border/40 text-xs">
                                {t("action.freeze")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MemberSheet
          member={selected}
          onClose={() => setSelected(null)}
          onFreeze={(m) => setFreezeFor(m)}
          onRenew={(m) => setRenewFor(m)}
          onEdit={(m) => {
            setEditMember(m);
            setEditOpen(true);
          }}
          frozen={selected ? isFrozenToday(selected.id) : null}
        />
        <FreezeDialog member={freezeFor} open={!!freezeFor} onOpenChange={(o) => !o && setFreezeFor(null)} />
        <RenewDialog member={renewFor} open={!!renewFor} onOpenChange={(o) => !o && setRenewFor(null)} />
        <MemberEditModal
          member={editMember}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={(updated) => {
            if (selected && selected.id === updated.id) {
              setSelected(updated);
            }
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function MemberSheet({ member, onClose, onFreeze, onRenew, onEdit, frozen }: {
  member: Member | null;
  onClose: () => void;
  onFreeze: (m: Member) => void;
  onRenew: (m: Member) => void;
  onEdit: (m: Member) => void;
  frozen: { from: string; to: string } | null;
}) {
  const { t, lang } = useI18n();
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!member) return null;

  const eff = frozen ? "frozen" : subStatus(member.subEnd, member.subStart);
  const statusRing = 
    eff === "active" ? "ring-4 ring-success/60 ring-offset-2 ring-offset-background"
    : eff === "frozen" ? "ring-4 ring-sky-500/60 ring-offset-2 ring-offset-background"
    : eff === "pending" ? "ring-4 ring-amber-500/60 ring-offset-2 ring-offset-background"
    : eff === "expiring" ? "ring-4 ring-warning/60 ring-offset-2 ring-offset-background"
    : "ring-4 ring-destructive/60 ring-offset-2 ring-offset-background";

  const coachName = member.coachId 
    ? (coachStore.get(member.coachId)?.name ?? member.coachId) 
    : t("members.noCoach");

  const today = tzTodayISO();
  const insuranceStatus = member.insuranceEnd
    ? (member.insuranceEnd >= today
      ? { label: `${t("members.validUntil")} ${tzFormatDate(member.insuranceEnd)}`, cls: "text-success font-semibold" }
      : { label: `${t("members.expiredOn")} ${tzFormatDate(member.insuranceEnd)}`, cls: "text-destructive font-semibold" })
    : { label: t("members.noInsurance"), cls: "text-muted-foreground" };

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-card/95 backdrop-blur-xl border-l border-border/60 w-full sm:max-w-md overflow-y-auto">
        {member && (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="relative">
                  <Avatar 
                    className={cn(
                      "size-32 border-2 border-border/30 transition-all",
                      member.photoUrl ? "cursor-pointer hover:scale-105 hover:opacity-90 active:scale-95" : "",
                      statusRing
                    )}
                    onClick={() => member.photoUrl && setZoomOpen(true)}
                  >
                    {member.photoUrl ? (
                      <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className={cn("text-2xl font-bold", member.gender === "male" ? "bg-mens/25 text-foreground" : "bg-womens/25 text-foreground")}>
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="absolute bottom-0 right-0 size-8 rounded-full bg-background/90 hover:bg-accent border-border/60 shadow-lg">
                        <QrCode className="size-4 text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-auto glass border-border/60" side="top">
                      <MemberQR member={member} size={150} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <SheetTitle className="text-xl font-bold tracking-tight">{member.name}</SheetTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(member)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                  <SheetDescription className="text-xs text-muted-foreground font-mono flex items-center justify-center gap-1.5">
                    <span>ID: {member.id}</span>
                    <span>·</span>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", statusMeta(eff, t).cls)}>
                      {statusMeta(eff, t).label}
                    </Badge>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
              <DialogContent className="max-w-md md:max-w-lg border-border/40 bg-card/90 backdrop-blur-xl p-1 overflow-hidden flex flex-col items-center justify-center">
                <DialogTitle className="sr-only">{member.name}</DialogTitle>
                <img 
                  src={member.photoUrl || ""} 
                  alt={member.name} 
                  className="max-h-[70vh] w-full object-contain rounded-lg"
                />
              </DialogContent>
            </Dialog>

            {frozen && (
              <div className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm flex items-center gap-2">
                <Snowflake className="size-4 text-sky-300" />
                 <span><span className="text-sky-300 font-medium">{t("members.frozen")}</span> · {frozen.from} → {frozen.to}</span>
              </div>
            )}

            <div className="mt-6 space-y-6">
              {/* Essential quick-stats grid */}
              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/40 bg-background/20 p-3 text-sm">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("edit.cin")}</span>
                  <div className="font-semibold font-mono">{member.cin || "—"}</div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("edit.phone")}</span>
                  <div className="font-semibold font-mono">{member.phone || "—"}</div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("edit.age")}</span>
                  <div className="font-semibold">{member.age ? `${member.age} ${t("edit.years")}` : "—"}</div>
                </div>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("edit.gender")}</span>
                  <div className="font-semibold">{member.gender === "male" ? t("gender.male") : t("gender.female")}</div>
                </div>
              </div>

              {/* Subscription & Coach Block */}
              <section className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">{t("members.subUsed")}</span>
                    <span><bdi>{eff === "pending" ? 0 : subUsedPct(member.subStart, member.subEnd)}%</bdi></span>
                  </div>
                  <Progress value={eff === "pending" ? 0 : subUsedPct(member.subStart, member.subEnd)} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>{t("members.start")} · {tzFormatDate(member.subStart)}</span>
                    <span>{t("members.end")} · {tzFormatDate(member.subEnd)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm pt-1 text-left">
                    <Clock className="size-4 text-primary" />
                    <span className="font-medium">
                      {eff === "pending" ? (
                        <span className="text-amber-400">
                          {t("members.pendingSub")}
                        </span>
                      ) : (
                        <bdi>{daysRemaining(member.subEnd)} {t("members.daysRemaining")}</bdi>
                      )}
                    </span>
                    <span className="text-muted-foreground">· {PLAN_OPTIONS.find((p) => p.code === member.plan)?.label}</span>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-3 grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 text-left">
                    <span className="text-muted-foreground block">{t("members.insuranceStatus")}</span>
                    <span className={insuranceStatus.cls}>{insuranceStatus.label}</span>
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-muted-foreground block">{t("members.assignedCoach")}</span>
                    <span className="font-semibold text-foreground">{coachName}</span>
                  </div>
                </div>
              </section>

              {/* Subscription history */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <HistoryIcon className="size-4 text-muted-foreground" /> {t("members.paymentHistory")}
                </div>
                <ul className="space-y-2">
                  {member.history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>{tzFormatDate(h.date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{PLAN_OPTIONS.find((p) => p.code === h.plan)?.label} · <bdi>{h.amount} {t("common.currency")}</bdi></span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Check-ins */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-muted-foreground" /> {t("members.recentCheckins")}
                </div>
                <ol className="relative border-s border-border/60 ps-4 space-y-3">
                  {member.recentCheckIns.length === 0 && (
                    <li className="text-xs text-muted-foreground">{t("members.noRecentCheckins")}</li>
                  )}
                  {member.recentCheckIns.map((c, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -start-[21px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                      <div className="text-sm">{tzFormatDate(c, { day: "2-digit", month: "short" })}</div>
                       <div className="text-xs text-muted-foreground">{i === 0 ? t("members.mostRecentVisit") : (lang === "ar" ? `الزيارة #${member.recentCheckIns.length - i}` : `Visite #${member.recentCheckIns.length - i}`)}</div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="grid grid-cols-2 gap-2 sticky bottom-0 bg-card/95 backdrop-blur pt-2">
                <Button onClick={() => onRenew(member)} className="gap-1.5 bg-success text-black hover:bg-success/90">
                  <RefreshCw className="size-4" /> {t("members.renewCash")}
                </Button>
                <Button variant="outline" onClick={() => onFreeze(member)} className="gap-1.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/10">
                  <Snowflake className="size-4" /> {t("action.freeze")}
                </Button>
                <div className="col-span-2">
                  <WhatsAppButton member={member} tone="renew" size="sm" label={t("members.whatsappMember")} className="w-full" />
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}