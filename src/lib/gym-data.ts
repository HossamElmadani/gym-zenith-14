import {
  tzAddDaysISO, tzDayOfWeek, tzWeekdayName, tzDaysUntil, tzTodayISO, tzUsedPct,
} from "./gym-tz";

export type Gender = "male" | "female";

/** Plan = duration only. No tiers. Cash gym. */
export type PlanCode = "1M" | "3M" | "6M" | "12M";

export type SubHistory = { date: string; plan: PlanCode; months: number; amount: number };

export type Member = {
  id: string;             // permanent ID, also encoded into QR
  name: string;
  cin: string;
  phone: string;
  gender: Gender;
  lastCheckIn: string;    // ISO date (Africa/Casablanca)
  streak: number;
  points: number;
  plan: PlanCode;
  churnRisk: number;
  subStart: string;
  subEnd: string;
  subMonths: number;
  history: SubHistory[];
  recentCheckIns: string[];
  createdAt: string;
};

export const PLAN_PRICES: Record<PlanCode, number> = {
  "1M": 250,
  "3M": 600,
  "6M": 1000,
  "12M": 1800,
};

export const PLAN_MONTHS: Record<PlanCode, number> = {
  "1M": 1, "3M": 3, "6M": 6, "12M": 12,
};

export const PLAN_LABEL: Record<PlanCode, string> = {
  "1M": "1 Month",
  "3M": "3 Months",
  "6M": "6 Months",
  "12M": "1 Year",
};

export const PLAN_OPTIONS: { code: PlanCode; label: string; months: number; price: number }[] = (
  ["1M", "3M", "6M", "12M"] as const
).map((c) => ({ code: c, label: PLAN_LABEL[c], months: PLAN_MONTHS[c], price: PLAN_PRICES[c] }));

// ---- Re-exports for backwards compatibility ----
export const daysRemaining = (endIso: string, now = new Date()) =>
  tzDaysUntil(endIso, now);

export function subStatus(endIso: string): "active" | "expiring" | "expired" {
  const d = daysRemaining(endIso);
  if (d === 0) return "expired";
  if (d <= 7) return "expiring";
  return "active";
}

export const subUsedPct = tzUsedPct;

export function todayGender(d = new Date()): "men" | "women" | "mixed" {
  const day = tzDayOfWeek(d);
  if ([1, 3, 5].includes(day)) return "men";
  if ([2, 4, 6].includes(day)) return "women";
  return "mixed";
}

export const dayName = (d = new Date()) => tzWeekdayName(d);

// ---- Seed members (used only when localStorage is empty) ----
const mkHistory = (plan: PlanCode, count: number): SubHistory[] =>
  Array.from({ length: count }, (_, i) => ({
    date: tzAddDaysISO(-(i + 1) * PLAN_MONTHS[plan] * 30),
    plan,
    months: PLAN_MONTHS[plan],
    amount: PLAN_PRICES[plan],
  }));

const mkCheckIns = (offsets: number[]) => offsets.map((o) => tzAddDaysISO(-o));

