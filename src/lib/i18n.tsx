import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

export const DICT = {
  // Sidebar / nav
  "nav.dashboard":   { ar: "الرئيسية",       en: "Dashboard" },
  "nav.members":     { ar: "الأعضاء",        en: "Members" },
  "nav.reception":   { ar: "الاستقبال",      en: "Reception" },
  "nav.onboard":     { ar: "تسجيل جديد",     en: "Onboard" },
  "nav.coaches":     { ar: "المدربون",       en: "Coaches" },
  "nav.staff":       { ar: "فريق العمل",     en: "Staff" },

  // Headings
  "head.admin.title":     { ar: "نظرة على اليوم",                en: "Today's Overview" },
  "head.admin.sub":       { ar: "الأعضاء النشطون، المداخيل والتجديدات.", en: "Active members, cash collected and renewals — at a glance." },
  "head.members.title":   { ar: "الأعضاء",                       en: "Members" },
  "head.members.sub":     { ar: "ابحث، جدّد، جمّد وتواصل مع الأعضاء.", en: "Search, renew, freeze and reach members." },
  "head.reception.title": { ar: "مكتب الاستقبال",                en: "Reception Check-in Desk" },
  "head.reception.sub":   { ar: "امسح رمز QR أو CIN للتحقق من الدخول.", en: "Scan QR or CIN to validate access." },
  "head.onboard.title":   { ar: "عضو جديد",                      en: "New Member" },
  "head.onboard.sub":     { ar: "سجّل عضوًا، استلم الكاش واطبع الإيصال.", en: "Register a member, take cash and print a receipt." },
  "head.coaches.title":   { ar: "المدربون والمجموعات",           en: "Coaches & Groups" },
  "head.coaches.sub":     { ar: "عزل تام بين مدربي الرجال والنساء لتفادي الأخطاء.", en: "Men's and Women's coaches — fully isolated to prevent human error." },
  "head.staff.title":     { ar: "فريق العمل والصلاحيات",          en: "Staff & Access" },
  "head.staff.sub":       { ar: "إدارة الحسابات والصلاحيات.",     en: "Manage who can sign in." },

  // Actions
  "action.addCoach":      { ar: "إضافة مدرب",       en: "Add Coach" },
  "action.assignMember":  { ar: "تعيين متدرب",      en: "Assign Member" },
  "action.freeze":        { ar: "تجميد",            en: "Freeze" },
  "action.checkin":       { ar: "تسجيل الدخول",     en: "Check-in" },
  "action.logCash":       { ar: "إدخال كاش",        en: "Log Cash" },

  // Metrics
  "metric.activeToday":   { ar: "حاضرون اليوم",                en: "Active today" },
  "metric.cashToday":     { ar: "مداخيل اليوم — درهم",          en: "Cash collected today" },
  "metric.expiringWeek":  { ar: "ينتهي هذا الأسبوع",           en: "Expiring this week" },
  "metric.cashFlow":      { ar: "تدفّق النقد اليوم",            en: "Today's cash flow" },

  // Shift
  "shift.men":            { ar: "الدوام الحالي: رجال",          en: "Active Shift: Men" },
  "shift.women":          { ar: "الدوام الحالي: نساء",          en: "Active Shift: Women" },
  "shift.closed":         { ar: "انتقال / مغلق",                en: "Transition / Closed" },

  // Auth
  "auth.logout":          { ar: "تسجيل الخروج",                 en: "Logout" },
  "role.owner":           { ar: "المالك",                       en: "owner" },
  "role.receptionist":    { ar: "موظف الاستقبال",               en: "receptionist" },

  // Misc
  "search.members":       { ar: "ابحث عن عضو…",                 en: "Search members…" },
  "common.notify":        { ar: "الإشعارات",                    en: "Notifications" },
} as const satisfies Dict;

export type DictKey = keyof typeof DICT;

const I18nCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: DictKey) => string;
  dir: "rtl" | "ltr";
}>({ lang: "ar", setLang: () => {}, toggle: () => {}, t: (k) => k, dir: "rtl" });

const STORAGE = "pulse.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    return (localStorage.getItem(STORAGE) as Lang) || "ar";
  });

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(STORAGE, lang); } catch {}
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === "ar" ? "en" : "ar"));
  const t = (k: DictKey) => DICT[k]?.[lang] ?? k;

  return <I18nCtx.Provider value={{ lang, setLang, toggle, t, dir }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
