import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccessDenied({ onBack }: { onBack?: () => void }) {
  return (
    <div className="grid place-items-center py-16">
      <Card className="glass rounded-2xl max-w-md w-full border-destructive/40">
        <CardContent className="p-8 text-center space-y-4">
          <div className="size-16 rounded-2xl bg-destructive/20 text-destructive mx-auto grid place-items-center">
            <ShieldAlert className="size-8" />
          </div>
          <div className="text-xs uppercase tracking-widest text-destructive">403 · Access Denied</div>
          <h2 className="text-2xl font-semibold tracking-tight">You don't have access to this area</h2>
          <p className="text-sm text-muted-foreground">
            This module is restricted to Owners. Ask the gym owner to grant your account elevated permissions.
          </p>
          {onBack && (
            <Button variant="secondary" onClick={onBack}>Back to dashboard</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
