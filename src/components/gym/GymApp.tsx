import { useMemo, useState } from "react";
import { Bell, BookUser, Dumbbell, LogOut, ScanLine, Shield, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GymSidebar } from "./Sidebar";
import { AdminView } from "./AdminView";
import { OnboardingView } from "./OnboardingView";
import { MembersDirectory } from "./MembersDirectory";
import { ReceptionDesk } from "./ReceptionDesk";
import { QuickActionsFab } from "./QuickActionsFab";
import { LoginScreen } from "./LoginScreen";
import { StaffManagement } from "./StaffManagement";
import { CoachesView } from "./CoachesView";
import { AccessDenied } from "./AccessDenied";
import { useAuth } from "@/lib/auth";
import { dayName } from "@/lib/gym-data";
import { useCurrentShift } from "@/lib/gym-shift";
import { useI18n, type DictKey } from "@/lib/i18n";

type View = "admin" | "members" | "onboard" | "reception" | "coaches" | "staff";

const TABS: { key: View; label: string; tKey: DictKey; icon: typeof Users; roles: Array<"owner" | "receptionist"> }[] = [
  { key: "admin",     label: "Dashboard", tKey: "nav.dashboard", icon: Users,     roles: ["owner"] },
  { key: "members",   label: "Members",   tKey: "nav.members",   icon: BookUser,  roles: ["owner", "receptionist"] },
  { key: "reception", label: "Reception", tKey: "nav.reception", icon: ScanLine,  roles: ["owner", "receptionist"] },
  { key: "onboard",   label: "Onboard",   tKey: "nav.onboard",   icon: UserPlus,  roles: ["owner", "receptionist"] },
  { key: "coaches",   label: "Coaches",   tKey: "nav.coaches",   icon: Dumbbell,  roles: ["owner", "receptionist"] },
  { key: "staff",     label: "Staff",     tKey: "nav.staff",     icon: Shield,    roles: ["owner"] },
];

export function GymApp() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <Workspace />;
}

function Workspace() {
  const { user, logout } = useAuth();
  const { t, lang, toggle } = useI18n();
  const role = user!.role;
  const initialView: View = role === "receptionist" ? "reception" : "admin";
  const [view, setView] = useState<View>(initialView);
  const today = useMemo(() => new Date(), []);
  const shift = useCurrentShift();
  const mode = shift.audience; // "men" | "women" | "closed"
  const label = dayName(today);

  const themeClass = mode === "women" ? "theme-womens" : mode === "closed" ? "theme-neutral" : "";
  const shiftLabel =
    mode === "men" ? t("shift.men")
      : mode === "women" ? t("shift.women")
      : t("shift.closed");
  const shiftBadgeClass =
    mode === "men" ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
      : mode === "women" ? "bg-rose-500/20 text-rose-200 border border-rose-500/40"
      : "bg-muted/40 text-muted-foreground border border-border/60";
  const accentLabel = shift.label;

  const visibleTabs = TABS.filter((tab) => tab.roles.includes(role));
  const allowed = visibleTabs.some((tab) => tab.key === view);

  const headings: Record<View, { title: string; sub: string }> = {
    admin:     { title: t("head.admin.title"),     sub: t("head.admin.sub") },
    members:   { title: t("head.members.title"),   sub: t("head.members.sub") },
    reception: { title: t("head.reception.title"), sub: t("head.reception.sub") },
    onboard:   { title: t("head.onboard.title"),   sub: t("head.onboard.sub") },
    coaches:   { title: t("head.coaches.title"),   sub: t("head.coaches.sub") },
    staff:     { title: t("head.staff.title"),     sub: t("head.staff.sub") },
  };

  return (
    <div className={cn("min-h-screen flex", themeClass)}>
      <GymSidebar view={view} onChange={setView} accentLabel={accentLabel} role={role} />

      <main className="flex-1 p-3 md:p-5 space-y-4">
        {/* Top bar */}
        <div className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge className={cn("border", shiftBadgeClass)} variant="outline">
              {label} · {shiftLabel}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">{accentLabel}</span>
          </div>

          <div className="hidden md:flex relative flex-1 max-w-sm ms-2">
            <Search className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("search.members")} className="ps-9 bg-background/50" />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border/60 bg-card/40 p-1 overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap",
                    view === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="size-3.5" /> {t(tab.tKey)}
                </button>
              ))}
            </div>

            <button
              onClick={toggle}
              aria-label="Toggle language"
              className="h-9 px-2.5 rounded-lg border border-border/60 bg-card/40 hover:bg-accent transition flex items-center gap-1 text-xs font-semibold"
            >
              <span className={cn(lang === "ar" ? "text-primary" : "text-muted-foreground")}>AR</span>
              <span className="text-muted-foreground">/</span>
              <span className={cn(lang === "en" ? "text-primary" : "text-muted-foreground")}>EN</span>
            </button>

            <Button size="icon" variant="ghost" className="hover:bg-accent" aria-label={t("common.notify")}>
              <Bell className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full ps-1 pe-3 py-1 border border-border/60 bg-card/40 hover:bg-accent transition">
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/40 grid place-items-center text-xs font-semibold text-primary-foreground">
                    {user!.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="hidden sm:block text-start">
                    <div className="text-xs font-medium leading-tight">{user!.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {role === "owner" ? t("role.owner") : t("role.receptionist")}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/60 w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <div className="text-sm">{user!.name}</div>
                  <div className="text-[11px] text-muted-foreground font-normal">{user!.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/15">
                  <LogOut className="size-4" /> {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Heading */}
        <div className="px-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{headings[view].title}</h1>
          <p className="text-sm text-muted-foreground">{headings[view].sub}</p>
        </div>

        {!allowed ? (
          <AccessDenied onBack={() => setView(initialView)} />
        ) : (
          <>
            {view === "admin"     && <AdminView todayMode={mode} dayLabel={label} />}
            {view === "members"   && <MembersDirectory />}
            {view === "reception" && <ReceptionDesk />}
            {view === "onboard"   && <OnboardingView />}
            {view === "coaches"   && <CoachesView />}
            {view === "staff"     && <StaffManagement />}
          </>
        )}
      </main>

      <QuickActionsFab onQuickOnboard={() => setView("onboard")} role={role} />
    </div>
  );
}
