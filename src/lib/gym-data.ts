export type Gender = "male" | "female";

export type SubHistory = { date: string; plan: string; months: number };

export type Member = {
  id: string;
  name: string;
  cin: string;
  phone: string;
  gender: Gender;
  lastCheckIn: string; // ISO
  streak: number;
  points: number;
  plan: "Basic" | "Pro" | "Elite";
  churnRisk: number; // 0-100
  subStart: string;   // ISO
  subEnd: string;     // ISO
  subMonths: number;
  history: SubHistory[];
  recentCheckIns: string[]; // ISO dates
};

// Helper to build ISO dates relative to today
const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export function daysRemaining(endIso: string, now = new Date()): number {
  const end = new Date(endIso + "T23:59:59");
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

export function subStatus(endIso: string): "active" | "expiring" | "expired" {
  const d = daysRemaining(endIso);
  if (d === 0) return "expired";
  if (d <= 7) return "expiring";
  return "active";
}

export function subUsedPct(startIso: string, endIso: string, now = new Date()): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const total = Math.max(1, end - start);
  const used = Math.min(total, Math.max(0, now.getTime() - start));
  return Math.round((used / total) * 100);
}

const mkHistory = (months: number, count: number): SubHistory[] =>
  Array.from({ length: count }, (_, i) => ({
    date: iso(-(i + 1) * months * 30),
    plan: ["Basic", "Pro", "Elite"][i % 3],
    months,
  }));

const mkCheckIns = (offsets: number[]) => offsets.map((o) => iso(-o));

export const MEMBERS: Member[] = [
  { id: "M-1041", name: "Liam Carter",   cin: "AB123456", phone: "+212600111041", gender: "male",   lastCheckIn: iso(-2),  streak: 4,  points: 480,  plan: "Pro",   churnRisk: 12, subStart: iso(-75),  subEnd: iso(15),  subMonths: 3,  history: mkHistory(3, 2), recentCheckIns: mkCheckIns([2,4,6,9,12]) },
  { id: "M-1042", name: "Noah Bennett",  cin: "AB234567", phone: "+212600111042", gender: "male",   lastCheckIn: iso(-17), streak: 0,  points: 220,  plan: "Basic", churnRisk: 86, subStart: iso(-28),  subEnd: iso(2),   subMonths: 1,  history: mkHistory(1, 3), recentCheckIns: mkCheckIns([17,25,40]) },
  { id: "M-1043", name: "Ethan Walsh",   cin: "AB345678", phone: "+212600111043", gender: "male",   lastCheckIn: iso(-3),  streak: 9,  points: 1240, plan: "Elite", churnRisk: 6,  subStart: iso(-340), subEnd: iso(25),  subMonths: 12, history: mkHistory(12, 1), recentCheckIns: mkCheckIns([3,5,7,10,14]) },
  { id: "M-1044", name: "Marcus Kim",    cin: "AB456789", phone: "+212600111044", gender: "male",   lastCheckIn: iso(-16), streak: 0,  points: 90,   plan: "Basic", churnRisk: 78, subStart: iso(-32),  subEnd: iso(-2),  subMonths: 1,  history: mkHistory(1, 2), recentCheckIns: mkCheckIns([16,22,30]) },
  { id: "M-1045", name: "Daniel Reyes",  cin: "AB567890", phone: "+212600111045", gender: "male",   lastCheckIn: iso(-1),  streak: 12, points: 1620, plan: "Elite", churnRisk: 3,  subStart: iso(-150), subEnd: iso(40),  subMonths: 6,  history: mkHistory(6, 2), recentCheckIns: mkCheckIns([1,3,5,8,11]) },
  { id: "F-2031", name: "Ava Mitchell",  cin: "CD123456", phone: "+212600222031", gender: "female", lastCheckIn: iso(-2),  streak: 6,  points: 760,  plan: "Pro",   churnRisk: 10, subStart: iso(-80),  subEnd: iso(10),  subMonths: 3,  history: mkHistory(3, 2), recentCheckIns: mkCheckIns([2,4,7,10,13]) },
  { id: "F-2032", name: "Sophia Lin",    cin: "CD234567", phone: "+212600222032", gender: "female", lastCheckIn: iso(-18), streak: 0,  points: 310,  plan: "Basic", churnRisk: 82, subStart: iso(-29),  subEnd: iso(1),   subMonths: 1,  history: mkHistory(1, 4), recentCheckIns: mkCheckIns([18,26,33]) },
  { id: "F-2033", name: "Isabella Cruz", cin: "CD345678", phone: "+212600222033", gender: "female", lastCheckIn: iso(-4),  streak: 5,  points: 540,  plan: "Pro",   churnRisk: 18, subStart: iso(-170), subEnd: iso(20),  subMonths: 6,  history: mkHistory(6, 2), recentCheckIns: mkCheckIns([4,6,9,12,15]) },
  { id: "F-2034", name: "Mia Andersen",  cin: "CD456789", phone: "+212600222034", gender: "female", lastCheckIn: iso(-15), streak: 0,  points: 140,  plan: "Basic", churnRisk: 74, subStart: iso(-31),  subEnd: iso(0),   subMonths: 1,  history: mkHistory(1, 2), recentCheckIns: mkCheckIns([15,21,28]) },
  { id: "F-2035", name: "Zara Okafor",   cin: "CD567890", phone: "+212600222035", gender: "female", lastCheckIn: iso(-1),  streak: 14, points: 1890, plan: "Elite", churnRisk: 2,  subStart: iso(-330), subEnd: iso(35),  subMonths: 12, history: mkHistory(12, 1), recentCheckIns: mkCheckIns([1,2,4,6,8,11]) },
];

export const DEMO_MEMBER = MEMBERS[0]; // Liam Carter — male

export function todayGender(d = new Date()): "men" | "women" | "mixed" {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  if ([1, 3, 5].includes(day)) return "men";
  if ([2, 4, 6].includes(day)) return "women";
  return "mixed";
}

export function dayName(d = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

export const PEAK_HOURS = [
  { hour: "6a",  count: 12 }, { hour: "7a", count: 28 }, { hour: "8a", count: 41 },
  { hour: "9a",  count: 24 }, { hour: "10a", count: 14 }, { hour: "11a", count: 11 },
  { hour: "12p", count: 22 }, { hour: "1p", count: 18 }, { hour: "2p", count: 10 },
  { hour: "3p",  count: 14 }, { hour: "4p", count: 26 }, { hour: "5p", count: 48 },
  { hour: "6p",  count: 67 }, { hour: "7p", count: 71 }, { hour: "8p", count: 52 },
  { hour: "9p",  count: 30 }, { hour: "10p", count: 14 },
];

export const PROGRESS_DATA = [
  { day: "W1", weight: 78.4, target: 76 },
  { day: "W2", weight: 78.0, target: 76 },
  { day: "W3", weight: 77.5, target: 76 },
  { day: "W4", weight: 77.1, target: 76 },
  { day: "W5", weight: 76.6, target: 76 },
  { day: "W6", weight: 76.2, target: 76 },
];

export const WAITLISTS = [
  { id: 1, klass: "HIIT Burn",          time: "6:00 PM", waiting: 4, gender: "women" as const },
  { id: 2, klass: "Heavy Lifts 101",    time: "7:30 PM", waiting: 2, gender: "men" as const },
  { id: 3, klass: "Mobility & Recovery",time: "8:30 PM", waiting: 6, gender: "women" as const },
];
