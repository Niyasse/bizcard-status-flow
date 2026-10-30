import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <AppShell>
    <div className="bg-card rounded-xl p-8 text-center shadow-sm">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-4">This page doesn't exist.</p>
      <Button asChild className="min-h-11"><Link to="/">Back to Discover</Link></Button>
    </div>
  </AppShell>
);

export default NotFound;
