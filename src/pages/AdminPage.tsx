import { useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, EyeOff, Eye, Flag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { businessService, moderationService, moderationStore, reportService, reportsStore, userService, MY_BUSINESS_ID } from "@/services";
import type { ListingStatus } from "@/types";

const tabs = [["approvals", "Approvals"], ["listings", "Listings"], ["reports", "Reports"], ["users", "Users"]] as const;
type Tab = typeof tabs[number][0];

const statusVariant: Record<ListingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default", pending: "secondary", rejected: "destructive", hidden: "outline",
};

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>("approvals");
  const qc = useQueryClient();
  const { data: all = [], isLoading } = useQuery({ queryKey: ["admin-businesses"], queryFn: businessService.listAll });
  useSyncExternalStore(moderationStore.subscribe, moderationStore.get);
  const reports = useSyncExternalStore(reportsStore.subscribe, reportsStore.get).items;
  const statusOf = (id: string) => moderationService.statusOf(id, id === MY_BUSINESS_ID);
  const setStatus = (id: string, s: ListingStatus) => { moderationService.setStatus(id, s); qc.invalidateQueries({ queryKey: ["businesses"] }); };
  const nameOf = (id: string) => all.find((b) => b.id === id)?.name ?? id;

  const pending = all.filter((b) => statusOf(b.id) === "pending");
  const openReports = reports.filter((r) => r.status === "open").length;

  const empty = (msg: string) => <p className="bg-card rounded-xl p-6 text-center text-sm text-muted-foreground">{msg}</p>;

  return (
    <AppShell>
      <PageHeader title="Admin panel" subtitle={`${pending.length} pending · ${openReports} open reports`} backTo="/" />
      <div role="tablist" aria-label="Admin sections" className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {tabs.map(([id, label]) => (
          <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? "default" : "outline"} className="min-h-11 shrink-0" onClick={() => setTab(id)}>
            {label}{id === "approvals" && pending.length > 0 && ` (${pending.length})`}{id === "reports" && openReports > 0 && ` (${openReports})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : tab === "approvals" ? (
        pending.length === 0 ? empty("No businesses waiting for approval.") : (
          <ul className="space-y-2">
            {pending.map((b) => (
              <li key={b.id} className="bg-card rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={b.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${b.id}`} className="font-medium truncate block hover:underline">{b.name}</Link>
                    <p className="text-xs text-muted-foreground truncate">{b.tags.join(", ")} · {b.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button className="min-h-11" onClick={() => setStatus(b.id, "approved")}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                  <Button variant="outline" className="min-h-11 text-destructive" onClick={() => setStatus(b.id, "rejected")}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : tab === "listings" ? (
        <ul className="space-y-2">
          {all.map((b) => {
            const s = statusOf(b.id);
            return (
              <li key={b.id} className="bg-card rounded-xl p-3 shadow-sm flex items-center gap-3">
                <img src={b.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{b.name}</p>
                  <Badge variant={statusVariant[s]} className="capitalize mt-0.5">{s}</Badge>
                </div>
                {s === "approved" ? (
                  <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={`Hide ${b.name}`} onClick={() => setStatus(b.id, "hidden")}><EyeOff className="w-4 h-4" /></Button>
                ) : (
                  <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={`Publish ${b.name}`} onClick={() => setStatus(b.id, "approved")}><Eye className="w-4 h-4" /></Button>
                )}
              </li>
            );
          })}
        </ul>
      ) : tab === "reports" ? (
        reports.length === 0 ? empty("No reports yet.") : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="bg-card rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <Flag className="w-4 h-4 mt-1 text-destructive shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{nameOf(r.businessId)}</p>
                    <p className="text-sm">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">{r.reporter} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={r.status === "open" ? "destructive" : "secondary"} className="capitalize">{r.status}</Badge>
                </div>
                {r.status === "open" && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button className="min-h-11 text-xs" onClick={() => reportService.setStatus(r.id, "resolved")}>Resolve</Button>
                    <Button variant="outline" className="min-h-11 text-xs" onClick={() => reportService.setStatus(r.id, "dismissed")}>Dismiss</Button>
                    <Button variant="outline" className="min-h-11 text-xs text-destructive" onClick={() => { setStatus(r.businessId, "hidden"); reportService.setStatus(r.id, "resolved"); }}>Hide listing</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="space-y-2">
          {userService.list().map((u) => (
            <li key={u.id} className="bg-card rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
              <div className="min-w-0"><p className="font-medium truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.phone} {u.email && `· ${u.email}`}</p></div>
              <Badge variant="secondary" className="capitalize">{u.userType === "client" ? "customer" : u.userType}</Badge>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
};

export default AdminPage;
