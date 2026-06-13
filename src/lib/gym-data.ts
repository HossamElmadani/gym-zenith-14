import {
  tzAddDaysISO, tzWeekdayName, tzDaysUntil, tzTodayISO, tzUsedPct,
} from "./gym-tz";

export type Gender = "male" | "female";

/** Plan = duration only. No tiers. Cash gym. */
export type PlanCode = "1D" | "1M" | "2M" | "3M" | "6M" | "12M";

export type SubHistory = { date: string; plan: PlanCode; months: number; amount: number };

export type Member = {
  id: string;             // permanent ID, also encoded into QR
  name: string;
  cin: string;
  phone: string;
  gender: Gender;
  age?: number;           // 👈 هذا هو السطر الجديد اللي ضفناه للعمر
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
  coachId?: string | null;
  /** Annual insurance (assurance) expiry date — ISO YYYY-MM-DD. */
  insuranceEnd?: string | null;
  photoUrl?: string | null;
};

export const PLAN_PRICES: Record<PlanCode, number> = {
  "1D": 20,
  "1M": 150,
  "2M": 300,
  "3M": 400,
  "6M": 800,
  "12M": 1500,
};

export const PLAN_MONTHS: Record<PlanCode, number> = {
  "1D": 0, "1M": 1, "2M": 2, "3M": 3, "6M": 6, "12M": 12,
};

export const PLAN_LABEL_AR: Record<PlanCode, string> = {
  "1D": "حصة واحدة (يوم واحد)",
  "1M": "شهر واحد",
  "2M": "شهران",
  "3M": "3 أشهر",
  "6M": "6 أشهر",
  "12M": "سنة كاملة",
};

// تم التغيير من EN إلى FR
export const PLAN_LABEL_FR: Record<PlanCode, string> = {
  "1D": "1 Séance (Pass Jour)",
  "1M": "1 Mois",
  "2M": "2 Mois",
  "3M": "3 Mois",
  "6M": "6 Mois",
  "12M": "1 An",
};

// We make this dynamic by fetching the current language from localStorage
export const getPlanOptions = () => {
  const lang = typeof window !== "undefined" ? localStorage.getItem("pulse.lang") || "ar" : "ar";
  // تم ربطها بالفرنسية هنا
  const labels = lang === "ar" ? PLAN_LABEL_AR : PLAN_LABEL_FR;
  
  return (["1D", "1M", "2M", "3M", "6M", "12M"] as const).map((c) => ({
    code: c,
    label: labels[c],
    months: PLAN_MONTHS[c],
    price: PLAN_PRICES[c],
  }));
};

// For backward compatibility where PLAN_OPTIONS is used directly
export const PLAN_OPTIONS = getPlanOptions();

// ---- Re-exports for backwards compatibility ----
export const daysRemaining = (endIso: string, now = new Date()) =>
  tzDaysUntil(endIso, now);

export function subStatus(endIso: string, startIso?: string): "pending" | "active" | "expiring" | "expired" {
  const today = tzTodayISO();
  if (startIso && today < startIso) return "pending";
  const d = daysRemaining(endIso);
  if (d === 0) return "expired";
  if (d <= 7) return "expiring";
  return "active";
}

export const subUsedPct = tzUsedPct;

// PHASE 9: Gender mode is no longer based on day-of-week alone.
// It is computed from the live shift matrix in Africa/Casablanca.
// Re-exported here so existing callers stay backwards-compatible.
export { currentShift as _currentShift } from "./gym-shift";
import { currentShift } from "./gym-shift";
export function todayGender(d = new Date()): "men" | "women" | "closed" {
  return currentShift(d).audience;
}

export const dayName = (d = new Date()) => tzWeekdayName(d);

export const MEMBERS: Member[] = [];

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