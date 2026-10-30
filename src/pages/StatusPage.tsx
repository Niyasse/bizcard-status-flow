import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusItem } from "@/components/StatusItem";
import { useBusinesses, useCategories, useDistricts, useLocalities, usePrefs, useUpdates, useWallet } from "@/hooks/use-data";
import { prefsService, walletService } from "@/services";
import { unreadUpdates } from "@/lib/engagement";
import { cn } from "@/lib/utils";

type Feed = "following" | "near" | "all";
const selectCls = "h-9 rounded-md border bg-card px-2 text-sm min-w-0";

const StatusPage = () => {
  const [feed, setFeed] = useState<Feed>("following");
  const [districtId, setDistrictId] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [category, setCategory] = useState("");
  const [expiry, setExpiry] = useState<"any" | "6" | "24">("any");
  const wallet = useWallet();
  const prefs = usePrefs();
  const { data: allUpdates = [] } = useUpdates();
  const { data: businesses = [] } = useBusinesses();
  const { data: districts = [] } = useDistricts();
  const { data: localities = [] } = useLocalities(districtId || undefined);
  const { data: categories = [] } = useCategories();

  const followState = { ...wallet, ...prefs };
  const unread = unreadUpdates(allUpdates, followState);
  const unreadIds = new Set(unread.map((u) => u.id));
  // Snapshot unread ids when opening the feed so dots stay visible this visit.
  const [seenUnread, setSeenUnread] = useState<Set<string>>(new Set());

  const shown = useMemo(() => {
    if (feed === "following") return walletService.followedUpdates(allUpdates, wallet);
    if (feed === "all") return allUpdates;
    const byId = new Map(businesses.map((b) => [b.id, b]));
    const now = Date.now();
    return allUpdates.filter((u) => {
      const b = byId.get(u.companyId);
      if (!b) return false;
      if (districtId && b.districtId !== districtId) return false;
      if (localityId && b.localityId !== localityId) return false;
      if (category && !b.categoryIds.includes(category)) return false;
      if (expiry !== "any" && new Date(u.expiresAt).getTime() - now > Number(expiry) * 3600_000) return false;
      return true;
    });
  }, [feed, allUpdates, wallet, businesses, districtId, localityId, category, expiry]);

  useEffect(() => {
    if (feed !== "following" || !unread.length) return;
    setSeenUnread((s) => new Set([...s, ...unread.map((u) => u.id)]));
    const t = setTimeout(() => prefsService.markRead(unread.map((u) => u.id)), 1500);
    return () => clearTimeout(t);
  }, [feed, unread.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (active: boolean) => cn(
    "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5",
    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
  );

  return (
    <AppShell>
      <PageHeader title="Offers & Updates" subtitle="Short offers from Kerala businesses"
        actions={<Link to="/create-status" className="h-9 px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground flex items-center"><Plus className="w-4 h-4 mr-1" /> Post</Link>} />
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        <button className={chip(feed === "following")} onClick={() => setFeed("following")}>
          Following {unread.length > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-brand-accent text-primary-foreground text-xs flex items-center justify-center">{unread.length}</span>}
        </button>
        <button className={chip(feed === "near")} onClick={() => setFeed("near")}>Offers near you</button>
        <button className={chip(feed === "all")} onClick={() => setFeed("all")}>All</button>
      </div>

      {feed === "near" && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <select aria-label="District" className={selectCls} value={districtId} onChange={(e) => { setDistrictId(e.target.value); setLocalityId(""); }}>
            <option value="">All districts</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select aria-label="Locality" className={selectCls} value={localityId} onChange={(e) => setLocalityId(e.target.value)}>
            <option value="">All towns</option>
            {localities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select aria-label="Category" className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Expiry" className={selectCls} value={expiry} onChange={(e) => setExpiry(e.target.value as typeof expiry)}>
            <option value="any">Any expiry</option>
            <option value="6">Ending in 6h</option>
            <option value="24">Ending today</option>
          </select>
        </div>
      )}

      {feed === "following" && shown.length > 0 && (
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <CheckCheck className="w-3.5 h-3.5" />{unread.length ? `${unread.length} new` : "All caught up"}
        </p>
      )}

      {shown.length ? shown.map((u) => (
        <StatusItem key={u.id} status={u} unread={feed === "following" && (unreadIds.has(u.id) || seenUnread.has(u.id))} />
      )) : (
        <div className="bg-card rounded-lg p-6 text-center text-muted-foreground text-sm">
          {feed === "following" ? "No offers from your saved cards. Save a business to follow its offers."
            : feed === "near" ? "No offers match these filters." : "No updates right now"}
        </div>
      )}
    </AppShell>
  );
};

export default StatusPage;
