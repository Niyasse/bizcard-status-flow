import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { usePrefs, useUpdates, useWallet } from "@/hooks/use-data";
import { notifications } from "@/lib/engagement";

/** Header bell with count of mock in-app notifications (no push). */
export function NotificationBell() {
  const wallet = useWallet();
  const prefs = usePrefs();
  const { data: all = [] } = useUpdates();
  const n = notifications(all, { ...wallet, ...prefs }).length;
  return (
    <Link to="/notifications" aria-label={`Notifications${n ? `, ${n} new` : ""}`} className="relative p-2 rounded-full hover:bg-primary-foreground/10">
      <Bell className="w-5 h-5" />
      {n > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-accent text-primary-foreground text-[10px] font-bold flex items-center justify-center">{n}</span>
      )}
    </Link>
  );
}
