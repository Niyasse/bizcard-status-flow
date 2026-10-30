import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { usePrefs, useUpdates, useWallet } from "@/hooks/use-data";
import { prefsService } from "@/services";
import { notifications } from "@/lib/engagement";

const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
};

const NotificationsPage = () => {
  const wallet = useWallet();
  const prefs = usePrefs();
  const { data: all = [] } = useUpdates();
  const list = notifications(all, { ...wallet, ...prefs });

  return (
    <AppShell>
      <PageHeader title="Notifications" subtitle="New offers from businesses with alerts on" backTo="/status"
        actions={list.length > 0 && <Button size="sm" variant="outline" onClick={() => prefsService.markRead(list.map((u) => u.id))}>Mark all read</Button>} />
      {list.length ? list.map((u) => (
        <Link key={u.id} to={`/profile/${u.companyId}`} onClick={() => prefsService.markRead([u.id])}
          className="flex gap-3 bg-card rounded-lg shadow-sm p-3 mb-2">
          <img src={u.companyLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm"><span className="font-medium">{u.companyName}</span> posted a new offer</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{u.content}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{ago(u.postedAt)}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
        </Link>
      )) : (
        <div className="bg-card rounded-lg p-6 text-center text-sm text-muted-foreground">
          <BellRing className="w-8 h-8 mx-auto mb-2 text-primary" />
          You're all caught up. Save businesses and keep “Alerts on” to get notified of new offers.
        </div>
      )}
    </AppShell>
  );
};

export default NotificationsPage;
