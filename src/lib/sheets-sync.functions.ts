import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

// ---------------------------------------------------------------------------
// PHASE 4 — Relational Google Sheets Sync (Version Française)
// Four tabs, each acting as an append-only ledger so the spreadsheet behaves
// like a lightweight relational warehouse.
// ---------------------------------------------------------------------------
const MEMBERS_TAB     = "Membres";
const FINANCIALS_TAB  = "Finances";
const ATTENDANCE_TAB  = "Presences";
const COACHES_TAB     = "Cycles_Coachs";

const HEADERS: Record<string, string[]> = {
  [MEMBERS_TAB]:     ["ID", "Nom complet", "Téléphone", "Genre", "Coach Actuel", "Fin d'Abonnement", "Fin d'Assurance"],
  [FINANCIALS_TAB]:  ["Date", "ID", "Nom du Membre", "Type de Transaction", "Montant (MAD)"],
  [ATTENDANCE_TAB]:  ["Date & Heure", "ID", "Nom de la Personne", "Rôle"],
  [COACHES_TAB]:     ["Nom du Coach", "Date Début Cycle", "Date Fin Cycle", "Membres Actifs"],
};

function authHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GYM_SHEET_ID;
  if (!lovableKey || !connKey || !sheetId) {
    throw new Error("Google Sheets sync is not fully configured");
  }
  return {
    sheetId,
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    } as Record<string, string>,
  };
}

// Cache: which tabs we've already ensured exist this runtime.
const ensured = new Set<string>();

async function ensureTab(tab: string) {
  if (ensured.has(tab)) return;
  const { sheetId, headers } = authHeaders();

  const metaRes = await fetch(
    `${GATEWAY_URL}/spreadsheets/${sheetId}?fields=sheets.properties.title`,
    { headers },
  );
  if (!metaRes.ok) {
    throw new Error(`Sheets metadata failed (${metaRes.status}): ${(await metaRes.text()).slice(0, 200)}`);
  }
  const meta = await metaRes.json() as { sheets?: { properties: { title: string } }[] };
  const exists = meta.sheets?.some((s) => s.properties.title === tab);

  if (!exists) {
    const addRes = await fetch(`${GATEWAY_URL}/spreadsheets/${sheetId}:batchUpdate`, {
      method: "POST", headers,
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
    });
    if (!addRes.ok) {
      throw new Error(`Sheets addSheet failed (${addRes.status}): ${(await addRes.text()).slice(0, 200)}`);
    }
    const hdr = HEADERS[tab];
    if (hdr) {
      await fetch(
        `${GATEWAY_URL}/spreadsheets/${sheetId}/values/${tab}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        { method: "POST", headers, body: JSON.stringify({ values: [hdr] }) },
      );
    }
  }
  ensured.add(tab);
}

async function appendRow(tab: string, row: (string | number)[]) {
  await ensureTab(tab);
  const { sheetId, headers } = authHeaders();
  const url = `${GATEWAY_URL}/spreadsheets/${sheetId}/values/${tab}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST", headers,
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    throw new Error(`Sheets append failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Public server functions — one per relational tab.
// ---------------------------------------------------------------------------

export const appendMemberLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    id: string; name: string; phone: string; gender: string;
    coach: string; subEnd: string; insuranceEnd: string;
  }) => data)
  .handler(async ({ data }) =>
    appendRow(MEMBERS_TAB, [data.id, data.name, data.phone, data.gender, data.coach, data.subEnd, data.insuranceEnd]),
  );

export const appendFinancialLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    date: string; id: string; memberName: string; transactionType: string; amount: number;
  }) => data)
  .handler(async ({ data }) =>
    appendRow(FINANCIALS_TAB, [data.date, data.id, data.memberName, data.transactionType, data.amount]),
  );

export const appendAttendanceLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    dateTime: string; id: string; personName: string; role: "Member" | "Coach";
  }) => data)
  .handler(async ({ data }) => {
    // ترجمة الدور للفرنسية قبل إرساله لجوجل شيت
    const roleFr = data.role === "Coach" ? "Coach" : "Membre";
    return appendRow(ATTENDANCE_TAB, [data.dateTime, data.id, data.personName, roleFr]);
  });

export const appendCoachCycleLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    coachName: string; cycleStart: string; cycleEnd: string; activeMembers: number;
  }) => data)
  .handler(async ({ data }) =>
    appendRow(COACHES_TAB, [data.coachName, data.cycleStart, data.cycleEnd, data.activeMembers]),
  );

// Backwards-compat shim: old cash-log callsites map into the new Financials tab.
export const appendCashLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    timestamp: string; id: string; memberName: string; amount: number; kind: string;
  }) => data)
  .handler(async ({ data }) => {
    const map: Record<string, string> = {
      registration: "Abonnement",
      renewal:      "Renouvellement",
      dropin:       "Pass Jour (1D)",
      insurance:    "Assurance",
      other:        "Autre",
    };
    const transactionType = map[data.kind] ?? data.kind;
    return appendRow(FINANCIALS_TAB,
      [data.timestamp, data.id, data.memberName, transactionType, data.amount]);
  });

export const checkSheetsHealth = createServerFn({ method: "GET" }).handler(async () => {
  const ok = Boolean(process.env.LOVABLE_API_KEY && process.env.GOOGLE_SHEETS_API_KEY && process.env.GYM_SHEET_ID);
  return { configured: ok };
});