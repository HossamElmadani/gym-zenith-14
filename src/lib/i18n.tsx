import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

  // Actions / buttons
  "action.addCoach":      { ar: "إضافة مدرب",       en: "Add Coach" },
  "action.assignMember":  { ar: "تعيين متدرب",      en: "Assign Member" },
  "action.freeze":        { ar: "تجميد",            en: "Freeze" },
  "action.unfreeze":      { ar: "إلغاء التجميد",    en: "Unfreeze" },
  "action.renew":         { ar: "تجديد",            en: "Renew" },
  "action.checkin":       { ar: "تسجيل الدخول",     en: "Check-in" },
  "action.logCash":       { ar: "إدخال كاش",        en: "Log Cash" },
  "action.validate":      { ar: "تحقق",             en: "Validate" },
  "action.register":      { ar: "تسجيل",            en: "Register" },
  "action.cancel":        { ar: "إلغاء",            en: "Cancel" },

  // Table headers
  "table.member":         { ar: "العضو",            en: "Member" },
  "table.cin":            { ar: "البطاقة الوطنية",   en: "CIN" },
  "table.gender":         { ar: "الجنس",            en: "Gender" },
  "table.daysLeft":       { ar: "الأيام المتبقية",  en: "Days Left" },
  "table.status":         { ar: "الحالة",           en: "Status" },
  "table.actions":        { ar: "إجراءات",          en: "Actions" },
  "table.phone":          { ar: "الهاتف",           en: "Phone" },

  // Status labels
  "status.active":        { ar: "نشط",              en: "Active" },
  "status.expiring":      { ar: "قارب الانتهاء",    en: "Expiring Soon" },
  "status.expired":       { ar: "منتهي",            en: "Expired" },
  "status.frozen":        { ar: "مجمّد",            en: "Frozen" },
  "status.paused":        { ar: "موقوف",            en: "paused" },

  // Filters
  "filter.allStatuses":   { ar: "كل الحالات",       en: "All statuses" },
  "filter.allGenders":    { ar: "كل الأجناس",       en: "All genders" },
  "gender.male":          { ar: "ذكر",              en: "Male" },
  "gender.female":        { ar: "أنثى",             en: "Female" },
  "gender.men":           { ar: "رجال",             en: "Men" },
  "gender.women":         { ar: "نساء",             en: "Women" },

  // Form fields
  "form.fullName":        { ar: "الاسم الكامل",     en: "Full name" },
  "form.phone":           { ar: "رقم الهاتف",       en: "Phone number" },
  "form.gender":          { ar: "الجنس",            en: "Gender" },
  "form.cin":             { ar: "البطاقة الوطنية",   en: "CIN / National ID" },
  "form.assignCoach":     { ar: "تعيين مدرب",       en: "Assign coach" },
  "form.startDate":       { ar: "تاريخ البدء",      en: "Start date" },
  "form.endDate":         { ar: "تاريخ الانتهاء",   en: "End date" },
  "form.plan":            { ar: "الاشتراك",         en: "Plan" },
  "form.cashAmount":      { ar: "المبلغ المدفوع (درهم)", en: "Cash amount paid (MAD)" },
  "form.selectGender":    { ar: "اختر الجنس",       en: "Select" },
  "form.none":            { ar: "— لا أحد —",       en: "— None —" },
  "form.pickGenderFirst": { ar: "اختر الجنس أولًا",  en: "Pick gender first" },
  "form.selectCoach":     { ar: "اختر مدربًا",      en: "Select a coach" },
  "form.specialty":       { ar: "التخصص",           en: "Specialty" },
  "form.targetAudience":  { ar: "الفئة المستهدفة",  en: "Target audience" },
  "form.workingDays":     { ar: "أيام العمل",       en: "Working days" },
  "form.startTime":       { ar: "وقت البدء",        en: "Start time" },
  "form.endTime":         { ar: "وقت الانتهاء",     en: "End time" },

  // Metrics
  "metric.activeToday":   { ar: "حاضرون اليوم",                en: "Active today" },
  "metric.cashToday":     { ar: "مداخيل اليوم — درهم",          en: "Cash collected today" },
  "metric.expiringWeek":  { ar: "ينتهي هذا الأسبوع",           en: "Expiring this week" },
  "metric.cashFlow":      { ar: "تدفّق النقد اليوم",            en: "Today's cash flow" },

  // Reception
  "reception.scannerTitle":   { ar: "امسح QR أو أدخل CIN / رقم العضو", en: "Scan QR or enter CIN / ID" },
  "reception.scannerLabel":   { ar: "ماسح الاستقبال",                 en: "Reception scanner" },

  // Admin
  "admin.expiringSoon":       { ar: "قارب اشتراكهم على الانتهاء",      en: "Expiring Soon" },
  "admin.noRenewals":         { ar: "لا توجد تجديدات هذا الأسبوع",     en: "No renewals due this week" },
  "admin.dueIn7":             { ar: "أعضاء يستوجبون التجديد خلال أقل من ٧ أيام", en: "Members due to renew in < 7 days" },

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
  "search.byNameCinId":   { ar: "ابحث بالاسم أو CIN أو رقم العضو…", en: "Search by name, CIN, or ID…" },
  "common.notify":        { ar: "الإشعارات",                    en: "Notifications" },
  "common.of":            { ar: "من",                           en: "of" },
} as const satisfies Dict;

export type DictKey = keyof typeof DICT;

type I18nCtxValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: DictKey) => string;
  dir: "rtl" | "ltr";
};

const I18nCtx = createContext<I18nCtxValue>({
  lang: "ar", setLang: () => {}, toggle: () => {}, t: (k) => k, dir: "rtl",
});

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
    try { localStorage.setItem(STORAGE, lang); } catch { /* ignore */ }
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((p) => (p === "ar" ? "en" : "ar")), []);
  const t = useCallback((k: DictKey) => DICT[k]?.[lang] ?? k, [lang]);

  const value = useMemo<I18nCtxValue>(
    () => ({ lang, setLang, toggle, t, dir }),
    [lang, setLang, toggle, t, dir],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
