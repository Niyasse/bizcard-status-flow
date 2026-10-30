import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, List, LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileList, type ListView } from "@/components/ProfileList";
import { CategoryChips } from "@/components/CategoryChips";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { useBusinesses } from "@/hooks/use-data";
import { ALL } from "@/services";

const Index = () => {
  const [category, setCategory] = useState(ALL);
  const [view, setView] = useState<ListView>("list");
  const [location, setLocation] = useState<LocationValue>({});
  const { data: businesses = [], isLoading } = useBusinesses({ category, ...location });

  return (
    <AppShell>
      <div className="mb-3 bg-card rounded-lg p-2 shadow-sm">
        <CategoryChips value={category} onChange={setCategory} />
      </div>

      <div className="flex items-end justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <MapPin className="h-5 w-5 mt-6 text-primary shrink-0" />
          <LocationFilter value={location} onChange={setLocation} />
        </div>
        <div className="shrink-0 flex rounded-md border bg-card overflow-hidden">
          {([["list", List], ["grid", LayoutGrid]] as const).map(([v, Icon]) => (
            <button
              key={v}
              type="button"
              aria-label={`${v} view`}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`h-9 w-9 flex items-center justify-center ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <Link
          to="/create-profile"
          className="shrink-0 h-9 px-3 text-sm font-medium rounded-md bg-primary text-primary-foreground flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-md p-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <ProfileList profiles={businesses} view={view} />
      )}

      <div className="mt-6 bg-card p-4 rounded-lg shadow-sm">
        <h2 className="text-base font-medium mb-1">Welcome to Bizapp</h2>
        <p className="text-muted-foreground text-sm">
          Discover Kerala businesses, save their digital cards and catch their latest offers.
        </p>
      </div>
    </AppShell>
  );
};

export default Index;
