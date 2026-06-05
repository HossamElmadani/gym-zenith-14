import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getSyncError, subscribeSyncStatus } from "@/lib/gym-store";
import { useI18n } from "@/lib/i18n";

export function LiveSyncIndicator() {
  const error = useSyncExternalStore(subscribeSyncStatus, getSyncError, () => null);
  const { t } = useI18n();
  const ok = !error;
  return (
    <div
      title={error ?? undefined}
      className={cn(
        "hidden md:inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        ok
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/40 bg-amber-500/10 text-amber-300",
      )}
    >
      <span className="relative inline-flex size-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            ok ? "bg-emerald-400 animate-ping" : "bg-amber-400",
          )}
        />
        <span className={cn("relative inline-flex size-2 rounded-full", ok ? "bg-emerald-400" : "bg-amber-400")} />
      </span>
      <span>{ok ? t("sync.active") : t("sync.error")}</span>
    </div>
  );
}
