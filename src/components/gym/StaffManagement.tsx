import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Shield, Trash2, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "receptionist";
  createdAt: string;
  active: boolean;
};

export function StaffManagement() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading staff: " + error.message);
    } else if (data) {
      setStaff(
        data.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role as "owner" | "receptionist",
          createdAt: s.created_at,
          active: s.is_active,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!isOwner) return;
    
    // Optimistic UI update
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !currentStatus } : s));

    const { error } = await supabase
      .from("staff")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error updating status: " + error.message);
      fetchStaff(); // rollback
    } else {
      toast.success("Staff status updated");
    }
  };

  const removeStaff = async (id: string, name: string) => {
    if (!isOwner) return;
    
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error removing staff: " + error.message);
    } else {
      toast.success(`Removed ${name}`);
      fetchStaff();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-primary" /> Staff & Access
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage who can log in and what they can see.</p>
          </div>
          {isOwner && (
            <Button onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="size-4" /> Create new staff
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    {isOwner && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} className="hover:bg-accent/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn("size-9 rounded-full grid place-items-center text-xs font-semibold",
                            s.role === "owner" ? "bg-primary/20 text-primary" : "bg-accent text-foreground")}>
                            {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground">Joined {new Date(s.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell>
                        <Badge className={s.role === "owner" ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}>
                          <UserCog className="size-3" /> {s.role === "owner" ? "Owner" : "Receptionist"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleActive(s.id, s.active)}
                          disabled={!isOwner}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                            isOwner ? "cursor-pointer" : "cursor-default",
                            s.active ? "border-success/40 bg-success/10 text-success" : "border-muted bg-muted/30 text-muted-foreground",
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", s.active ? "bg-success" : "bg-muted-foreground")} />
                          {s.active ? "Active" : "Suspended"}
                        </button>
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          <Button
                            size="icon" variant="ghost"
                            onClick={() => removeStaff(s.id, s.name)}
                            className="hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {staff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isOwner ? 5 : 4} className="text-center text-sm text-muted-foreground py-8">
                        No staff yet — add your first teammate.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateStaffDialog open={open} onOpenChange={setOpen} onSuccess={fetchStaff} />
    </div>
  );
}

function CreateStaffDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "receptionist">("receptionist");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }
    
    setSubmitting(true);
    try {
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: { persistSession: false }
        }
      );
      
      const { data, error } = await tempClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("Staff created", { description: `${name} can now sign in as ${role}` });
      setName(""); setEmail(""); setPassword(""); setRole("receptionist");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-primary/20 text-primary grid place-items-center"><Plus className="size-4" /></span>
            Create new staff
          </DialogTitle>
          <DialogDescription>Issue credentials for a new owner or receptionist.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Full name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@gym.com" className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Temporary password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••••" className="bg-background/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "owner" | "receptionist")}>
              <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="receptionist">Receptionist · check-ins only</SelectItem>
                <SelectItem value="owner">Owner · full access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
