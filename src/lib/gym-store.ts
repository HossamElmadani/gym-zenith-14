import { useSyncExternalStore } from "react";
import {
  MEMBERS, persistMembers, PLAN_PRICES, PLAN_MONTHS, type Member, type PlanCode,
} from "./gym-data";
import { tzAddMonthsISO, tzDaysUntil, tzTodayISO } from "./gym-tz";

// ---------------------------------------------------------------------------
// PERSISTENCE LAYER (Supabase-ready abstraction)
//
// All mutations go through gymStore.* below. The store currently persists to
// localStorage so member, cash and freeze data survive page refresh. The same
// API surface is what a Supabase implementation would call — see
// `src/lib/supabase-prep.md` for the planned schema.
// ---------------------------------------------------------------------------

export type CashEntry = {
  id: string;
  ts: string;
  memberId?: string;
  memberName?: string;
  amount: number;             // MAD
  kind: "registration" | "renewal" | "dropin" | "other";
  planCode?: PlanCode;        // when registration/renewal
  note?: string;
};

export type FreezeWindow = { from: string; to: string };

export type ExpenseEntry = {
  id: string;
  ts: string;
  category: string;
  amount: number;
  note?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "receptionist";
  createdAt: string;
  active: boolean;
};

type Persisted = {
  cash: CashEntry[];
  expenses: ExpenseEntry[];
  frozen: Record<string, FreezeWindow>;
  staff: StaffMember[];
};

const STORE_KEY = "pulse.store.v1";

const defaults: Persisted = {
  cash: [],
  expenses: [],
  frozen: {},
  staff: [
    { id: "s1", name: "Alex Owner",       email: "admin@gym.com",     role: "owner",        createdAt: new Date().toISOString(), active: true },
    { id: "s2", name: "Riley Front-Desk", email: "reception@gym.com", role: "receptionist", createdAt: new Date().toISOString(), active: true },
  ],
};

function hydrate(): Persisted {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(STORE_KEY);
    if (raw) return { ...defaults, ...(JSON.parse(raw) as Persisted) };
  } catch {}
  return defaults;
}

const state: Persisted & { v: number } = { ...hydrate(), v: 0 };

