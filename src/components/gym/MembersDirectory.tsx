import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw, Search,
  History as HistoryIcon, Snowflake,
} from "lucide-react";
import { toast } from "sonner";
import {
  MEMBERS, daysRemaining, subStatus, subUsedPct, PLAN_LABEL, type Member,
} from "@/lib/gym-data";
import { tzFormatDate } from "@/lib/gym-tz";
import { WhatsAppButton } from "./WhatsAppButton";
import { FreezeDialog } from "./FreezeDialog";
import { RenewDialog } from "./RenewDialog";
import { MemberQR } from "./MemberQR";
import { gymStore, isFrozenToday, useGymStore } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";

const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");

function statusMeta(s: ReturnType<typeof subStatus> | "frozen", t: (k: import("@/lib/i18n").DictKey) => string) {
  if (s === "active")    return { label: t("status.active"),   cls: "bg-success/15 text-success border-success/30" };
  if (s === "expiring")  return { label: t("status.expiring"), cls: "bg-warning/15 text-warning border-warning/30" };
  if (s === "frozen")    return { label: t("status.frozen"),   cls: "bg-sky-500/15 text-sky-300 border-sky-500/40" };
  return                        { label: t("status.expired"),  cls: "bg-destructive/15 text-destructive border-destructive/30" };
}


