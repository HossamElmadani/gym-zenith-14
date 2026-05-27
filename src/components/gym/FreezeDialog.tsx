import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";
import { gymStore } from "@/lib/gym-store";
import type { Member } from "@/lib/gym-data";

const today = () => new Date().toISOString().slice(0, 10);
const plus = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function FreezeDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(plus(14));

  if (!member) return null;

  const days = Math.max(
    0,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000),
  );

  const submit = () => {
    if (!from || !to || days <= 0) {
      toast.error("Invalid freeze window");
      return;
    }
    gymStore.freezeMember(member.id, { from, to });
    toast.success("Account frozen", {
      description: `${member.name} paused for ${days} days · end date shifted forward.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-sky-500/20 text-sky-300 grid place-items-center">
              <Snowflake className="size-4" />
            </span>
            Freeze account · {member.name}
          </DialogTitle>
          <DialogDescription>
            Pauses the subscription. End date shifts forward automatically by the same number of days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="freeze-from" className="text-xs uppercase tracking-wide text-muted-foreground">From</Label>
            <Input id="freeze-from" type="date" value={from} min={today()} onChange={(e) => setFrom(e.target.value)} className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeze-to" className="text-xs uppercase tracking-wide text-muted-foreground">To</Label>
            <Input id="freeze-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="bg-background/50" />
          </div>
        </div>

        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm">
          <span className="font-medium text-sky-300">{days} day{days === 1 ? "" : "s"}</span>
          <span className="text-muted-foreground"> paused · end date moves from {member.subEnd} to a later date.</span>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-sky-500 hover:bg-sky-500/90 text-white">
            <Snowflake className="size-4" /> Freeze account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
