import { LayoutDashboard, Users, CalendarDays, Trophy, Dumbbell, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { view: "admin" | "member"; accentLabel: string };

const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Members" },
  { icon: CalendarDays, label: "Schedule" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

const memberNav = [
  { icon: LayoutDashboard, label: "My Hub", active: true },
  { icon: CalendarDays, label: "Bookings" },
  { icon: Trophy, label: "Rewards" },
  { icon: Dumbbell, label: "Workouts" },
  { icon: Settings, label: "Account" },
];

export function GymSidebar({ view, accentLabel }: Props) {
  const items = view === "admin" ? adminNav : memberNav;
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 p-5 glass rounded-2xl m-3 sticky top-3 h-[calc(100vh-1.5rem)]">
      <div className="flex items-center gap-2">
        <div className="size-9 rounded-xl bg-primary grid place-items-center glow-primary">
          <Dumbbell className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">PULSE<span className="text-primary">·</span>CRM</div>
          <div className="text-xs text-muted-foreground">{accentLabel}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.label}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              "hover:bg-accent hover:translate-x-0.5",
              it.active && "bg-accent text-foreground glow-primary"
            )}
          >
            <it.icon className={cn("size-4 transition-colors", it.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-border/60 p-4 bg-card/40">
        <div className="text-xs text-muted-foreground">Today's mode</div>
        <div className="mt-1 text-sm font-medium">{accentLabel}</div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-2/3 bg-primary" />
        </div>
      </div>
    </aside>
  );
}
