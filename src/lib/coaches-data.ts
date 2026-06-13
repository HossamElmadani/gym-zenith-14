// Coach data + persistence (Phase 8/10 — Gender-Isolated Coach & Group Management)
import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

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
  photoUrl?: string | null;
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

const state: { coaches: Coach[]; v: number } = { coaches: [], v: 0 };
const listeners = new Set<() => void>();
const emit = () => { state.v += 1; listeners.forEach((l) => l()); };

export const coachStore = {
  list: () => state.coaches,
  get: (id: string) => state.coaches.find((c) => c.id === id),

  async init() {
    try {
      const { data: dbCoaches, error } = await supabase
        .from("coaches")
        .select("*")
        .order("joined_at", { ascending: false });

      if (error) throw error;

      state.coaches = (dbCoaches || []).map((c) => ({
        id: c.id,
        name: c.name,
        audience: c.audience as CoachAudience,
        specialty: c.specialty,
        workingDays: (c.working_days || []) as Weekday[],
        startTime: c.start_time || "",
        endTime: c.end_time || "",
        createdAt: c.joined_at + "T00:00:00.000Z",
        joinedAt: c.joined_at,
        status: c.status as CoachStatus,
        photoUrl: c.photo_url,
      }));
      emit();
    } catch (err) {
      console.error("Error initializing coaches:", err);
    }
  },

  async add(input: Omit<Coach, "id" | "createdAt" | "joinedAt" | "status"> & { joinedAt?: string; status?: CoachStatus; photoFile?: File }) {
    const { photoFile, ...coachFields } = input;
    let photoUrl: string | null = null;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, photoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      photoUrl = publicUrl;
    }

    const coach: Coach = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      joinedAt: coachFields.joinedAt ?? new Date().toISOString().slice(0, 10),
      status: coachFields.status ?? "active",
      photoUrl,
      ...coachFields,
    };

    try {
      const { data: dbCoach, error: dbError } = await supabase
        .from("coaches")
        .insert({
          name: coachFields.name,
          audience: coachFields.audience,
          specialty: coachFields.specialty,
          working_days: coachFields.workingDays,
          start_time: coachFields.startTime,
          end_time: coachFields.endTime,
          joined_at: coach.joinedAt,
          status: coach.status,
          photo_url: photoUrl
        })
        .select()
        .single();

      if (dbError) {
        console.error("Error inserting coach to Supabase:", dbError);
      } else if (dbCoach) {
        coach.id = dbCoach.id;
      }
    } catch (dbErr) {
      console.error("Failed database insert for coach:", dbErr);
    }

    state.coaches = [coach, ...state.coaches];
    emit();
    return coach;
  },
  archive(id: string) {
    state.coaches = state.coaches.map((c) => (c.id === id ? { ...c, status: "archived" as const } : c));
    emit();
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
