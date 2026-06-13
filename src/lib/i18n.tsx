import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "ar" | "fr"; // تغيير من en إلى fr

type Dict = Record<string, { ar: string; fr: string }>; // تغيير من en إلى fr

export const DICT = {
  // Sidebar / nav
  "nav.dashboard":   { ar: "الرئيسية",       fr: "Tableau de bord" },
  "nav.members":     { ar: "الأعضاء",        fr: "Membres" },
  "nav.reception":   { ar: "الاستقبال",      fr: "Réception" },
  "nav.onboard":     { ar: "تسجيل جديد",     fr: "Inscription" },
  "nav.coaches":     { ar: "المدربون",       fr: "Coachs" },
  "nav.staff":       { ar: "فريق العمل",     fr: "Équipe" },

  // Headings
  "head.admin.title":     { ar: "نظرة على اليوم",                fr: "Aperçu du jour" },
  "head.admin.sub":       { ar: "الأعضاء النشطون، المداخيل والتجديدات.", fr: "Membres actifs, revenus et renouvellements — en un coup d'œil." },
  "head.members.title":   { ar: "الأعضاء",                       fr: "Membres" },
  "head.members.sub":     { ar: "ابحث، جدّد، جمّد وتواصل مع الأعضاء.", fr: "Rechercher, renouveler, geler et contacter les membres." },
  "head.reception.title": { ar: "مكتب الاستقبال",                fr: "Bureau de réception" },
  "head.reception.sub":   { ar: "امسح رمز QR أو CIN للتحقق من الدخول.", fr: "Scannez le QR ou la CIN pour valider l'accès." },
  "head.onboard.title":   { ar: "عضو جديد",                      fr: "Nouveau membre" },
  "head.onboard.sub":     { ar: "سجّل عضوًا، استلم الكاش واطبع الإيصال.", fr: "Inscrire un membre, encaisser et imprimer un reçu." },
  "head.coaches.title":   { ar: "المدربون والمجموعات",           fr: "Coachs & Groupes" },
  "head.coaches.sub":     { ar: "عزل تام بين مدربي الرجال والنساء لتفادي الأخطاء.", fr: "Coachs hommes et femmes — totalement séparés pour éviter les erreurs." },
  "head.staff.title":     { ar: "فريق العمل والصلاحيات",          fr: "Équipe & Accès" },
  "head.staff.sub":       { ar: "إدارة الحسابات والصلاحيات.",     fr: "Gérer qui peut se connecter." },

  // Actions / buttons
  "action.addCoach":      { ar: "إضافة مدرب",       fr: "Ajouter un coach" },
  "action.assignMember":  { ar: "تعيين متدرب",      fr: "Assigner un membre" },
  "action.freeze":        { ar: "تجميد",            fr: "Geler" },
  "action.unfreeze":      { ar: "إلغاء التجميد",    fr: "Dégeler" },
  "action.renew":         { ar: "تجديد",            fr: "Renouveler" },
  "action.checkin":       { ar: "تسجيل الدخول",     fr: "Pointer (Check-in)" },
  "action.logCash":       { ar: "إدخال كاش",        fr: "Saisir l'espèce" },
  "action.validate":      { ar: "تحقق",             fr: "Valider" },
  "action.register":      { ar: "تسجيل",            fr: "Inscrire" },
  "action.cancel":        { ar: "إلغاء",            fr: "Annuler" },

  // Table headers
  "table.member":         { ar: "العضو",            fr: "Membre" },
  "table.cin":            { ar: "البطاقة الوطنية",   fr: "CIN" },
  "table.gender":         { ar: "الجنس",            fr: "Sexe" },
  "table.daysLeft":       { ar: "الأيام المتبقية",  fr: "Jours restants" },
  "table.status":         { ar: "الحالة",           fr: "Statut" },
  "table.actions":        { ar: "إجراءات",          fr: "Actions" },
  "table.phone":          { ar: "الهاتف",           fr: "Téléphone" },

  // Status labels
  "status.active":        { ar: "نشط",              fr: "Actif" },
  "status.expiring":      { ar: "قارب الانتهاء",    fr: "Expire bientôt" },
  "status.expired":       { ar: "منتهي",            fr: "Expiré" },
  "status.frozen":        { ar: "مجمّد",            fr: "Gelé" },
  "status.paused":        { ar: "موقوف",            fr: "En pause" },

  // Filters
  "filter.allStatuses":   { ar: "كل الحالات",       fr: "Tous les statuts" },
  "filter.allGenders":    { ar: "كل الأجناس",       fr: "Tous les sexes" },
  "gender.male":          { ar: "ذكر",              fr: "Homme" },
  "gender.female":        { ar: "أنثى",             fr: "Femme" },
  "gender.men":           { ar: "رجال",             fr: "Hommes" },
  "gender.women":         { ar: "نساء",             fr: "Femmes" },

  // Form fields
  "form.fullName":        { ar: "الاسم الكامل",     fr: "Nom complet" },
  "form.phone":           { ar: "رقم الهاتف",       fr: "Numéro de téléphone" },
  "form.gender":          { ar: "الجنس",            fr: "Sexe" },
  "form.cin":             { ar: "رقم البطاقة الوطنية (CIN)", fr: "CIN / Carte d'identité" },
  "form.assignCoach":     { ar: "تعيين مدرب",       fr: "Assigner un coach" },
  "form.startDate":       { ar: "تاريخ البدء",      fr: "Date de début" },
  "form.endDate":         { ar: "تاريخ الانتهاء",   fr: "Date de fin" },
  "form.plan":            { ar: "الاشتراك",         fr: "Abonnement" },
  "form.cashAmount":      { ar: "المبلغ المدفوع (درهم)", fr: "Montant payé (MAD)" },
  "form.selectGender":    { ar: "اختر الجنس",       fr: "Sélectionner" },
  "form.none":            { ar: "— لا أحد —",       fr: "— Aucun —" },
  "form.pickGenderFirst": { ar: "اختر الجنس أولًا",  fr: "Choisissez d'abord le sexe" },
  "form.selectCoach":     { ar: "اختر مدربًا",      fr: "Sélectionnez un coach" },
  "form.specialty":       { ar: "التخصص",           fr: "Spécialité" },
  "form.targetAudience":  { ar: "الفئة المستهدفة",  fr: "Public cible" },
  "form.workingDays":     { ar: "أيام العمل",       fr: "Jours de travail" },
  "form.startTime":       { ar: "وقت البدء",        fr: "Heure de début" },
  "form.endTime":         { ar: "وقت الانتهاء",     fr: "Heure de fin" },

  // Onboard specific
  "onboard.identity":       { ar: "هوية العضو",                  fr: "Identité du membre" },
  "onboard.identitySub":    { ar: "البيانات الأساسية وأوقات الدخول.", fr: "Détails personnels et horaires d'accès." },
  "onboard.namePlaceholder":{ ar: "مثال: أحمد العلمي",            fr: "ex: Ahmed El Alami" },
  "onboard.planCash":       { ar: "الاشتراك والصندوق",           fr: "Abonnement & Caisse" },
  "onboard.planCashSub":    { ar: "تاريخ الانتهاء يُحسب أوتوماتيكياً.", fr: "La date de fin se calcule automatiquement." },
  "onboard.genderHelper":   { ar: "اختيار الجنس يحدد أوقات الدخول التلقائية.", fr: "Le choix du sexe attribue le planning d'accès." },
  "onboard.coachHelper":    { ar: "قائمة المدربين تُفلتر بناءً على الجنس المختار.", fr: "La liste des coachs est filtrée automatiquement." },
  "onboard.picture":        { ar: "الصورة الشخصية (اختياري)",    fr: "Photo de profil (optionnelle)" },
  "onboard.upload":         { ar: "اسحب الصورة أو اضغط للرفع",    fr: "Glissez l'image ou cliquez pour importer" },
  "onboard.uploadSub":      { ar: "PNG · JPG · حتى 5 ميجابايت",  fr: "PNG · JPG · jusqu'à 5MB" },
  "onboard.cashRequired":   { ar: "إجباري. الأداء نقداً فقط.",    fr: "Obligatoire. Paiement en espèces uniquement." },
  "onboard.ready":          { ar: "جاهز للتسجيل؟",                fr: "Prêt à inscrire ?" },
  "onboard.readySub":       { ar: "تأكد من استلام المبلغ، ثم اضغط تسجيل.", fr: "Remplissez les champs, confirmez l'espèce, puis inscrivez." },
  "onboard.registering":    { ar: "جاري التسجيل…",               fr: "Inscription en cours…" },

  // Metrics
  "metric.activeToday":   { ar: "حاضرون اليوم",                fr: "Actifs aujourd'hui" },
  "metric.cashToday":     { ar: "مداخيل اليوم — درهم",          fr: "Espèces encaissées — MAD" },
  "metric.expiringWeek":  { ar: "ينتهي هذا الأسبوع",           fr: "Expire cette semaine" },
  "metric.cashFlow":      { ar: "تدفّق النقد اليوم",            fr: "Flux de trésorerie du jour" },

  // Reception
  "reception.scannerTitle":   { ar: "امسح QR أو أدخل CIN / رقم العضو", fr: "Scannez le QR ou entrez CIN / ID" },
  "reception.scannerLabel":   { ar: "ماسح الاستقبال",                fr: "Scanner de réception" },

  // Admin
  "admin.expiringSoon":       { ar: "قارب اشتراكهم على الانتهاء",      fr: "Expire bientôt" },
  "admin.cashNote":           { ar: "كل الأداءات نقداً · توقيت إفريقيا/الدار البيضاء", fr: "Tous les paiements sont en espèces · Afrique/Casablanca" },
  "admin.noRenewals":         { ar: "لا توجد تجديدات هذا الأسبوع",    fr: "Aucun renouvellement cette semaine" },
  "admin.dueIn7":             { ar: "أعضاء يستوجبون التجديد خلال أقل من 7 أيام", fr: "Membres à renouveler dans < 7 jours" },

  // Shift
  "shift.men":            { ar: "الدوام الحالي: رجال",          fr: "Service actuel : Hommes" },
  "shift.women":          { ar: "الدوام الحالي: نساء",          fr: "Service actuel : Femmes" },
  "shift.closed":         { ar: "انتقال / مغلق",                fr: "Transition / Fermé" },

  // Auth
  "auth.logout":          { ar: "تسجيل الخروج",                fr: "Se déconnecter" },
  "role.owner":           { ar: "المالك",                      fr: "Propriétaire" },
  "role.receptionist":    { ar: "موظف الاستقبال",              fr: "Réceptionniste" },

  // Misc
  "search.members":       { ar: "ابحث عن عضو…",                fr: "Rechercher des membres…" },
  "search.byNameCinId":   { ar: "ابحث بالاسم أو CIN أو رقم العضو…", fr: "Recherche par nom, CIN ou ID…" },
  "common.notify":        { ar: "الإشعارات",                  fr: "Notifications" },
  "common.days":          { ar: "أيام",                      fr: "jours" },
  "common.currency":      { ar: "درهم",                      fr: "MAD" },
  "common.of":            { ar: "من",                        fr: "sur" },
  "sync.active":          { ar: "مزامنة السحابة: نشطة",         fr: "Synchro Cloud : Active" },
  "sync.error":           { ar: "مزامنة السحابة: خطأ",          fr: "Synchro Cloud : Erreur" },

  // Coaches View
  "coach.menOnly":          { ar: "للرجال فقط", fr: "Hommes Uniquement" },
  "coach.womenOnly":        { ar: "للنساء فقط", fr: "Femmes Uniquement" },
  "coach.assignedMembers":  { ar: "الأعضاء المعينون", fr: "Membres assignés" },
  "coach.autoOpened":       { ar: "مجموعة اليوم (تلقائي)", fr: "Groupe du jour (auto)" },
  "coach.add":              { ar: "إضافة مدرب", fr: "Ajouter un coach" },
  
  // Member Details / Operational View
  "member.daysLeft":        { ar: "أيام متبقية", fr: "jours restants" },
  "member.status":          { ar: "الحالة", fr: "Statut" },
  "member.assign":          { ar: "تعيين عضو موجود", fr: "Assigner un membre existant" },
  "member.roster":          { ar: "قائمة اليوم", fr: "Liste du jour" },
  "member.operationalView": { ar: "نظرة تشغيلية فقط - لا توجد بيانات مالية.", fr: "Vue opérationnelle uniquement — aucune donnée financière." },
  
  // Actions
  "action.remind":          { ar: "تذكير", fr: "Rappeler" },
  "action.print":           { ar: "طباعة", fr: "Imprimer" },
  "action.whatsapp":        { ar: "واتساب", fr: "WhatsApp" },

  // Edit Member Modal
  "edit.title": { ar: "تعديل الملف الشخصي", fr: "Modifier le profil" },
  "edit.photo": { ar: "صورة الملف الشخصي", fr: "Photo de profil" },
  "edit.name": { ar: "الاسم الكامل", fr: "Nom complet" },
  "edit.phone": { ar: "رقم الهاتف", fr: "Téléphone" },
  "edit.cin": { ar: "البطاقة الوطنية", fr: "CIN" },
  "edit.gender": { ar: "الجنس", fr: "Genre" },
  "edit.age": { ar: "العمر", fr: "Âge" },
  "edit.cancel": { ar: "إلغاء", fr: "Annuler" },
  "edit.save": { ar: "حفظ", fr: "Enregistrer" },
  "edit.uploadHelp": { ar: "اسحب الصورة أو اضغط للرفع", fr: "Glissez l'image ou cliquez" },
  "edit.uploadLimit": { ar: "PNG · JPG · حتى 5MB", fr: "PNG · JPG · jusqu'à 5MB" },
  "edit.select": { ar: "اختر", fr: "Sélectionner" },
  "edit.years": { ar: "سنة", fr: "ans" },
  "edit.toast.onlyImages": { ar: "ملفات الصور فقط", fr: "Seuls les fichiers d'image sont autorisés" },
  "edit.toast.nameRequired": { ar: "الاسم مطلوب", fr: "Le nom est requis" },
  "edit.toast.phoneRequired": { ar: "رقم الهاتف مطلوب", fr: "Le numéro de téléphone est requis" },
  "edit.toast.cinRequired": { ar: "رقم البطاقة الوطنية مطلوب", fr: "Le CIN est requis" },
  "edit.toast.success": { ar: "تم تحديث الملف الشخصي بنجاح", fr: "Profil mis à jour avec succès" },
  "edit.toast.failed": { ar: "فشل التحديث: ", fr: "Échec de la mise à jour : " },

  // Admin View Dashboard
  "admin.filterTitle": { ar: "تصفية لوحة التحكم", fr: "Filtre du tableau de bord" },
  "admin.filterRangeFrom": { ar: "البيانات المعروضة من", fr: "Données du" },
  "admin.filterRangeTo": { ar: "إلى", fr: "au" },
  "admin.filterRangeStartDefault": { ar: "البداية", fr: "début" },
  "admin.filterRangeEndDefault": { ar: "اليوم", fr: "aujourd'hui" },
  "admin.filter.7d": { ar: "آخر 7 أيام", fr: "Derniers 7 jours" },
  "admin.filter.30d": { ar: "آخر 30 يومًا", fr: "Derniers 30 jours" },
  "admin.filter.thisMonth": { ar: "هذا الشهر", fr: "Ce mois-ci" },
  "admin.filter.all": { ar: "كل الأوقات", fr: "Tout le temps" },
  "admin.newMembers": { ar: "الأعضاء الجدد", fr: "Nouveaux Membres" },
  "admin.newMembersSub": { ar: "سجلوا خلال الفترة المحددة", fr: "Inscrits sur cette période" },
  "admin.totalRevenue": { ar: "مجموع الإيرادات", fr: "Revenu Total" },
  "admin.totalRevenueSub": { ar: "المبالغ المحصلة نقداً", fr: "MAD collectés au total" },
  "admin.transactions": { ar: "المعاملات المالية", fr: "Transactions" },
  "admin.transactionsSub": { ar: "عدد إيصالات القبض المدخلة", fr: "Reçus émis sur cette période" },
  "admin.revenueTrend": { ar: "تطور المداخيل (آخر 7 أيام)", fr: "Tendance des Revenus (7 derniers jours)" },
  "admin.membersOverview": { ar: "أرقام الأعضاء", fr: "Aperçu des Membres" },
  "admin.membersOverviewSubPrefix": { ar: "توزيع جميع الأعضاء في النظام (إجمالي:", fr: "Distribution de tous les membres du système (Total :" },
  "admin.status.active": { ar: "نشط", fr: "Actifs" },
  "admin.status.expiring": { ar: "ينتهي قريباً (< 7أيام)", fr: "Expire Bientôt (< 7j)" },
  "admin.status.expired": { ar: "منتهي", fr: "Expirés" },
  "admin.status.pending": { ar: "في الانتظار", fr: "En attente" },
  "admin.financialBreakdown": { ar: "تفاصيل الإيرادات", fr: "Détails des Recettes" },
  "admin.breakdown.total": { ar: "إجمالي المداخيل", fr: "Total Revenus" },
  "admin.breakdown.inscriptions": { ar: "الاشتراكات الجديدة", fr: "Inscriptions" },
  "admin.breakdown.renewals": { ar: "تجديد الاشتراكات", fr: "Renouvellements" },
  "admin.breakdown.insurance": { ar: "التأمين الرياضي", fr: "Assurance" },
  "admin.transactionCount": { ar: "معاملة", fr: "trans." },

  // Members Directory
  "members.noMatch": { ar: "لا يوجد أعضاء يطابقون هذا البحث.", fr: "Aucun membre ne correspond à ce filtre." },
  "members.noCoach": { ar: "لا يوجد مدرب", fr: "Aucun coach" },
  "members.noInsurance": { ar: "غير مؤمن", fr: "Pas d'assurance" },
  "members.frozen": { ar: "مُجمّد", fr: "Gelé" },
  "members.age": { ar: "العمر", fr: "Âge" },
  "members.subUsed": { ar: "نسبة استهلاك الاشتراك", fr: "Abonnement utilisé" },
  "members.start": { ar: "البداية", fr: "Début" },
  "members.startsOn": { ar: "يبدأ في", fr: "Commence le" },
  "members.validUntil": { ar: "صالح حتى", fr: "Valide jusqu'au" },
  "members.expiredOn": { ar: "منتهي في", fr: "Expiré le" },
  "members.end": { ar: "النهاية", fr: "Fin" },
  "members.pendingSub": { ar: "لم يبدأ الاشتراك بعد", fr: "L'abonnement n'a pas encore commencé" },
  "members.daysRemaining": { ar: "أيام متبقية", fr: "jours restants" },
  "members.insuranceStatus": { ar: "التأمين الرياضي", fr: "Statut de l'assurance" },
  "members.assignedCoach": { ar: "المدرب الشخصي", fr: "Coach désigné" },
  "members.paymentHistory": { ar: "سجل الأداءات", fr: "Historique des paiements" },
  "members.recentCheckins": { ar: "تسجيلات الدخول الأخيرة", fr: "Entrées récentes" },
  "members.noRecentCheckins": { ar: "لا توجد تسجيلات دخول حديثة.", fr: "Aucune entrée récente." },
  "members.mostRecentVisit": { ar: "أحدث زيارة", fr: "Visite la plus récente" },
  "members.renewCash": { ar: "تجديد (نقداً)", fr: "Renouveler (espèces)" },
  "members.whatsappMember": { ar: "مراسلة العضو", fr: "Contacter le membre" },
  "members.toast.unfrozen": { ar: "تم إلغاء تجميد العضو بنجاح", fr: "Membre dégelé avec succès" },
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
  lang: "fr", setLang: () => {}, toggle: () => {}, t: (k) => k, dir: "ltr",
});

const STORAGE = "pulse.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "fr";
    return (localStorage.getItem(STORAGE) as Lang) || "fr";
  });

  // Arabic is RTL, French is LTR
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(STORAGE, lang); } catch { /* ignore */ }
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  
  // التبديل بين العربية والفرنسية
  const toggle = useCallback(() => setLangState((p) => (p === "ar" ? "fr" : "ar")), []);
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