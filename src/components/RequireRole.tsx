import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccess } from "@/lib/auth";
import type { UserType } from "@/types";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

/** Mock route guard: sends signed-out users to /login, blocks other roles. */
export function RequireRole({ roles, children }: { roles: UserType[]; children: ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!canAccess(user.userType, roles)) {
    return (
      <AppShell>
        <div className="bg-card rounded-xl p-6 text-center shadow-sm" role="alert">
          <h1 className="font-bold text-lg mb-2">No access</h1>
          <p className="text-sm text-muted-foreground mb-4">This area is for {roles.join(" / ")} accounts.</p>
          <Button asChild className="min-h-11"><Link to="/">Go to Discover</Link></Button>
        </div>
      </AppShell>
    );
  }
  return <>{children}</>;
}
