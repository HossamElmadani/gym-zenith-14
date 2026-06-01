// Coach data + persistence (Phase 8 — Gender-Isolated Coach & Group Management)
import { useSyncExternalStore } from "react";

export type CoachAudience = "men" | "women";

export type Coach = {
  id: string;
  name: string;
  specialty: string;
  schedule: string;
  audience: CoachAudience;
  createdAt: string;
};

const KEY = "pulse.coaches.v1";

const SEED: Coach[] = [
  { id: "C-M01", name: "Younes El Amrani", specialty: "Bodybuilding", schedule: "Mon · Wed · Fri · 18:00-21:00", audience: "men", createdAt: new Date().toISOString() },
  { id: "C-M02", name: "Karim Bensaid", specialty: "Strength & Powerlifting", schedule: "Mon · Wed · Fri · 06:00-09:00", audience: "men", createdAt: new Date().toISOString() },
  { id: "C-M03", name: "Reda Hakim", specialty: "Boxing / Cardio", schedule: "Mon · Wed · Fri · 19:30-21:00", audience: "men", createdAt: new Date().toISOString() },
  { id: "C-W01", name: "Salma Idrissi", specialty: "Aerobics & Zumba", schedule: "Tue · Thu · Sat · 18:00-20:00", audience: "women", createdAt: new Date().toISOString() },
  { id: "C-W02", name: "Nadia Tahiri", specialty: "Pilates & Core", schedule: "Tue · Thu · Sat · 09:00-11:00", audience: "women", createdAt: new Date().toISOString() },
  { id: "C-W03", name: "Imane Ouazzani", specialty: "HIIT & Weight Loss", schedule: "Tue · Thu · Sat · 17:00-19:00", audience: "women", createdAt: new Date().toISOString() },
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