const seed = (): Member[] => [
  { id: "M-1041", name: "Liam Carter",   cin: "AB123456", phone: "+212600111041", gender: "male",   lastCheckIn: tzAddDaysISO(-2),  streak: 4,  points: 480,  plan: "3M",  churnRisk: 12, subStart: tzAddDaysISO(-75),  subEnd: tzAddDaysISO(15),  subMonths: 3,  history: mkHistory("3M", 2),  recentCheckIns: mkCheckIns([2,4,6,9,12]),  createdAt: tzAddDaysISO(-75) },
  { id: "M-1042", name: "Noah Bennett",  cin: "AB234567", phone: "+212600111042", gender: "male",   lastCheckIn: tzAddDaysISO(-17), streak: 0,  points: 220,  plan: "1M",  churnRisk: 86, subStart: tzAddDaysISO(-28),  subEnd: tzAddDaysISO(2),   subMonths: 1,  history: mkHistory("1M", 3),  recentCheckIns: mkCheckIns([17,25,40]),    createdAt: tzAddDaysISO(-90) },
  { id: "M-1043", name: "Ethan Walsh",   cin: "AB345678", phone: "+212600111043", gender: "male",   lastCheckIn: tzAddDaysISO(-3),  streak: 9,  points: 1240, plan: "12M", churnRisk: 6,  subStart: tzAddDaysISO(-340), subEnd: tzAddDaysISO(25),  subMonths: 12, history: mkHistory("12M", 1), recentCheckIns: mkCheckIns([3,5,7,10,14]),  createdAt: tzAddDaysISO(-340) },
  { id: "M-1044", name: "Marcus Kim",    cin: "AB456789", phone: "+212600111044", gender: "male",   lastCheckIn: tzAddDaysISO(-16), streak: 0,  points: 90,   plan: "1M",  churnRisk: 78, subStart: tzAddDaysISO(-32),  subEnd: tzAddDaysISO(-2),  subMonths: 1,  history: mkHistory("1M", 2),  recentCheckIns: mkCheckIns([16,22,30]),    createdAt: tzAddDaysISO(-60) },
  { id: "M-1045", name: "Daniel Reyes",  cin: "AB567890", phone: "+212600111045", gender: "male",   lastCheckIn: tzAddDaysISO(-1),  streak: 12, points: 1620, plan: "6M",  churnRisk: 3,  subStart: tzAddDaysISO(-150), subEnd: tzAddDaysISO(40),  subMonths: 6,  history: mkHistory("6M", 2),  recentCheckIns: mkCheckIns([1,3,5,8,11]),   createdAt: tzAddDaysISO(-150) },
  { id: "F-2031", name: "Ava Mitchell",  cin: "CD123456", phone: "+212600222031", gender: "female", lastCheckIn: tzAddDaysISO(-2),  streak: 6,  points: 760,  plan: "3M",  churnRisk: 10, subStart: tzAddDaysISO(-80),  subEnd: tzAddDaysISO(10),  subMonths: 3,  history: mkHistory("3M", 2),  recentCheckIns: mkCheckIns([2,4,7,10,13]),  createdAt: tzAddDaysISO(-80) },
  { id: "F-2032", name: "Sophia Lin",    cin: "CD234567", phone: "+212600222032", gender: "female", lastCheckIn: tzAddDaysISO(-18), streak: 0,  points: 310,  plan: "1M",  churnRisk: 82, subStart: tzAddDaysISO(-29),  subEnd: tzAddDaysISO(1),   subMonths: 1,  history: mkHistory("1M", 4),  recentCheckIns: mkCheckIns([18,26,33]),    createdAt: tzAddDaysISO(-120) },
  { id: "F-2033", name: "Isabella Cruz", cin: "CD345678", phone: "+212600222033", gender: "female", lastCheckIn: tzAddDaysISO(-4),  streak: 5,  points: 540,  plan: "6M",  churnRisk: 18, subStart: tzAddDaysISO(-170), subEnd: tzAddDaysISO(20),  subMonths: 6,  history: mkHistory("6M", 2),  recentCheckIns: mkCheckIns([4,6,9,12,15]),  createdAt: tzAddDaysISO(-170) },
  { id: "F-2034", name: "Mia Andersen",  cin: "CD456789", phone: "+212600222034", gender: "female", lastCheckIn: tzAddDaysISO(-15), streak: 0,  points: 140,  plan: "1M",  churnRisk: 74, subStart: tzAddDaysISO(-31),  subEnd: tzAddDaysISO(0),   subMonths: 1,  history: mkHistory("1M", 2),  recentCheckIns: mkCheckIns([15,21,28]),    createdAt: tzAddDaysISO(-60) },
  { id: "F-2035", name: "Zara Okafor",   cin: "CD567890", phone: "+212600222035", gender: "female", lastCheckIn: tzAddDaysISO(-1),  streak: 14, points: 1890, plan: "12M", churnRisk: 2,  subStart: tzAddDaysISO(-330), subEnd: tzAddDaysISO(35),  subMonths: 12, history: mkHistory("12M", 1), recentCheckIns: mkCheckIns([1,2,4,6,8,11]), createdAt: tzAddDaysISO(-330) },
];

// Mutable in-place; persisted via gymStore.
const MEMBERS_KEY = "pulse.members.v1";

function hydrate(): Member[] {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(MEMBERS_KEY);
    if (raw) return JSON.parse(raw) as Member[];
  } catch {}
  return seed();
}

export const MEMBERS: Member[] = hydrate();

export function persistMembers() {
  try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(MEMBERS)); } catch {}
}

export function resetMembers() {
  MEMBERS.splice(0, MEMBERS.length, ...seed());
  persistMembers();
}

export const DEMO_MEMBER = MEMBERS[0];

/** Build a stable QR payload for a member — encodes permanent ID + CIN. */
export function memberQrPayload(m: Pick<Member, "id" | "cin">): string {
  return `PULSE|${m.id}|${m.cin}`;
}

// Static today-data (left for any legacy reference). The dashboard no longer
// uses these.
export const PROGRESS_DATA = [
  { day: "W1", weight: 78.4, target: 76 },
  { day: "W2", weight: 78.0, target: 76 },
  { day: "W3", weight: 77.5, target: 76 },
  { day: "W4", weight: 77.1, target: 76 },
  { day: "W5", weight: 76.6, target: 76 },
  { day: "W6", weight: 76.2, target: 76 },
];

export { tzTodayISO };
