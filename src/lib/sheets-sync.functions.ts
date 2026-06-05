import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";
const MEMBERS_TAB = "Members_Log";
const CASH_TAB = "Cash_Flow_Log";

type AppendInput = { tab: string; row: (string | number)[] };

async function appendRow({ tab, row }: AppendInput) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.GYM_SHEET_ID;
  if (!lovableKey || !connKey || !sheetId) {
    throw new Error("Google Sheets sync is not fully configured");
  }
  const range = `${tab}!A:Z`;
  const url = `${GATEWAY_URL}/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets append failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return { ok: true as const };
}

export const appendMemberLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    timestamp: string; name: string; cin: string; phone: string;
    gender: string; plan: string; endDate: string;
  }) => data)
  .handler(async ({ data }) =>
    appendRow({
      tab: MEMBERS_TAB,
      row: [data.timestamp, data.name, data.cin, data.phone, data.gender, data.plan, data.endDate],
    }),
  );

export const appendCashLog = createServerFn({ method: "POST" })
  .inputValidator((data: {
    timestamp: string; memberName: string; amount: number; kind: string;
  }) => data)
  .handler(async ({ data }) =>
    appendRow({
      tab: CASH_TAB,
      row: [data.timestamp, data.memberName, data.amount, data.kind],
    }),
  );

export const checkSheetsHealth = createServerFn({ method: "GET" }).handler(async () => {
  const ok = Boolean(process.env.LOVABLE_API_KEY && process.env.GOOGLE_SHEETS_API_KEY && process.env.GYM_SHEET_ID);
  return { configured: ok };
});
