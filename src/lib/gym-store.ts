import { useSyncExternalStore } from "react";
import {
  MEMBERS, PLAN_PRICES, PLAN_MONTHS, type Member, type PlanCode, type Gender, type SubHistory
} from "./gym-data";
import { tzAddMonthsISO, tzDaysUntil, tzTodayISO, tzStartOfTodayUTC } from "./gym-tz";
import {
  appendAttendanceLog, appendFinancialLog, appendMemberLog,
} from "./sheets-sync.functions";
import { coachStore } from "./coaches-data";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// LIVE GOOGLE SHEETS SYNC (fire-and-forget; never blocks UI)
// ---------------------------------------------------------------------------
let lastSyncError: string | null = null;
const syncListeners = new Set<() => void>();
const setSyncError = (e: string | null) => {
  if (lastSyncError === e) return;
  lastSyncError = e;
  syncListeners.forEach((l) => l());
};
export function subscribeSyncStatus(l: () => void) {
  syncListeners.add(l);
  return () => syncListeners.delete(l);
}
export function getSyncError() { return lastSyncError; }

const KIND_TO_TX: Record<string, string> = {
  registration: "Plan",
  renewal:      "Plan",
  dropin:       "1D Pass",
  insurance:    "Insurance",
  other:        "Other",
};

function coachNameFor(coachId?: string | null): string {
  if (!coachId) return "—";
  return coachStore.get(coachId)?.name ?? coachId;
}

function syncMember(m: Member) {
  appendMemberLog({ data: {
    id: m.id, name: m.name, phone: m.phone, 
    gender: m.gender === "male" ? "Homme" : "Femme",
    age: m.age ? m.age.toString() : "",
    coach: coachNameFor(m.coachId), subEnd: m.subEnd,
    insuranceEnd: m.insuranceEnd ?? "",
  } }).then(() => setSyncError(null))
    .catch((err) => { setSyncError(String(err?.message ?? err)); console.warn("[sheets sync] member", err); });
}

function syncCash(entry: { memberId?: string; memberName?: string; amount: number; kind: string; planCode?: PlanCode }) {
  const tx = entry.planCode === "1D" && (entry.kind === "registration" || entry.kind === "renewal")
    ? "1D Pass"
    : (KIND_TO_TX[entry.kind] ?? entry.kind);
  appendFinancialLog({ data: {
    date: new Date().toISOString(),
    id: entry.memberId || "—",
    memberName: entry.memberName ?? "—",
    transactionType: tx,
    amount: entry.amount,
  } }).then(() => setSyncError(null))
    .catch((err) => { setSyncError(String(err?.message ?? err)); console.warn("[sheets sync] cash", err); });
}

function syncAttendance(id: string, personName: string, role: "Member" | "Coach") {
  appendAttendanceLog({ data: {
    dateTime: new Date().toISOString(),
    id: id,
    personName, role,
  } }).then(() => setSyncError(null))
    .catch((err) => { setSyncError(String(err?.message ?? err)); console.warn("[sheets sync] attendance", err); });
}

// ---------------------------------------------------------------------------
// PERSISTENCE LAYER (Supabase implementation)
// ---------------------------------------------------------------------------

