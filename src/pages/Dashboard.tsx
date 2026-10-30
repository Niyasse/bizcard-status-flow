import { Link } from "react-router-dom";
import { Edit, Share2, Eye, Plus, QrCode, Megaphone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessCard, profileUrl } from "@/components/BusinessCard";
import { BusinessQrCode } from "@/components/BusinessQrCode";
import { Button } from "@/components/ui/button";
import { useMyBusiness } from "@/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { data: b, isLoading } = useMyBusiness();
  const { toast } = useToast();

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
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: b.name, text: `${b.name} — ${b.tagline}`, url }); } catch { /* cancelled */ } return; }
    await navigator.clipboard?.writeText(url);
    toast({ title: "Link copied", description: url });
  };

  return (
    <AppShell>
      <PageHeader title="My business card" subtitle={b.tags.join(" · ")} backTo="/" />
      <BusinessCard id={b.id} name={b.name} logo={b.logo} tagline={b.tagline} phone={b.phone} email={b.email}
        website={b.website} address={b.address} social={b.social} services={b.services} whatsapp={b.whatsapp}
        template={b.template} orientation={b.orientation} />
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Button asChild variant="outline"><Link to="/edit-profile"><Edit className="w-4 h-4 mr-1" />Edit</Link></Button>
        <Button asChild variant="outline"><Link to={`/profile/${b.id}`}><Eye className="w-4 h-4 mr-1" />Preview</Link></Button>
        <Button onClick={share}><Share2 className="w-4 h-4 mr-1" />Share</Button>
      </div>
      <section className="bg-card rounded-xl p-4 shadow-sm mb-4">
        <h2 className="font-bold flex items-center mb-3"><QrCode className="w-5 h-5 mr-2 text-primary" />Profile QR code</h2>
        <BusinessQrCode id={b.id} name={b.name} />
      </section>
      <Link to="/create-status" className="flex items-center gap-2 bg-card rounded-xl p-4 shadow-sm text-primary font-medium">
        <Megaphone className="w-5 h-5" />Post an offer
      </Link>
    </AppShell>
  );
};

export default Dashboard;
