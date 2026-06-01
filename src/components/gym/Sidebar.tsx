import { Dumbbell, LayoutDashboard, Users, ScanLine, UserPlus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type View = "admin" | "members" | "reception" | "onboard" | "coaches" | "staff";

type Props = {
  view: View;
  onChange?: (v: View) => void;
  accentLabel: string;
  role: "owner" | "receptionist";
};

const ALL: { key: View; icon: typeof Users; label: string; roles: Array<"owner" | "receptionist"> }[] = [
  { key: "admin",     icon: LayoutDashboard, label: "Dashboard",  roles: ["owner"] },
  { key: "members",   icon: Users,           label: "Members",    roles: ["owner", "receptionist"] },
  { key: "reception", icon: ScanLine,        label: "Reception",  roles: ["owner", "receptionist"] },
  { key: "onboard",   icon: UserPlus,        label: "Onboard",    roles: ["owner", "receptionist"] },
  { key: "coaches",   icon: Dumbbell,        label: "Coaches",    roles: ["owner", "receptionist"] },
  { key: "staff",     icon: Shield,          label: "Staff",      roles: ["owner"] },
];

export function GymSidebar({ view, onChange, accentLabel, role }: Props) {
  const items = ALL.filter((i) => i.roles.includes(role));
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-5 p-4 bg-card/30 border border-border/40 rounded-2xl m-3 sticky top-3 h-[calc(100vh-1.5rem)]">
      <div className="flex items-center gap-2">
        <div className="size-9 rounded-xl bg-primary grid place-items-center">
          <Dumbbell className="size-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">PULSE<span className="text-primary">·</span>CRM</div>
          <div className="text-xs text-muted-foreground">{accentLabel}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange?.(it.key)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                "hover:bg-accent/70",
                active && "bg-accent text-foreground",
              )}
            >
              <it.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border/40 p-3 bg-background/30 text-xs text-muted-foreground">
        Cash-only gym CRM · MAD<br />
        Africa/Casablanca timezone
      </div>
    </aside>
  );
}
