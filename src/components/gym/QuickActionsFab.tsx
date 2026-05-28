import { useState } from "react";
import { Plus, Receipt, UserPlus, Wallet, Wrench, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { gymStore } from "@/lib/gym-store";
import { MEMBERS } from "@/lib/gym-data";

type Modal = null | "cash" | "machine" | "expense";

export function QuickActionsFab({
  onQuickOnboard,
  role = "owner",
}: { onQuickOnboard: () => void; role?: "owner" | "receptionist" }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);

  const allActions = [
    {
      key: "onboard",
      label: "Quick Onboard",
      icon: UserPlus,
      tone: "bg-primary text-primary-foreground",
      onClick: () => { onQuickOnboard(); setOpen(false); },
      roles: ["owner", "receptionist"] as const,
    },
    {
      key: "cash",
      label: "Log Cash Payment",
      icon: Wallet,
      tone: "bg-success text-black",
      onClick: () => { setModal("cash"); setOpen(false); },
      roles: ["owner", "receptionist"] as const,
    },
    {
      key: "expense",
      label: "Log Expense",
      icon: Receipt,
      tone: "bg-destructive text-destructive-foreground",
      onClick: () => { setModal("expense"); setOpen(false); },
      roles: ["owner"] as const,
    },
    {
      key: "machine",
      label: "Report Broken Machine",
      icon: Wrench,
      tone: "bg-warning text-black",
      onClick: () => { setModal("machine"); setOpen(false); },
      roles: ["owner", "receptionist"] as const,
    },
  ];
  const actions = allActions.filter((a) => (a.roles as readonly string[]).includes(role));

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div
          className={cn(
            "flex flex-col items-end gap-2 transition-all duration-200",
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
          )}
        >
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={a.onClick}
              className="group flex items-center gap-2 pl-3 pr-1 py-1 rounded-full glass hover:bg-accent/80 transition-colors"
            >
              <span className="text-sm font-medium pr-1">{a.label}</span>
              <span className={cn("size-9 rounded-full grid place-items-center shadow-md", a.tone)}>
                <a.icon className="size-4" />
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Quick actions"
          className={cn(
            "size-14 rounded-full grid place-items-center text-primary-foreground shadow-[0_12px_40px_-10px_rgba(99,102,241,0.7)] transition-transform duration-200",
            "bg-gradient-to-br from-primary to-primary/70 hover:scale-105",
            open && "rotate-45",
          )}
        >
          {open ? <X className="size-6" /> : <Plus className="size-6" />}
        </button>
      </div>

      <CashDialog open={modal === "cash"} onOpenChange={(o) => !o && setModal(null)} />
      <MachineDialog open={modal === "machine"} onOpenChange={(o) => !o && setModal(null)} />
      <ExpenseDialog open={modal === "expense"} onOpenChange={(o) => !o && setModal(null)} />
    </>
  );
}

function CashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [amount, setAmount] = useState("");
  const [memberId, setMemberId] = useState<string>("__walkin__");
  const [method, setMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [note, setNote] = useState("");

  const submit = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) return toast.error("Enter a valid amount");
    const m = MEMBERS.find((x) => x.id === memberId);
    gymStore.logCash({
      amount: a,
      method,
      memberId: m?.id,
      memberName: m?.name ?? "Walk-in",
      note: note || undefined,
    });
    toast.success(`Logged ${a} MAD`, { description: m ? m.name : "Walk-in payment" });
    setAmount(""); setNote(""); setMemberId("__walkin__"); setMethod("cash");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-success/20 text-success grid place-items-center"><Wallet className="size-4" /></span>
            Log payment
          </DialogTitle>
          <DialogDescription>Record cash, card or transfer received at the desk.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount (MAD)</Label>
            <Input
              type="number" inputMode="decimal" autoFocus
              placeholder="e.g. 400"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="bg-background/50 text-lg font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="__walkin__">Walk-in</SelectItem>
                {MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} · {m.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as "cash" | "card" | "transfer")}>
              <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Renewal, drop-in, merch…" className="bg-background/50" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-success text-black hover:bg-success/90">
            <Wallet className="size-4" /> Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MachineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [machine, setMachine] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!machine.trim()) return toast.error("Pick or name the machine");
    gymStore.reportMaintenance({ machine: machine.trim(), severity, note: note || undefined });
    toast.success("Maintenance ticket created", { description: `${machine} · ${severity} priority` });
    setMachine(""); setSeverity("medium"); setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-warning/20 text-warning grid place-items-center"><Wrench className="size-4" /></span>
            Report broken machine
          </DialogTitle>
          <DialogDescription>The on-call technician is notified instantly.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Machine</Label>
            <Input autoFocus placeholder="e.g. Treadmill #3, Cable cross, Squat rack" value={machine} onChange={(e) => setMachine(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as "low" | "medium" | "high")}>
              <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low · still usable</SelectItem>
                <SelectItem value="medium">Medium · partial issue</SelectItem>
                <SelectItem value="high">High · out of service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe what's wrong…" className="bg-background/50 min-h-24" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-warning text-black hover:bg-warning/90">
            <Wrench className="size-4" /> Send ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
