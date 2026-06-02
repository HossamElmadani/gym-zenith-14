// PHASE 9 — Time-Aware Gender Shift Matrix
// Strictly evaluated in Africa/Casablanca via tz helpers.
// This is the SINGLE SOURCE OF TRUTH for "who can enter right now".

import { useEffect, useState } from "react";
import { APP_TZ, tzDayOfWeek } from "./gym-tz";

export type ShiftAudience = "men" | "women" | "closed";

export type ShiftWindow = {
  audience: Exclude<ShiftAudience, "closed">;
  start: string; // "HH:MM"
  end: string;   // "HH:MM" (exclusive)
};

/** Day index: 0=Sun .. 6=Sat */
export const SHIFT_MATRIX: Record<number, ShiftWindow[]> = {
  1: [ // Monday
    { audience: "men",   start: "09:00", end: "14:00" },
    { audience: "women", start: "14:30", end: "19:30" },
    { audience: "men",   start: "20:00", end: "23:00" },
  ],
  2: [ // Tuesday
    { audience: "men",   start: "09:00", end: "22:00" },
  ],
  3: [ // Wednesday
    { audience: "men",   start: "09:00", end: "14:00" },
    { audience: "women", start: "14:30", end: "22:00" },
  ],
  4: [ // Thursday
    { audience: "men",   start: "09:00", end: "22:00" },
  ],
  5: [ // Friday
    { audience: "men",   start: "09:00", end: "13:00" },
    { audience: "women", start: "15:00", end: "22:00" },
  ],
  6: [ // Saturday
    { audience: "men",   start: "09:00", end: "22:00" },
  ],
  0: [ // Sunday
    { audience: "men",   start: "10:00", end: "13:30" },
  ],
};

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nowHM(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export type CurrentShift = {
  audience: ShiftAudience;
  /** Active window (when audience !== "closed") */
  active?: ShiftWindow;
  /** Next upcoming window today (when "closed") */
  next?: ShiftWindow;
  /** Human label e.g. "Men · 09:00–22:00" or "Transition — Women at 14:30" */
  label: string;
  /** Compact matrix line for today, for tooltips/subtitles */
  todayLine: string;
};

export function currentShift(d = new Date()): CurrentShift {
  const day = tzDayOfWeek(d);
  const hm = nowHM(d);
  const windows = SHIFT_MATRIX[day] ?? [];

  const active = windows.find((w) => hm >= w.start && hm < w.end);
  const next = windows.find((w) => hm < w.start);

  const todayLine =
    `${DAY_SHORT[day]}: ` +
    (windows.length
      ? windows.map((w) => `${cap(w.audience)} ${w.start}–${w.end}`).join(" · ")
      : "Closed");

  if (active) {
    return {
      audience: active.audience,
      active,
      label: `${cap(active.audience)} · ${active.start}–${active.end}`,
      todayLine,
    };
  }
  return {
    audience: "closed",
    next,
    label: next
      ? `Transition — ${cap(next.audience)} at ${next.start}`
      : "Closed for the day",
    todayLine,
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** React hook: re-render every `intervalMs` so the badge tracks real time. */
export function useCurrentShift(intervalMs = 30_000): CurrentShift {
  // Lazy import to avoid SSR React import cost at module load.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect, useState } = require("react") as typeof import("react");
  const [shift, setShift] = useState<CurrentShift>(() => currentShift());
  useEffect(() => {
    const tick = () => setShift(currentShift());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return shift;
}
