import { useSyncExternalStore } from "react";
import { MEMBERS, type Member } from "./gym-data";

export type CashEntry = {
  id: string;
  ts: string;            // ISO datetime
  memberId?: string;
  memberName?: string;
  amount: number;
  method: "cash" | "card" | "transfer";
  note?: string;
};

export type MaintenanceReport = {
  id: string;
  ts: string;
  machine: string;
  severity: "low" | "medium" | "high";
  note?: string;
};

export type FreezeWindow = { from: string; to: string };

type State = {
  cash: CashEntry[];
  maintenance: MaintenanceReport[];
  frozen: Record<string, FreezeWindow>;
  v: number;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const state: State = {
  cash: [
    { id: "c1", ts: new Date().toISOString(), memberId: "M-1045", memberName: "Daniel Reyes", amount: 650, method: "cash", note: "Elite renewal" },
    { id: "c2", ts: new Date().toISOString(), memberId: "F-2033", memberName: "Isabella Cruz", amount: 400, method: "card", note: "Pro renewal" },
    { id: "c3", ts: new Date().toISOString(), memberId: "M-1041", memberName: "Liam Carter", amount: 250, method: "cash", note: "Drop-in" },
  ],
  maintenance: [],
  frozen: {},
  v: 0,
};

const listeners = new Set<() => void>();
const emit = () => {
  state.v += 1;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useGymStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const gymStore = {
  getState: () => state,

  logCash(entry: Omit<CashEntry, "id" | "ts"> & { ts?: string }) {
    state.cash = [
      { id: crypto.randomUUID(), ts: entry.ts ?? new Date().toISOString(), ...entry },
      ...state.cash,
    ];
    emit();
  },

  reportMaintenance(entry: Omit<MaintenanceReport, "id" | "ts">) {
    state.maintenance = [
      { id: crypto.randomUUID(), ts: new Date().toISOString(), ...entry },
      ...state.maintenance,
    ];
    emit();
  },

  freezeMember(memberId: string, win: FreezeWindow) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;
    const fromMs = new Date(win.from).getTime();
    const toMs = new Date(win.to).getTime();
    const days = Math.max(0, Math.round((toMs - fromMs) / 86_400_000));
    // Shift end date forward by frozen duration
    const end = new Date(m.subEnd);
    end.setDate(end.getDate() + days);
    m.subEnd = end.toISOString().slice(0, 10);
    state.frozen = { ...state.frozen, [memberId]: win };
    emit();
  },

  unfreeze(memberId: string) {
    const { [memberId]: _, ...rest } = state.frozen;
    state.frozen = rest;
    emit();
  },
};

export function isFrozenToday(memberId: string, now = new Date()): FreezeWindow | null {
  const w = state.frozen[memberId];
  if (!w) return null;
  const t = now.toISOString().slice(0, 10);
  if (t >= w.from && t <= w.to) return w;
  return null;
}

export function cashCollectedToday(): number {
  const t = todayISO();
  return state.cash
    .filter((c) => c.ts.slice(0, 10) === t)
    .reduce((sum, c) => sum + c.amount, 0);
}

// Plan pricing in MAD (demo)
export const PLAN_PRICES: Record<Member["plan"], number> = {
  Basic: 250,
  Pro: 400,
  Elite: 650,
};

export function expiringValueThisWeek(): number {
  const now = new Date();
  const weekMs = 7 * 86_400_000;
  return MEMBERS.filter((m) => {
    const end = new Date(m.subEnd + "T23:59:59").getTime();
    const diff = end - now.getTime();
    return diff > 0 && diff <= weekMs;
  }).reduce((sum, m) => sum + PLAN_PRICES[m.plan], 0);
}
