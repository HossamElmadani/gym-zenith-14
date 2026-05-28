import { useState, type FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dumbbell, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@gym.com");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome ${u.name}`, { description: `Signed in as ${u.role}` });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 size-[520px] rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-womens/20 blur-3xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-primary grid place-items-center glow-primary">
            <Dumbbell className="size-5 text-primary-foreground" />
          </div>
          <div className="font-semibold text-lg tracking-tight">PULSE<span className="text-primary">·</span>CRM</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-tight">
            The command center for gender-aware gyms.
          </h1>
          <p className="text-muted-foreground max-w-md">
            Members, retention, reception and finance in one adaptive workspace —
            built for owners and receptionists.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" /> Encrypted session · Role-based access
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="glass rounded-2xl w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
              <p className="text-sm text-muted-foreground mt-1">Use your staff credentials to continue.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input id="email" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50 h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background/50 h-11" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 text-base">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
              </Button>
            </form>

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Demo accounts</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => fill("admin@gym.com", "admin")} className="rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-left hover:bg-accent/60 transition">
                  <div className="text-xs text-muted-foreground">Owner</div>
                  <div className="text-sm font-medium">admin@gym.com</div>
                </button>
                <button type="button" onClick={() => fill("reception@gym.com", "reception")} className="rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-left hover:bg-accent/60 transition">
                  <div className="text-xs text-muted-foreground">Receptionist</div>
                  <div className="text-sm font-medium">reception@gym.com</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
