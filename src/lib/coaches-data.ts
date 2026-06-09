// Coach data + persistence (Phase 8/10 — Gender-Isolated Coach & Group Management)
import { useSyncExternalStore } from "react";

export type CoachAudience = "men" | "women";

/** Day-of-week index: 0=Sun, 1=Mon, ..., 6=Sat (matches tzDayOfWeek). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAYS: { idx: Weekday; short: string; long: string }[] = [
  { idx: 1, short: "Mon", long: "Monday" },
  { idx: 2, short: "Tue", long: "Tuesday" },
  { idx: 3, short: "Wed", long: "Wednesday" },
  { idx: 4, short: "Thu", long: "Thursday" },
  { idx: 5, short: "Fri", long: "Friday" },
  { idx: 6, short: "Sat", long: "Saturday" },
  { idx: 0, short: "Sun", long: "Sunday" },
];

/** Per the gym's gender matrix:
 *  - Women: Mon, Wed, Fri only.
 *  - Men:   Tue, Thu, Sat only.
 *  Sundays are mixed/closed — never selectable for a single-audience coach.
 */
export const ALLOWED_DAYS: Record<CoachAudience, Weekday[]> = {
  women: [1, 3, 5],
  men:   [2, 4, 6],
};

export function isDayAllowed(audience: CoachAudience, day: Weekday) {
  return ALLOWED_DAYS[audience].includes(day);
}

export type CoachStatus = "active" | "archived";

export type Coach = {
  id: string;
  name: string;
  specialty: string;
  workingDays: Weekday[];
  startTime: string;     // "HH:MM"
  endTime: string;       // "HH:MM"
  audience: CoachAudience;
  createdAt: string;
  joinedAt: string;      // ISO date — drives billing cycle anchor
  status: CoachStatus;
};

/** Compute the current active billing cycle (1 month) anchored on joinedAt's day-of-month. */
export function getCoachBillingCycle(joinedAt: string, today: string): { start: string; end: string } {
  const j = new Date(`${joinedAt}T00:00:00Z`);
  const t = new Date(`${today}T00:00:00Z`);
  const anchorDay = j.getUTCDate();
  let start = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), anchorDay));
  if (start.getTime() > t.getTime()) {
    start = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, anchorDay));
  }
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(end.getUTCDate() - 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}


/** Render coach.workingDays + times into a human-readable line. */
export function formatSchedule(c: Coach): string {
  if (!c.workingDays.length) return "Schedule TBD";
  const ordered = WEEKDAYS.filter((w) => c.workingDays.includes(w.idx)).map((w) => w.short);
  return `${ordered.join(" · ")} · ${c.startTime}-${c.endTime}`;
}

const KEY = "pulse.coaches.v2";

const SEED: Coach[] = [
  { id: "C-M01", name: "Younes El Amrani", specialty: "Bodybuilding",            workingDays: [2, 4, 6], startTime: "18:00", endTime: "21:00", audience: "men",   createdAt: new Date().toISOString() },
  { id: "C-M02", name: "Karim Bensaid",    specialty: "Strength & Powerlifting", workingDays: [2, 4, 6], startTime: "06:00", endTime: "09:00", audience: "men",   createdAt: new Date().toISOString() },
  { id: "C-M03", name: "Reda Hakim",       specialty: "Boxing / Cardio",         workingDays: [2, 4, 6], startTime: "19:30", endTime: "21:00", audience: "men",   createdAt: new Date().toISOString() },
  { id: "C-W01", name: "Salma Idrissi",    specialty: "Aerobics & Zumba",        workingDays: [1, 3, 5], startTime: "18:00", endTime: "20:00", audience: "women", createdAt: new Date().toISOString() },
  { id: "C-W02", name: "Nadia Tahiri",     specialty: "Pilates & Core",          workingDays: [1, 3, 5], startTime: "09:00", endTime: "11:00", audience: "women", createdAt: new Date().toISOString() },
  { id: "C-W03", name: "Imane Ouazzani",   specialty: "HIIT & Weight Loss",      workingDays: [1, 3, 5], startTime: "17:00", endTime: "19:00", audience: "women", createdAt: new Date().toISOString() },
];

function hydrate(): Coach[] {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Coach[];
  } catch {}
  return SEED;
}

const state: { coaches: Coach[]; v: number } = { coaches: hydrate(), v: 0 };
const listeners = new Set<() => void>();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state.coaches)); } catch {} };
const emit = () => { state.v += 1; persist(); listeners.forEach((l) => l()); };

export const coachStore = {
  list: () => state.coaches,
  get: (id: string) => state.coaches.find((c) => c.id === id),
  add(input: Omit<Coach, "id" | "createdAt">) {
    const prefix = input.audience === "men" ? "C-M" : "C-W";
    const nextNum = String(
      Math.max(0, ...state.coaches.filter((c) => c.id.startsWith(prefix)).map((c) => parseInt(c.id.slice(prefix.length), 10) || 0)) + 1,
    ).padStart(2, "0");
    const coach: Coach = { id: `${prefix}${nextNum}`, createdAt: new Date().toISOString(), ...input };
    state.coaches = [coach, ...state.coaches];
    emit();
    return coach;
  },
  remove(id: string) {
    state.coaches = state.coaches.filter((c) => c.id !== id);
    emit();
  },
};

export function useCoaches() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state.coaches,
    () => state.coaches,
  );
}
