import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Check } from "lucide-react";
import { MemberQR } from "./MemberQR";
import { tzFormatDate, tzFormatTime, tzTodayISO } from "@/lib/gym-tz";
import { PLAN_LABEL, type Member, type PlanCode } from "@/lib/gym-data";

export type ReceiptPayload = {
  kind: "registration" | "renewal";
  member: Pick<Member, "id" | "cin" | "name" | "phone">;
  planCode: PlanCode;
  amount: number;        // MAD
  startDate: string;     // ISO
  endDate: string;       // ISO
};

export function ReceiptDialog({
  open, onOpenChange, payload,
}: { open: boolean; onOpenChange: (o: boolean) => void; payload: ReceiptPayload | null }) {
  const printRef = useRef<HTMLDivElement>(null);

  const print = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    w.document.write(`
      <html><head><title>PULSE Gym · Receipt</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
        .h { font-size: 18px; font-weight: 600; letter-spacing: .04em; }
        .muted { color: #666; font-size: 11px; }
        hr { border: 0; border-top: 1px dashed #bbb; margin: 12px 0; }
        .total { font-size: 20px; font-weight: 700; }
        .center { text-align: center; }
      </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 200);
  };

  if (!payload) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-success/20 text-success grid place-items-center">
              <Check className="size-4" />
            </span>
            Payment received
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="rounded-xl border border-border/60 bg-background/40 p-4 text-foreground">
          <div className="center">
            <div className="h">PULSE GYM</div>
            <div className="muted">Cash receipt · Africa/Casablanca</div>
          </div>
          <hr />
          <div className="row"><span className="muted">Date</span><span>{tzFormatDate(tzTodayISO())} · {tzFormatTime()}</span></div>
          <div className="row"><span className="muted">Type</span><span>{payload.kind === "registration" ? "New registration" : "Renewal"}</span></div>
          <div className="row"><span className="muted">Member</span><span>{payload.member.name}</span></div>
          <div className="row"><span className="muted">ID / CIN</span><span style={{ fontFamily: "ui-monospace, monospace" }}>{payload.member.id} · {payload.member.cin}</span></div>
          <div className="row"><span className="muted">Phone</span><span>{payload.member.phone}</span></div>
          <hr />
          <div className="row"><span className="muted">Plan</span><span>{PLAN_LABEL[payload.planCode]}</span></div>
          <div className="row"><span className="muted">Start</span><span>{tzFormatDate(payload.startDate)}</span></div>
          <div className="row"><span className="muted">End</span><span>{tzFormatDate(payload.endDate)}</span></div>
          <hr />
          <div className="row total"><span>Paid (CASH)</span><span>{payload.amount} MAD</span></div>
          <div className="center" style={{ marginTop: 14 }}>
            <MemberQR member={payload.member} size={120} withCaption={false} />
            <div className="muted" style={{ marginTop: 6 }}>Scan at reception for access</div>
          </div>
          <hr />
          <div className="center muted">Thank you — keep this receipt as proof of payment.</div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={print} className="bg-success text-black hover:bg-success/90">
            <Printer className="size-4" /> Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
