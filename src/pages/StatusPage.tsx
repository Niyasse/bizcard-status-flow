import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusItem } from "@/components/StatusItem";
import { useUpdates } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

const StatusPage = () => {
  const [filter, setFilter] = useState("all");
  const { data: updates = [] } = useUpdates();
  const companies = Array.from(new Map(updates.map((u) => [u.companyId, u])).values());
  const shown = filter === "all" ? updates : updates.filter((u) => u.companyId === filter);

  const chip = (active: boolean) =>
    cn(
      "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center",
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
    );

  return (
    <AppShell>
      <PageHeader
        title="Offers & Updates"
        subtitle="Short offers from Kerala businesses"
        actions={
          <Link to="/create-status" className="h-9 px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground flex items-center">
            <Plus className="w-4 h-4 mr-1" /> New
          </Link>
        }
      />
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-4">
        <button className={chip(filter === "all")} onClick={() => setFilter("all")}>All</button>
        {companies.map((u) => (
          <button key={u.companyId} className={chip(filter === u.companyId)} onClick={() => setFilter(u.companyId)}>
            <img src={u.companyLogo} alt="" className="w-4 h-4 rounded-full mr-1" />
            {u.companyName}
          </button>
        ))}
      </div>
      {shown.length ? shown.map((u) => <StatusItem key={u.id} status={u} />) : (
        <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">No updates right now</div>
      )}
    </AppShell>
  );
};

export default StatusPage;
