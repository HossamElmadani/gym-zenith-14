// All date/time logic in the app routes through this module so we can swap
// the implementation (e.g. to a real backend) without touching components.
// Strict timezone: Africa/Casablanca.

export const APP_TZ = "Africa/Casablanca";

const partsOf = (d: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    hour: get("hour"),
    minute: get("minute"),
  };
};

/** Today's date as YYYY-MM-DD in Casablanca. */
export function tzTodayISO(d = new Date()): string {
  const { year, month, day } = partsOf(d);
  return `${year}-${month}-${day}`;
}

/** Offset today's Casablanca date by N days, return YYYY-MM-DD. */
export function tzAddDaysISO(days: number, d = new Date()): string {
  const base = new Date(`${tzTodayISO(d)}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Add N months to an ISO date (YYYY-MM-DD), returning ISO date. */
export function tzAddMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + months);
  return dt.toISOString().slice(0, 10);
}

/** Day-of-week index (0 Sun..6 Sat) in Casablanca. */
export function tzDayOfWeek(d = new Date()): number {
  const map: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };
  return map[partsOf(d).weekday] ?? new Date(d).getDay();
}

/** Full weekday name in Casablanca (مترجم حسب لغة التطبيق). */
export function tzWeekdayName(d = new Date()): string {
  // جلب اللغة الحالية من localStorage
  const lang = typeof window !== "undefined" ? localStorage.getItem("pulse.lang") || "ar" : "ar";
  const locale = lang === "ar" ? "ar-MA" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TZ,
    weekday: "long",
  }).format(d);
}

/** Days between today (Casablanca) and an ISO date (>=0). */
export function tzDaysUntil(iso: string, now = new Date()): number {
  const today = tzTodayISO(now);
  const a = new Date(`${today}T00:00:00Z`).getTime();
  const b = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.max(0, Math.ceil((b - a) / 86_400_000));
}

/** Used percentage between start and end ISO dates, evaluated today. */
export function tzUsedPct(startIso: string, endIso: string, now = new Date()): number {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  const today = new Date(`${tzTodayISO(now)}T00:00:00Z`).getTime();
  const total = Math.max(1, end - start);
  const used = Math.min(total, Math.max(0, today - start));
  return Math.round((used / total) * 100);
}

/** Human readable date in Casablanca. */
export function tzFormatDate(iso: string, opts: Intl.DateTimeFormatOptions = {
  day: "numeric", month: "long", year: "numeric",
}): string {
  // جلب اللغة الحالية للموقع من المتصفح
  const lang = typeof window !== "undefined" ? localStorage.getItem("pulse.lang") || "ar" : "ar";
  const locale = lang === "ar" ? "ar-MA" : "en-US";

  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: APP_TZ })
    .format(new Date(`${iso}T12:00:00Z`));
}

/** Time hh:mm in Casablanca for a Date. */
export function tzFormatTime(d = new Date()): string {
  const { hour, minute } = partsOf(d);
  return `${hour}:${minute}`;
}
