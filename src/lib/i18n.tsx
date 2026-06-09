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
  "form.cin":             { ar: "رقم البطاقة الوطنية (CIN)", en: "CIN / National ID" },
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

  // Onboard specific (New additions)
  "onboard.identity":       { ar: "هوية العضو",                  en: "Member identity" },
  "onboard.identitySub":    { ar: "البيانات الأساسية وأوقات الدخول.", en: "Core personal details and access schedule." },
  "onboard.namePlaceholder":{ ar: "مثال: أحمد العلمي",             en: "e.g. Sofia Martin" },
  "onboard.planCash":       { ar: "الاشتراك والصندوق",           en: "Plan & cash" },
  "onboard.planCashSub":    { ar: "تاريخ الانتهاء يُحسب أوتوماتيكياً.", en: "End date auto-calculates from start + plan." },
  "onboard.genderHelper":   { ar: "اختيار الجنس يحدد أوقات الدخول التلقائية.", en: "Selecting a gender assigns the weekly access schedule." },
  "onboard.coachHelper":    { ar: "قائمة المدربين تُفلتر بناءً على الجنس المختار.", en: "Coach list filters automatically once a gender is selected." },
  "onboard.picture":        { ar: "الصورة الشخصية (اختياري)",    en: "Profile picture (optional)" },
  "onboard.upload":         { ar: "اسحب الصورة أو اضغط للرفع",    en: "Drop image or click to upload" },
  "onboard.uploadSub":      { ar: "PNG · JPG · حتى 5 ميجابايت",  en: "PNG · JPG · up to 5MB" },
  "onboard.cashRequired":   { ar: "إجباري. الأداء نقداً فقط.",    en: "Required. Cash-only gym — no card, no transfer." },
  "onboard.ready":          { ar: "جاهز للتسجيل؟",                en: "Ready to register?" },
  "onboard.readySub":       { ar: "تأكد من استلام المبلغ، ثم اضغط تسجيل.", en: "Fill all fields, confirm cash, then press Register." },
  "onboard.registering":    { ar: "جاري التسجيل…",               en: "Registering…" },

  // Metrics
  "metric.activeToday":   { ar: "حاضرون اليوم",                en: "Active today" },
  "metric.cashToday":     { ar: "مداخيل اليوم — درهم",          en: "Cash collected today" },
  "metric.expiringWeek":  { ar: "ينتهي هذا الأسبوع",           en: "Expiring this week" },
  "metric.cashFlow":      { ar: "تدفّق النقد اليوم",            en: "Today's cash flow" },

  // Reception
  "reception.scannerTitle":   { ar: "امسح QR أو أدخل CIN / رقم العضو", en: "Scan QR or enter CIN / ID" },
  "reception.scannerLabel":   { ar: "ماسح الاستقبال",                en: "Reception scanner" },

  // Admin
  "admin.expiringSoon":       { ar: "قارب اشتراكهم على الانتهاء",      en: "Expiring Soon" },
  "admin.cashNote":           { ar: "كل الأداءات نقداً · توقيت إفريقيا/الدار البيضاء", en: "All payments are cash · Africa/Casablanca" },
  "admin.noRenewals":         { ar: "لا توجد تجديدات هذا الأسبوع",     en: "No renewals due this week" },
  "admin.dueIn7":             { ar: "أعضاء يستوجبون التجديد خلال أقل من 7 أيام", en: "Members due to renew in < 7 days" },

  // Shift
  "shift.men":            { ar: "الدوام الحالي: رجال",          en: "Active Shift: Men" },
  "shift.women":          { ar: "الدوام الحالي: نساء",          en: "Active Shift: Women" },
  "shift.closed":         { ar: "انتقال / مغلق",                en: "Transition / Closed" },

  // Auth
  "auth.logout":          { ar: "تسجيل الخروج",                 en: "Logout" },
  "role.owner":           { ar: "المالك",                       en: "owner" },
  "role.receptionist":    { ar: "موظف الاستقبال",               en: "receptionist" },

  // Misc
  "search.members":       { ar: "ابحث عن عضو…",                en: "Search members…" },
  "search.byNameCinId":   { ar: "ابحث بالاسم أو CIN أو رقم العضو…", en: "Search by name, CIN, or ID…" },
  "common.notify":        { ar: "الإشعارات",                    en: "Notifications" },
  "common.days":          { ar: "أيام",                       en: "days" },
  "common.currency":      { ar: "درهم",                       en: "MAD" },
  "common.of":            { ar: "من",                         en: "of" },
  "sync.active":          { ar: "مزامنة السحابة: نشطة",         en: "Live Sync: Active" },
  "sync.error":           { ar: "مزامنة السحابة: خطأ",          en: "Live Sync: Error" },

  // Coaches View
  "coach.menOnly":          { ar: "للرجال فقط", en: "Men Only" },
  "coach.womenOnly":        { ar: "للنساء فقط", en: "Women Only" },
  "coach.assignedMembers":  { ar: "الأعضاء المعينون", en: "Assigned members" },
  "coach.autoOpened":       { ar: "مجموعة اليوم (تلقائي)", en: "Auto-opened today's group" },
  "coach.add":              { ar: "إضافة مدرب", en: "Add Coach" },
  
  // Member Details / Operational View
  "member.daysLeft":        { ar: "أيام متبقية", en: "days left" },
  "member.status":          { ar: "الحالة", en: "Status" },
  "member.assign":          { ar: "تعيين عضو موجود", en: "Assign Existing Member" },
  "member.roster":          { ar: "قائمة اليوم", en: "Today's Roster" },
  "member.operationalView": { ar: "نظرة تشغيلية فقط - لا توجد بيانات مالية.", en: "Operational view only — no financial data." },
  
  // Actions
  "action.remind":          { ar: "تذكير", en: "Remind" },
  "action.print":           { ar: "طباعة", en: "Print" },
  "action.whatsapp":        { ar: "واتساب", en: "WhatsApp" },
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
