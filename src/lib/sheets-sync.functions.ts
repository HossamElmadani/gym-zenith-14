import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const MEMBERS_TAB = "Members_Log";
const CASH_TAB = "Cash_Flow_Log";

const HEADERS: Record<string, string[]> = {
  [MEMBERS_TAB]: ["Timestamp", "Full Name", "CIN", "Phone", "Gender", "Plan", "End Date"],
  [CASH_TAB]:    ["Timestamp", "Member Name", "Amount (MAD)", "Transaction Type"],
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

  // List existing sheets
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
    // Seed header row
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

export const appendMemberLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    timestamp: string; name: string; cin: string; phone: string;
    gender: string; plan: string; endDate: string;
  }) => data)
  .handler(async ({ data }) =>
    appendRow(MEMBERS_TAB, [data.timestamp, data.name, data.cin, data.phone, data.gender, data.plan, data.endDate]),
  );

export const appendCashLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    timestamp: string; memberName: string; amount: number; kind: string;
  }) => data)
  .handler(async ({ data }) =>
    appendRow(CASH_TAB, [data.timestamp, data.memberName, data.amount, data.kind]),
  );

export const checkSheetsHealth = createServerFn({ method: "GET" }).handler(async () => {
  const ok = Boolean(process.env.LOVABLE_API_KEY && process.env.GOOGLE_SHEETS_API_KEY && process.env.GYM_SHEET_ID);
  return { configured: ok };
});
