import { useMemo, useState } from "react";
import { Bell, Search, Users, User, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GymSidebar } from "./Sidebar";
import { AdminView } from "./AdminView";
import { MemberView } from "./MemberView";
import { OnboardingView } from "./OnboardingView";
import { dayName, todayGender } from "@/lib/gym-data";

type View = "admin" | "member" | "onboard";

export function GymApp() {
  const [view, setView] = useState<View>("admin");
  const today = useMemo(() => new Date(), []);
  const mode = todayGender(today);
  const label = dayName(today);

  const themeClass =
    mode === "women" ? "theme-womens" : mode === "mixed" ? "theme-neutral" : "";

  const accentLabel =
    mode === "men" ? "Men's day · Mon/Wed/Fri"
      : mode === "women" ? "Women's day · Tue/Thu/Sat"
      : "Mixed day · Sunday";

  return (
    <div className={cn("min-h-screen flex", themeClass)}>
      <GymSidebar view={view === "member" ? "member" : "admin"} accentLabel={accentLabel} />

      <main className="flex-1 p-3 md:p-5 space-y-4">
        {/* Top bar */}
        <div className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{label}</Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">{accentLabel}</span>
          </div>

          <div className="hidden md:flex relative flex-1 max-w-sm ml-2">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search members, classes…" className="pl-9 bg-background/50" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-border/60 bg-card/40 p-1">
              <button
                onClick={() => setView("admin")}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all",
                  view === "admin" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="size-3.5" /> Admin
              </button>
              <button
                onClick={() => setView("onboard")}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all",
                  view === "onboard" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserPlus className="size-3.5" /> Onboard
              </button>
              <button
                onClick={() => setView("member")}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all",
                  view === "member" ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="size-3.5" /> Member
              </button>
            </div>

            <Button size="icon" variant="ghost" className="hover:bg-accent">
              <Bell className="size-4" />
            </Button>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/40 grid place-items-center text-xs font-semibold text-primary-foreground">
              {view === "member" ? "LC" : "AD"}
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="px-1 flex items-end justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              {view === "admin" ? "Operations Dashboard" : view === "onboard" ? "New Member Onboarding" : "My Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {view === "admin"
                ? "Adaptive insights filtered to today's gender schedule."
                : view === "onboard"
                ? "Create a profile, assign a plan, and welcome them in."
                : "Your training, rewards and bookings in one place."}
            </p>
          </div>
        </div>

        {view === "admin" && <AdminView todayMode={mode} dayLabel={label} />}
        {view === "onboard" && <OnboardingView />}
        {view === "member" && <MemberView />}
      </main>
    </div>
  );
}
