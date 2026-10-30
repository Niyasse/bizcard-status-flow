import { Link } from "react-router-dom";
import { Edit, Share2, Eye, Plus, QrCode, Megaphone, BarChart3, Bookmark, MessageCircle, ScanLine } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessCard, profileUrl } from "@/components/BusinessCard";
import { BusinessQrCode } from "@/components/BusinessQrCode";
import { Button } from "@/components/ui/button";
import { useMyBusiness, useOwnUpdates, useTracking, useWallet } from "@/hooks/use-data";
import { mockBaseline, trackingService, moderationService, MY_BUSINESS_ID } from "@/services";
import { isActive, MAX_ACTIVE_UPDATES } from "@/lib/engagement";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { data: b, isLoading } = useMyBusiness();
  const { toast } = useToast();
  const track = useTracking();
  const { savedIds } = useWallet();
  const own = useOwnUpdates();

  if (isLoading) return <AppShell><p className="text-center text-muted-foreground py-8">Loading…</p></AppShell>;

  if (!b) {
    return (
      <AppShell>
        <PageHeader title="Business dashboard" backTo="/" />
        <div className="bg-card rounded-xl p-6 text-center shadow-sm">
          <h2 className="font-bold text-lg mb-2">Create your digital business card</h2>
          <p className="text-sm text-muted-foreground mb-4">Register in 3 quick steps and share your card with a QR code.</p>
          <Button asChild><Link to="/create-profile"><Plus className="w-4 h-4 mr-2" />Register business</Link></Button>
        </div>
      </AppShell>
    );
  }

  const url = profileUrl(b.id);
  const base = mockBaseline(b.id);
  const stats = [
    { label: "Views", value: base.views + (track.views[b.id] ?? 0), icon: Eye },
    { label: "Saves", value: base.saves + (savedIds.includes(b.id) ? 1 : 0), icon: Bookmark },
    { label: "QR visits", value: base.qrVisits + (track.qrVisits[b.id] ?? 0), icon: ScanLine },
    { label: "Enquiries", value: base.enquiries + track.enquiries.filter((e) => e.businessId === b.id).length, icon: MessageCircle },
  ];
  const recent = track.enquiries.filter((e) => e.businessId === b.id).slice(0, 3);
  const activeCount = own.filter((u) => isActive(u)).length;
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: b.name, text: `${b.name} — ${b.tagline}`, url }); } catch { /* cancelled */ } return; }
    await navigator.clipboard?.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  return (
    <AppShell>
      <PageHeader title="My business card" subtitle={b.tags.join(" · ")} backTo="/" />
      {(() => { const st = moderationService.statusOf(b.id, b.id === MY_BUSINESS_ID); return st !== "approved" && (
        <p role="status" className="mb-3 rounded-lg bg-secondary px-3 py-2 text-sm">
          Listing status: <strong className="capitalize">{st}</strong>{st === "pending" ? " — visible in Discover after admin approval." : " — not visible in Discover."}
        </p>); })()}
      <BusinessCard id={b.id} name={b.name} logo={b.logo} tagline={b.tagline} phone={b.phone} email={b.email}
        website={b.website} address={b.address} social={b.social} services={b.services} whatsapp={b.whatsapp}
        template={b.template} orientation={b.orientation} />
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Button asChild variant="outline"><Link to="/edit-profile"><Edit className="w-4 h-4 mr-1" />Edit</Link></Button>
        <Button asChild variant="outline"><Link to={`/profile/${b.id}`}><Eye className="w-4 h-4 mr-1" />Preview</Link></Button>
        <Button onClick={share}><Share2 className="w-4 h-4 mr-1" />Share</Button>
      </div>
      <section className="bg-card rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-bold flex items-center mb-3"><BarChart3 className="w-5 h-5 mr-2 text-primary" />Insights <span className="ml-2 text-xs font-normal text-muted-foreground">(demo numbers)</span></h2>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-secondary rounded-lg p-2 text-center">
              <s.icon className="w-4 h-4 mx-auto text-primary" />
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {recent.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Recent WhatsApp enquiries</p>
            {recent.map((e) => <p key={e.ref}>{e.ref} · {new Date(e.at).toLocaleString()}</p>)}
          </div>
        )}
      </section>
      <section className="bg-card rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-bold flex items-center mb-3"><QrCode className="w-5 h-5 mr-2 text-primary" />Profile QR code</h2>
        <BusinessQrCode id={b.id} name={b.name} />
        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => { trackingService.qrVisit(b.id); toast({ title: "Simulated QR scan recorded" }); }}>
          <ScanLine className="w-4 h-4 mr-2" />Simulate a scan
        </Button>
      </section>
      <Link to="/create-status" className="flex items-center gap-2 bg-card rounded-xl p-4 shadow-sm text-primary font-medium">
        <Megaphone className="w-5 h-5" /><span className="flex-1">Manage updates</span>
        <span className="text-xs text-muted-foreground">{activeCount}/{MAX_ACTIVE_UPDATES} active</span>
      </Link>
    </AppShell>
  );
};

export default Dashboard;
