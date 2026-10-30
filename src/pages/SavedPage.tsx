import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileList } from "@/components/ProfileList";
import { SaveButton } from "@/components/SaveButton";
import { useBusinesses, useWallet } from "@/hooks/use-data";

const SavedPage = () => {
  const { savedIds } = useWallet();
  const { data: all = [] } = useBusinesses();
  const saved = all.filter((b) => savedIds.includes(b.id));

  return (
    <AppShell>
      <PageHeader title="Saved cards" subtitle="Businesses you follow" />
      {saved.length ? (
        <div className="space-y-2">
          {saved.map((b) => (
            <div key={b.id} className="bg-card rounded-md shadow-sm overflow-hidden">
              <ProfileList profiles={[b]} />
              <SaveButton businessId={b.id} className="px-3 pb-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg p-6 text-center text-muted-foreground text-sm">
          No saved cards yet. Open a business and tap “Save card & follow”.
        </div>
      )}
    </AppShell>
  );
};

export default SavedPage;
