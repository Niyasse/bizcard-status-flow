import { useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { trackingService } from "@/services";
import { Megaphone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessCard } from "@/components/BusinessCard";
import { SaveButton } from "@/components/SaveButton";
import { StatusItem } from "@/components/StatusItem";
import { useBusiness, useUpdates } from "@/hooks/use-data";

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading } = useBusiness(id);
  const { data: updates = [] } = useUpdates(id);
  const [params] = useSearchParams();
  const fromQr = params.get("src") === "qr";
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || tracked.current === id) return;
    tracked.current = id;
    trackingService.view(id);
    if (fromQr) trackingService.qrVisit(id);
  }, [id, fromQr]);

  if (isLoading) return <AppShell><p className="text-center text-muted-foreground py-8">Loading…</p></AppShell>;

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center py-8">
          <p>Business not found</p>
          <Link to="/" className="text-primary mt-2 inline-block">Back to home</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title={profile.name} subtitle={profile.tags.join(" · ")} backTo="/" />
      <BusinessCard
        id={profile.id}
        name={profile.name}
        logo={profile.logo}
        tagline={profile.tagline}
        phone={profile.phone}
        email={profile.email}
        website={profile.website}
        address={profile.address}
        social={profile.social}
        template={profile.template}
        orientation={profile.orientation}
        whatsapp={profile.whatsapp}
        services={profile.services}
      />
      <SaveButton businessId={profile.id} />
      <section className="mt-6">
        <h2 className="text-base font-bold flex items-center mb-3">
          <Megaphone className="w-5 h-5 mr-2 text-primary" /> Latest offers
        </h2>
        {updates.length ? updates.map((u) => <StatusItem key={u.id} status={u} />) : (
          <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">No offers yet</div>
        )}
      </section>
    </AppShell>
  );
};

export default ProfilePage;