export type CashEntry = {
  id: string;
  ts: string;
  memberId?: string;
  memberName?: string;
  amount: number;             // MAD
  kind: "registration" | "renewal" | "dropin" | "insurance" | "other";
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

export type CheckIn = {
  id: string;
  personId: string;
  name: string;
  role: "Member" | "Coach";
  gender?: "male" | "female";
  ts: number;
  photoUrl?: string | null;
};

type Persisted = {
  cash: CashEntry[];
  expenses: ExpenseEntry[];
  frozen: Record<string, FreezeWindow>;
  staff: StaffMember[];
  checkIns: CheckIn[];
};

const state: Persisted & { v: number } = {
  cash: [],
  expenses: [],
  frozen: {},
  staff: [],
  checkIns: [],
  v: 0
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

type View = Persisted & { v: number };

export function useGymStore<T>(selector: (s: View) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// ---- Helper Date Calculations for local memory mapping ----
function calculateDaysSince(isoDate: string): number {
  if (!isoDate) return 999;
  const today = tzTodayISO();
  const a = new Date(`${isoDate}T00:00:00Z`).getTime();
  const b = new Date(`${today}T00:00:00Z`).getTime();
  return Math.max(0, Math.ceil((b - a) / 86_400_000));
}

function calculateChurnRisk(lastCheckIn: string): number {
  const days = calculateDaysSince(lastCheckIn);
  if (days >= 30) return 95;
  if (days >= 14) return 80;
  if (days >= 7) return 50;
  if (days >= 4) return 20;
  return 5;
}

function calculateStreak(checkIns: string[]): number {
  if (checkIns.length === 0) return 0;
  const daysSinceLast = calculateDaysSince(checkIns[0]);
  if (daysSinceLast > 1) return 0; // Streak broken if no check-in yesterday or today
  
  let streak = 1;
  for (let i = 1; i < checkIns.length; i++) {
    const diff = Math.max(0, Math.ceil((new Date(`${checkIns[i-1]}T00:00:00Z`).getTime() - new Date(`${checkIns[i]}T00:00:00Z`).getTime()) / 86_400_000));
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

// ---- State Hydration ----
export async function initGymStore() {
  try {
    // 0. Hydrate coaches from Supabase
    await coachStore.init();

    // 1. Fetch members
    const { data: dbMembers, error: membersError } = await supabase
      .from("members")
      .select("*");
    if (membersError) throw membersError;

    // 2. Fetch renewals
    const { data: dbRenewals, error: renewalsError } = await supabase
      .from("member_renewals")
      .select("*");
    if (renewalsError) throw renewalsError;

    // 3. Fetch attendance
    const { data: dbAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .order("check_in_time", { ascending: false });
    if (attendanceError) throw attendanceError;

    // Fetch today's check-ins from Supabase
    const startOfToday = tzStartOfTodayUTC();
    const { data: dbTodayAttendance, error: todayAttendanceError } = await supabase
      .from("attendance")
      .select("*")
      .gte("check_in_time", startOfToday)
      .order("check_in_time", { ascending: false });
    if (todayAttendanceError) throw todayAttendanceError;

    // 4. Fetch cash logs
    const { data: dbCash, error: cashError } = await supabase
      .from("cash_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (cashError) throw cashError;

    // 5. Fetch freezes
    const { data: dbFreezes, error: freezesError } = await supabase
      .from("freezes")
      .select("*");
    if (freezesError) throw freezesError;

    // --- Process child collections ---
    const renewalsByMember: Record<string, SubHistory[]> = {};
    dbRenewals?.forEach((r) => {
      if (!renewalsByMember[r.member_id]) {
        renewalsByMember[r.member_id] = [];
      }
      renewalsByMember[r.member_id].push({
        date: r.date,
        plan: r.plan as PlanCode,
        months: r.months,
        amount: Number(r.amount),
      });
    });

    const attendanceByMember: Record<string, string[]> = {};
    dbAttendance?.forEach((a) => {
      if (a.person_type === "member") {
        if (!attendanceByMember[a.person_id]) {
          attendanceByMember[a.person_id] = [];
        }
        attendanceByMember[a.person_id].push(a.check_in_time.slice(0, 10));
      }
    });

    // --- Map members to local schema ---
    const mappedMembers: Member[] = (dbMembers || []).map((m) => {
      const history = renewalsByMember[m.id] || [];
      const recentCheckIns = attendanceByMember[m.id] || [];
      const lastCheckIn = recentCheckIns[0] || m.sub_start;
      const streak = calculateStreak(recentCheckIns);
      const points = recentCheckIns.length * 10;
      const churnRisk = calculateChurnRisk(lastCheckIn);

      return {
        id: m.id,
        name: m.name,
        cin: m.cin,
        phone: m.phone,
        gender: m.gender as Gender,
        age: m.age ?? undefined,
        lastCheckIn,
        streak,
        points,
        plan: m.current_plan as PlanCode,
        churnRisk,
        subStart: m.sub_start,
        subEnd: m.sub_end,
        subMonths: m.sub_months,
        history,
        recentCheckIns,
        createdAt: m.sub_start,
        coachId: m.coach_id,
        insuranceEnd: m.insurance_end,
        photoUrl: m.photo_url,
      };
    });

    // Mutate global MEMBERS array in-place
    MEMBERS.splice(0, MEMBERS.length, ...mappedMembers);

    // --- Map cash logs to local schema ---
    const mappedCash: CashEntry[] = (dbCash || []).map((c) => {
      const member = mappedMembers.find((m) => m.id === c.member_id);
      return {
        id: c.id,
        ts: c.created_at,
        memberId: c.member_id || undefined,
        memberName: member?.name,
        amount: Number(c.amount),
        kind: c.transaction_type as CashEntry["kind"],
        planCode: (c.plan_code as PlanCode) || undefined,
        note: c.note || undefined,
      };
    });

    // --- Map freezes to local schema ---
    const mappedFrozen: Record<string, FreezeWindow> = {};
    (dbFreezes || []).forEach((f) => {
      mappedFrozen[f.member_id] = {
        from: f.freeze_start,
        to: f.freeze_end,
      };
    });

    const mappedCheckIns: CheckIn[] = (dbTodayAttendance || []).map((a) => {
      const isMember = a.person_type === "member";
      if (isMember) {
        const member = mappedMembers.find((m) => m.id === a.person_id);
        return {
          id: a.id,
          personId: a.person_id,
          name: member ? member.name : "Member",
          role: "Member" as const,
          gender: member?.gender,
          ts: new Date(a.check_in_time).getTime(),
          photoUrl: member?.photoUrl || null,
        };
      } else {
        const coach = coachStore.list().find((c) => c.id === a.person_id);
        return {
          id: a.id,
          personId: a.person_id,
          name: coach ? coach.name : "Coach",
          role: "Coach" as const,
          ts: new Date(a.check_in_time).getTime(),
          photoUrl: coach?.photoUrl || null,
        };
      }
    });

    // Hydrate state
    state.cash = mappedCash;
    state.frozen = mappedFrozen;
    state.checkIns = mappedCheckIns;

    // Trigger reactivity in UI
    emit();
  } catch (err) {
    console.error("Error initializing gym store:", err);
  }
}

// ---- API ----

export const gymStore = {
  getState: () => state,

  async logCash(entry: Omit<CashEntry, "id" | "ts"> & { ts?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("cash_logs")
      .insert({
        member_id: entry.memberId || null,
        transaction_type: entry.kind,
        amount: entry.amount,
        processed_by: user?.id || null,
        plan_code: entry.planCode || null,
        note: entry.note || null,
      })
      .select()
      .single();

    if (error) throw error;

    state.cash = [
      {
        id: data.id,
        ts: data.created_at,
        memberId: entry.memberId,
        memberName: entry.memberName,
        amount: entry.amount,
        kind: entry.kind,
        planCode: entry.planCode,
        note: entry.note,
      },
      ...state.cash,
    ];
    emit();

    syncCash({ memberId: entry.memberId, memberName: entry.memberName, amount: entry.amount, kind: entry.kind, planCode: entry.planCode });
  },

  async logExpense(entry: Omit<ExpenseEntry, "id" | "ts"> & { ts?: string }) {
    // Keep local expenses since they are not on Supabase schema
    state.expenses = [
      { id: crypto.randomUUID(), ts: entry.ts ?? new Date().toISOString(), ...entry },
      ...state.expenses,
    ];
    emit();
  },

  // ----- Member operations -----

  async addMember(m: Omit<Member, "history" | "recentCheckIns" | "createdAt" | "lastCheckIn" | "streak" | "points" | "churnRisk"> & {
    history?: Member["history"];
    photoFile?: File;
  }): Promise<Member> {
    const { photoFile, ...memberFields } = m;
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

    const { error } = await supabase
      .from("members")
      .insert({
        id: memberFields.id,
        name: memberFields.name,
        cin: memberFields.cin,
        phone: memberFields.phone,
        gender: memberFields.gender,
        age: memberFields.age || null,
        current_plan: memberFields.plan,
        sub_start: memberFields.subStart,
        sub_end: memberFields.subEnd,
        sub_months: memberFields.subMonths,
        insurance_end: memberFields.insuranceEnd || null,
        coach_id: memberFields.coachId || null,
        photo_url: photoUrl,
      });

    if (error) throw error;

    const full: Member = {
      streak: 0,
      points: 0,
      churnRisk: 0,
      lastCheckIn: tzTodayISO(),
      createdAt: tzTodayISO(),
      history: memberFields.history ?? [],
      recentCheckIns: [],
      age: memberFields.age,
      photoUrl: photoUrl || undefined,
      ...memberFields,
    };
    MEMBERS.unshift(full);
    emit();

    syncMember(full);
    return full;
  },

  async assignCoach(memberId: string, coachId: string | null) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;

    const { error } = await supabase
      .from("members")
      .update({ coach_id: coachId })
      .eq("id", memberId);

    if (error) throw error;

    m.coachId = coachId;
    emit();
    syncMember(m);
  },

  async renewMember(memberId: string, planCode: PlanCode, amountPaid: number): Promise<Member | null> {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return null;

    const today = tzTodayISO();
    const base = m.subEnd > today ? m.subEnd : today;
    const newEnd = tzAddMonthsISO(base, PLAN_MONTHS[planCode]);
    const months = PLAN_MONTHS[planCode];

    const { error } = await supabase.rpc("renew_member", {
      p_member_id: memberId,
      p_new_sub_end: newEnd,
      p_plan: planCode,
      p_months: months,
      p_amount: amountPaid
    });

    if (error) throw error;

    m.subStart = today;
    m.subEnd = newEnd;
    m.subMonths = months;
    m.plan = planCode;
    m.history = [
      { date: today, plan: planCode, months: months, amount: amountPaid },
      ...m.history,
    ];

    // Create optimistic local cash entry
    const { data: { user } } = await supabase.auth.getUser();
    state.cash = [
      {
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        memberId: m.id,
        memberName: m.name,
        amount: amountPaid,
        kind: "renewal",
        planCode,
        note: `Renewal · ${planCode}`,
      },
      ...state.cash,
    ];
    
    emit();
    syncMember(m);
    syncCash({ memberId: m.id, memberName: m.name, amount: amountPaid, kind: "renewal", planCode });
    return m;
  },

  async recordCheckIn(memberId: string) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;

    // Check if check-in already exists in local state
    const alreadyCheckedIn = state.checkIns.some(
      (c) => c.personId === memberId && c.role === "Member"
    );
    if (alreadyCheckedIn) return;

    const startOfToday = tzStartOfTodayUTC();

    // Query the attendance table for today
    const { data: existing, error: checkError } = await supabase
      .from("attendance")
      .select("id")
      .eq("person_id", memberId)
      .eq("person_type", "member")
      .gte("check_in_time", startOfToday);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      // Already checked in today, load it into local state if not present
      const firstExisting = existing[0];
      const newCheckIn: CheckIn = {
        id: firstExisting.id,
        personId: memberId,
        name: m.name,
        role: "Member",
        gender: m.gender,
        ts: Date.now(),
        photoUrl: m.photoUrl,
      };
      state.checkIns = [newCheckIn, ...state.checkIns];
      emit();
      return;
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        person_id: memberId,
        person_type: "member",
        check_in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    m.lastCheckIn = tzTodayISO();
    m.recentCheckIns = [tzTodayISO(), ...m.recentCheckIns].slice(0, 20);
    m.streak = calculateStreak(m.recentCheckIns);
    m.points = m.recentCheckIns.length * 10;
    m.churnRisk = calculateChurnRisk(m.lastCheckIn);

    const newCheckIn: CheckIn = {
      id: data.id,
      personId: memberId,
      name: m.name,
      role: "Member",
      gender: m.gender,
      ts: new Date(data.check_in_time).getTime(),
      photoUrl: m.photoUrl,
    };
    state.checkIns = [newCheckIn, ...state.checkIns];
    
    emit();
    syncAttendance(m.id, m.name, "Member");
  },

  async recordCoachAttendance(coachId: string, coachName: string) {
    const alreadyCheckedIn = state.checkIns.some(
      (c) => c.personId === coachId && c.role === "Coach"
    );
    if (alreadyCheckedIn) return;

    const coach = coachStore.list().find((c) => c.id === coachId);
    const startOfToday = tzStartOfTodayUTC();

    // Query the attendance table for today
    const { data: existing, error: checkError } = await supabase
      .from("attendance")
      .select("id")
      .eq("person_id", coachId)
      .eq("person_type", "coach")
      .gte("check_in_time", startOfToday);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      const firstExisting = existing[0];
      const newCheckIn: CheckIn = {
        id: firstExisting.id,
        personId: coachId,
        name: coachName,
        role: "Coach",
        ts: Date.now(),
        photoUrl: coach?.photoUrl,
      };
      state.checkIns = [newCheckIn, ...state.checkIns];
      emit();
      return;
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        person_id: coachId,
        person_type: "coach",
        check_in_time: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const newCheckIn: CheckIn = {
      id: data.id,
      personId: coachId,
      name: coachName,
      role: "Coach",
      ts: new Date(data.check_in_time).getTime(),
      photoUrl: coach?.photoUrl,
    };
    state.checkIns = [newCheckIn, ...state.checkIns];

    emit();
    syncAttendance(coachId, coachName, "Coach");
  },

  async freezeMember(memberId: string, win: FreezeWindow) {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) return;

    const days = Math.max(0, Math.round(
      (new Date(win.to).getTime() - new Date(win.from).getTime()) / 86_400_000,
    ));
    m.subEnd = tzAddMonthsISO(m.subEnd, 0);
    const [y, mo, d] = m.subEnd.split("-").map(Number);
    const end = new Date(Date.UTC(y, mo - 1, d));
    end.setUTCDate(end.getUTCDate() + days);
    const newEnd = end.toISOString().slice(0, 10);

    const { error: freezeError } = await supabase
      .from("freezes")
      .insert({
        member_id: memberId,
        freeze_start: win.from,
        freeze_end: win.to
      });
    if (freezeError) throw freezeError;

    const { error: memberError } = await supabase
      .from("members")
      .update({ sub_end: newEnd })
      .eq("id", memberId);
    if (memberError) throw memberError;

    m.subEnd = newEnd;
    state.frozen = { ...state.frozen, [memberId]: win };
    emit();
    syncMember(m);
  },

  async unfreeze(memberId: string) {
    const { error } = await supabase
      .from("freezes")
      .delete()
      .eq("member_id", memberId);
    if (error) throw error;

    const { [memberId]: _omit, ...rest } = state.frozen;
    state.frozen = rest;
    emit();
  },

  async updateMember(
    memberId: string,
    updates: Partial<Member>,
    newPhotoFile?: File
  ): Promise<Member> {
    const m = MEMBERS.find((x) => x.id === memberId);
    if (!m) throw new Error("Member not found");

    let photoUrl = m.photoUrl;

    if (newPhotoFile) {
      const fileExt = newPhotoFile.name.split('.').pop() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, newPhotoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      photoUrl = publicUrl;
    }

    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.cin !== undefined) dbUpdates.cin = updates.cin;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.age !== undefined) dbUpdates.age = updates.age || null;
    if (updates.coachId !== undefined) dbUpdates.coach_id = updates.coachId || null;
    if (newPhotoFile) dbUpdates.photo_url = photoUrl;

    const { error } = await supabase
      .from("members")
      .update(dbUpdates)
      .eq("id", memberId);

    if (error) throw error;

    if (updates.name !== undefined) m.name = updates.name;
    if (updates.phone !== undefined) m.phone = updates.phone;
    if (updates.cin !== undefined) m.cin = updates.cin;
    if (updates.gender !== undefined) m.gender = updates.gender;
    if (updates.age !== undefined) m.age = updates.age;
    if (updates.coachId !== undefined) m.coachId = updates.coachId;
    if (newPhotoFile) m.photoUrl = photoUrl;

    emit();
    syncMember(m);
    return m;
  },

  async resetAll() {
    await supabase.from("freezes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("member_renewals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("cash_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("attendance").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("members").delete().neq("id", "");
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