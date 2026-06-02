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

type View = "admin" | "members" | "onboard" | "reception" | "coaches" | "staff";

const TABS: { key: View; label: string; icon: typeof Users; roles: Array<"owner" | "receptionist"> }[] = [
  { key: "admin",     label: "Dashboard", icon: Users,     roles: ["owner"] },
  { key: "members",   label: "Members",   icon: BookUser,  roles: ["owner", "receptionist"] },
  { key: "reception", label: "Reception", icon: ScanLine,  roles: ["owner", "receptionist"] },
  { key: "onboard",   label: "Onboard",   icon: UserPlus,  roles: ["owner", "receptionist"] },
  { key: "coaches",   label: "Coaches",   icon: Dumbbell,  roles: ["owner", "receptionist"] },
  { key: "staff",     label: "Staff",     icon: Shield,    roles: ["owner"] },
];

export function GymApp() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <Workspace />;
}

function Workspace() {
  const { user, logout } = useAuth();
  const role = user!.role;
  const initialView: View = role === "receptionist" ? "reception" : "admin";
  const [view, setView] = useState<View>(initialView);
  const today = useMemo(() => new Date(), []);
  const shift = useCurrentShift();
  const mode = shift.audience; // "men" | "women" | "closed"
  const label = dayName(today);

  const themeClass = mode === "women" ? "theme-womens" : mode === "closed" ? "theme-neutral" : "";
  const shiftLabel =
    mode === "men" ? "Active Shift: Men"
      : mode === "women" ? "Active Shift: Women"
      : "Transition / Closed";
  const shiftBadgeClass =
    mode === "men" ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
      : mode === "women" ? "bg-rose-500/20 text-rose-200 border border-rose-500/40"
      : "bg-muted/40 text-muted-foreground border border-border/60";
  const accentLabel = shift.label;

  const visibleTabs = TABS.filter((t) => t.roles.includes(role));
  const allowed = visibleTabs.some((t) => t.key === view);

  const headings: Record<View, { title: string; sub: string }> = {
    admin:     { title: "Today's Overview",        sub: "Active members, cash collected and renewals — at a glance." },
    members:   { title: "Members",                 sub: "Search, renew, freeze and reach members." },
    reception: { title: "Reception Check-in Desk", sub: "Scan QR or CIN to validate access." },
    onboard:   { title: "New Member",              sub: "Register a member, take cash and print a receipt." },
    coaches:   { title: "Coaches & Groups",        sub: "Men's and Women's coaches — fully isolated to prevent human error." },
    staff:     { title: "Staff & Access",          sub: "Manage who can sign in." },
  };

  return (
    <div className={cn("min-h-screen flex", themeClass)}>
      <GymSidebar view={view} onChange={setView} accentLabel={accentLabel} role={role} />

      <main className="flex-1 p-3 md:p-5 space-y-4">
        {/* Top bar */}
        <div className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{label}</Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">{accentLabel}</span>
          </div>

          <div className="hidden md:flex relative flex-1 max-w-sm ml-2">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search members…" className="pl-9 bg-background/50" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border/60 bg-card/40 p-1 overflow-x-auto">
              {visibleTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap",
                    view === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <Button size="icon" variant="ghost" className="hover:bg-accent">
              <Bell className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-border/60 bg-card/40 hover:bg-accent transition">
                  <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/40 grid place-items-center text-xs font-semibold text-primary-foreground">
                    {user!.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-medium leading-tight">{user!.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{role}</div>
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
                  <LogOut className="size-4" /> Logout
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
