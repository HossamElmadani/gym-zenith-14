import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PLAN_OPTIONS, PLAN_PRICES, type Member, type PlanCode } from "@/lib/gym-data";
import { gymStore } from "@/lib/gym-store";
import { ReceiptDialog, type ReceiptPayload } from "./ReceiptDialog";
import { tzAddMonthsISO, tzTodayISO } from "@/lib/gym-tz";

export function RenewDialog({
  member, open, onOpenChange,
}: { member: Member | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [plan, setPlan] = useState<PlanCode>("1M");
  const [amount, setAmount] = useState<string>(String(PLAN_PRICES["1M"]));
  const [receipt, setReceipt] = useState<ReceiptPayload | null>(null);

  useEffect(() => {
    if (open && member) {
      setPlan(member.plan);
      setAmount(String(PLAN_PRICES[member.plan]));
    }
  }, [open, member]);

  const onPlanChange = (p: PlanCode) => {
    setPlan(p);
    setAmount(String(PLAN_PRICES[p]));
  };

  const submit = () => {
    if (!member) return;
    const a = parseFloat(amount);
    if (!a || a <= 0) return toast.error("Enter the cash amount paid");
    const updated = gymStore.renewMember(member.id, plan, a);
    if (!updated) return;
    toast.success("Renewal complete", { description: `${updated.name} · ${a} MAD` });
    setReceipt({
      kind: "renewal",
      member: { id: updated.id, cin: updated.cin, name: updated.name, phone: updated.phone },
      planCode: plan,
      amount: a,
      startDate: tzTodayISO(),
      endDate: updated.subEnd,
    });
    onOpenChange(false);
  };

  const start = tzTodayISO();
  const end = tzAddMonthsISO(start, PLAN_OPTIONS.find((p) => p.code === plan)!.months);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass border-border/60 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="size-8 rounded-lg bg-success/20 text-success grid place-items-center">
                <RefreshCw className="size-4" />
              </span>
              Renew subscription
            </DialogTitle>
            {member && (
              <DialogDescription>
                {member.name} · {member.id} · {member.cin}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Plan</Label>
              <Select value={plan} onValueChange={(v) => onPlanChange(v as PlanCode)}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label} · {p.price} MAD
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cash amount paid (MAD)</Label>
              <Input
                type="number" inputMode="decimal" autoFocus
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="bg-background/50 text-xl font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">
                New end date: <span className="text-foreground font-medium">{end}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-success text-black hover:bg-success/90">
              <Wallet className="size-4" /> Confirm cash & renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} payload={receipt} />
    </>
  );
}