const listeners = new Set<() => void>();
const persist = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      cash: state.cash, expenses: state.expenses,
      frozen: state.frozen, staff: state.staff,
    }));
  } catch {}
};
const emit = () => {
  state.v += 1;
  persist();
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

type View = Persisted & { v: number };

export function useGymStore<T>(selector: (s: View) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// ---- API ----

export const gymStore = {
  getState: () => state,

  logCash(entry: Omit<CashEntry, "id" | "ts"> & { ts?: string }) {
    state.cash = [
      { id: crypto.randomUUID(), ts: entry.ts ?? new Date().toISOString(), ...entry },
      ...state.cash,
    ];
    emit();
  },

  logExpense(entry: Omit<ExpenseEntry, "id" | "ts"> & { ts?: string }) {
    state.expenses = [
      { id: crypto.randomUUID(), ts: entry.ts ?? new Date().toISOString(), ...entry },
      ...state.expenses,
    ];
    emit();
  },

  addStaff(entry: Omit<StaffMember, "id" | "createdAt" | "active"> & { active?: boolean }) {
    state.staff = [
      { id: crypto.randomUUID(), createdAt: new Date().toISOString(), active: entry.active ?? true, ...entry },
      ...state.staff,
    ];
    emit();
  },
  removeStaff(id: string) {
    state.staff = state.staff.filter((s) => s.id !== id);
    emit();
  },
  toggleStaffActive(id: string) {
    state.staff = state.staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    emit();
  },

  // ----- Member operations (mutate MEMBERS in place + persist) -----

  addMember(m: Omit<Member, "history" | "recentCheckIns" | "createdAt" | "lastCheckIn" | "streak" | "points" | "churnRisk"> & {
    history?: Member["history"];
  }): Member {
    const full: Member = {
      streak: 0,
      points: 0,
      churnRisk: 0,
      lastCheckIn: tzTodayISO(),
      createdAt: tzTodayISO(),
      history: m.history ?? [],
      recentCheckIns: [],
      ...m,
    };
    MEMBERS.unshift(full);
    persistMembers();
    emit();
    return full;
  },

  assignCoach(memberId: string, coachId: string | null) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;
    m.coachId = coachId;
    persistMembers();
    emit();
  },

  renewMember(memberId: string, planCode: PlanCode, amountPaid: number): Member | null {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return null;
    const today = tzTodayISO();
    // Start renewal from later of today vs current subEnd
    const base = m.subEnd > today ? m.subEnd : today;
    const newEnd = tzAddMonthsISO(base, PLAN_MONTHS[planCode]);
    m.subStart = today;
    m.subEnd = newEnd;
    m.subMonths = PLAN_MONTHS[planCode];
    m.plan = planCode;
    m.history = [
      { date: today, plan: planCode, months: PLAN_MONTHS[planCode], amount: amountPaid },
      ...m.history,
    ];
    persistMembers();
    // Cash log
    state.cash = [
      {
        id: crypto.randomUUID(), ts: new Date().toISOString(),
        memberId: m.id, memberName: m.name,
        amount: amountPaid, kind: "renewal", planCode,
        note: `Renewal · ${planCode}`,
      },
      ...state.cash,
    ];
    emit();
    return m;
  },

  recordCheckIn(memberId: string) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;
    m.lastCheckIn = tzTodayISO();
    m.recentCheckIns = [tzTodayISO(), ...m.recentCheckIns].slice(0, 20);
    persistMembers();
    emit();
  },

  freezeMember(memberId: string, win: FreezeWindow) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;
    const days = Math.max(0, Math.round(
      (new Date(win.to).getTime() - new Date(win.from).getTime()) / 86_400_000,
    ));
    m.subEnd = tzAddMonthsISO(m.subEnd, 0); // normalize
    const [y, mo, d] = m.subEnd.split("-").map(Number);
    const end = new Date(Date.UTC(y, mo - 1, d));
    end.setUTCDate(end.getUTCDate() + days);
    m.subEnd = end.toISOString().slice(0, 10);
    persistMembers();
    state.frozen = { ...state.frozen, [memberId]: win };
    emit();
  },

  unfreeze(memberId: string) {
    const { [memberId]: _omit, ...rest } = state.frozen;
    state.frozen = rest;
    emit();
  },

  // Dev helper: wipe everything (members + cash + freezes).
  resetAll() {
    state.cash = []; state.expenses = []; state.frozen = {};
    state.staff = defaults.staff;
    try { localStorage.removeItem("pulse.members.v1"); } catch {}
    location.reload();
  },
};

// ---- Selectors ----

export function isFrozenToday(memberId: string, now = new Date()): FreezeWindow | null {
  const w = state.frozen[memberId];
  if (!w) return null;
  const t = tzTodayISO(now);
  if (t >= w.from && t <= w.to) return w;
  return null;
}

export function cashCollectedToday(): number {
  const t = tzTodayISO();
  return state.cash
    .filter((c) => tzTodayISO(new Date(c.ts)) === t)
    .reduce((sum, c) => sum + c.amount, 0);
}

export function expensesToday(): number {
  const t = tzTodayISO();
  return state.expenses
    .filter((e) => tzTodayISO(new Date(e.ts)) === t)
    .reduce((sum, e) => sum + e.amount, 0);
}

export { PLAN_PRICES };

export function expiringValueThisWeek(): number {
  return MEMBERS.filter((m) => {
    const d = tzDaysUntil(m.subEnd);
    return d > 0 && d <= 7;
  }).reduce((sum, m) => sum + PLAN_PRICES[m.plan], 0);
}