export function MembersDirectory() {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired" | "frozen">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [freezeFor, setFreezeFor] = useState<Member | null>(null);
  const [renewFor, setRenewFor] = useState<Member | null>(null);
  const version = useGymStore((s) => s.v);

  const effectiveStatus = (m: Member): "active" | "expiring" | "expired" | "frozen" =>
    isFrozenToday(m.id) ? "frozen" : subStatus(m.subEnd);

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
    <div className="space-y-4">
      {/* Expiring widget */}
      <Card className="glass rounded-2xl border-warning/40 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-warning" /> <bdi>{t("admin.expiringSoon")}</bdi>
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
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-warning/30 bg-card/40 px-3 py-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-warning/20 text-warning text-xs font-semibold">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground"><bdi>{d}d</bdi> · <bdi dir="ltr">{PLAN_LABEL[m.plan]}</bdi></div>
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

      {/* Members table */}
      <Card className="glass rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">{t("nav.members")}</CardTitle>
            <span className="text-xs text-muted-foreground"><bdi>{rows.length}</bdi> {t("common.of")} <bdi>{MEMBERS.length}</bdi></span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.byNameCinId")} className="ps-9 bg-background/50" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[170px] bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="expiring">{t("status.expiring")}</SelectItem>
                <SelectItem value="expired">{t("status.expired")}</SelectItem>
                <SelectItem value="frozen">{t("status.frozen")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as typeof genderFilter)}>
              <SelectTrigger className="w-[150px] bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.allGenders")}</SelectItem>
                <SelectItem value="male">{t("gender.men")}</SelectItem>
                <SelectItem value="female">{t("gender.women")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
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
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">No members match these filters.</TableCell></TableRow>
              )}
              {rows.map((m) => {
                const eff = effectiveStatus(m);
                const d = daysRemaining(m.subEnd);
                const s = statusMeta(eff, t);
                const isAtRisk = eff === "expiring" || eff === "expired";
                return (
                  <TableRow key={m.id} onClick={() => setSelected(m)} className="cursor-pointer border-border/40 hover:bg-accent/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className={m.gender === "male" ? "bg-mens/20 text-mens text-xs font-semibold" : "bg-womens/20 text-womens text-xs font-semibold"}>
                            {initials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{m.name}</div>
                          <div className="text-xs text-muted-foreground"><bdi dir="ltr">{m.id}</bdi> · <bdi dir="ltr">{PLAN_LABEL[m.plan]}</bdi></div>
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
                        : d === 0 ? <span className="text-destructive">—</span>
                        : <bdi>{d}d</bdi>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border ${s.cls}`}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="secondary" className="h-8" onClick={() => setRenewFor(m)}>
                          <RefreshCw className="size-3.5" /> {t("action.renew")}
                        </Button>
                        {isAtRisk && <WhatsAppButton member={m} tone="renew" />}
                        {eff === "frozen" ? (
                          <Button size="sm" variant="outline"
                            className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10"
                            onClick={() => { gymStore.unfreeze(m.id); toast.success(`${m.name} unfrozen`); }}>
                            <Snowflake className="size-3.5" /> {t("action.unfreeze")}
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-sky-300 hover:bg-sky-500/10" onClick={() => setFreezeFor(m)}>
                            <Snowflake className="size-3.5" /> {t("action.freeze")}
                          </Button>
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
        frozen={selected ? isFrozenToday(selected.id) : null}
      />
      <FreezeDialog member={freezeFor} open={!!freezeFor} onOpenChange={(o) => !o && setFreezeFor(null)} />
      <RenewDialog member={renewFor} open={!!renewFor} onOpenChange={(o) => !o && setRenewFor(null)} />
    </div>
  );
}

function MemberSheet({ member, onClose, onFreeze, onRenew, frozen }: {
  member: Member | null;
  onClose: () => void;
  onFreeze: (m: Member) => void;
  onRenew: (m: Member) => void;
  frozen: { from: string; to: string } | null;
}) {
  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-card/95 backdrop-blur-xl border-l border-border/60 w-full sm:max-w-md overflow-y-auto">
        {member && (
          <>
            <SheetHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  <AvatarFallback className={member.gender === "male" ? "bg-mens/20 text-mens text-base font-semibold" : "bg-womens/20 text-womens text-base font-semibold"}>
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <SheetTitle className="text-lg">{member.name}</SheetTitle>
                  <SheetDescription className="text-xs">{member.id} · {member.cin} · {PLAN_LABEL[member.plan]}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {frozen && (
              <div className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm flex items-center gap-2">
                <Snowflake className="size-4 text-sky-300" />
                <span><span className="text-sky-300 font-medium">Frozen</span> · {frozen.from} → {frozen.to}</span>
              </div>
            )}

            <div className="mt-6 space-y-6">
              {/* QR */}
              <section className="flex justify-center">
                <MemberQR member={member} size={140} />
              </section>

              {/* Subscription progress */}
              <section className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase tracking-wide">Subscription used</span>
                  <span>{subUsedPct(member.subStart, member.subEnd)}%</span>
                </div>
                <Progress value={subUsedPct(member.subStart, member.subEnd)} className="mt-3 h-3" />
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Start · {tzFormatDate(member.subStart)}</span>
                  <span className="text-muted-foreground">End · {tzFormatDate(member.subEnd)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-primary" />
                  <span className="font-medium">{daysRemaining(member.subEnd)} days remaining</span>
                  <span className="text-muted-foreground">· {member.subMonths}-month plan</span>
                </div>
              </section>

              {/* Subscription history */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <HistoryIcon className="size-4 text-muted-foreground" /> Payment history
                </div>
                <ul className="space-y-2">
                  {member.history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>{tzFormatDate(h.date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{PLAN_LABEL[h.plan]} · {h.amount} MAD</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Check-ins */}
              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-muted-foreground" /> Recent check-ins
                </div>
                <ol className="relative border-l border-border/60 pl-4 space-y-3">
                  {member.recentCheckIns.length === 0 && (
                    <li className="text-xs text-muted-foreground">No recent check-ins.</li>
                  )}
                  {member.recentCheckIns.map((c, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                      <div className="text-sm">{tzFormatDate(c, { day: "2-digit", month: "short" })}</div>
                      <div className="text-xs text-muted-foreground">{i === 0 ? "Most recent visit" : `Visit #${member.recentCheckIns.length - i}`}</div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="grid grid-cols-2 gap-2 sticky bottom-0 bg-card/95 backdrop-blur pt-2">
                <Button onClick={() => onRenew(member)} className="gap-1.5 bg-success text-black hover:bg-success/90">
                  <RefreshCw className="size-4" /> Renew (cash)
                </Button>
                <Button variant="outline" onClick={() => onFreeze(member)} className="gap-1.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/10">
                  <Snowflake className="size-4" /> Freeze
                </Button>
                <div className="col-span-2">
                  <WhatsAppButton member={member} tone="renew" size="sm" label="WhatsApp member" className="w-full" />
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
