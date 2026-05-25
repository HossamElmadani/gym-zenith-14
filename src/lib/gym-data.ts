export type Gender = "male" | "female";

export type Member = {
  id: string;
  name: string;
  gender: Gender;
  lastCheckIn: string; // ISO
  streak: number;
  points: number;
  plan: "Basic" | "Pro" | "Elite";
  churnRisk: number; // 0-100
};

export const MEMBERS: Member[] = [
  { id: "M-1041", name: "Liam Carter",      gender: "male",   lastCheckIn: "2026-05-23", streak: 4,  points: 480, plan: "Pro",   churnRisk: 12 },
  { id: "M-1042", name: "Noah Bennett",     gender: "male",   lastCheckIn: "2026-05-08", streak: 0,  points: 220, plan: "Basic", churnRisk: 86 },
  { id: "M-1043", name: "Ethan Walsh",      gender: "male",   lastCheckIn: "2026-05-22", streak: 9,  points: 1240, plan: "Elite", churnRisk: 6 },
  { id: "M-1044", name: "Marcus Kim",       gender: "male",   lastCheckIn: "2026-05-09", streak: 0,  points: 90,  plan: "Basic", churnRisk: 78 },
  { id: "M-1045", name: "Daniel Reyes",     gender: "male",   lastCheckIn: "2026-05-24", streak: 12, points: 1620, plan: "Elite", churnRisk: 3 },
  { id: "F-2031", name: "Ava Mitchell",     gender: "female", lastCheckIn: "2026-05-23", streak: 6,  points: 760, plan: "Pro",   churnRisk: 10 },
  { id: "F-2032", name: "Sophia Lin",       gender: "female", lastCheckIn: "2026-05-07", streak: 0,  points: 310, plan: "Basic", churnRisk: 82 },
  { id: "F-2033", name: "Isabella Cruz",    gender: "female", lastCheckIn: "2026-05-21", streak: 5,  points: 540, plan: "Pro",   churnRisk: 18 },
  { id: "F-2034", name: "Mia Andersen",     gender: "female", lastCheckIn: "2026-05-10", streak: 0,  points: 140, plan: "Basic", churnRisk: 74 },
  { id: "F-2035", name: "Zara Okafor",      gender: "female", lastCheckIn: "2026-05-24", streak: 14, points: 1890, plan: "Elite", churnRisk: 2 },
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
