import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, List, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileList, type ListView } from "@/components/ProfileList";
import { CategoryChips } from "@/components/CategoryChips";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { BusinessSearch } from "@/components/BusinessSearch";
import { useBusinesses } from "@/hooks/use-data";
import { ALL } from "@/services";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [view, setView] = useState<ListView>("list");
  const [location, setLocation] = useState<LocationValue>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data: businesses = [], isLoading } = useBusinesses({ search, category, ...location });
  const filterCount = [location.districtId, location.localityId].filter(Boolean).length;

  return (
    <AppShell>
      <BusinessSearch query={search} onChange={setSearch} />

      <div className="mb-3 bg-card rounded-lg p-2 shadow-sm">
        <CategoryChips value={category} onChange={setCategory} />
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs text-muted-foreground flex-1" aria-live="polite">
          {businesses.length} {businesses.length === 1 ? "business" : "businesses"}
        </p>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`h-9 px-3 text-sm font-medium rounded-md border flex items-center gap-1 ${showFilters || filterCount ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-foreground"}`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters{filterCount > 0 && ` (${filterCount})`}
        </button>
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

      {showFilters && (
        <div className="mb-3 bg-card rounded-lg p-3 shadow-sm">
          <LocationFilter value={location} onChange={setLocation} />
          {filterCount > 0 && (
            <button type="button" onClick={() => setLocation({})} className="mt-2 text-xs text-primary flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="bg-card rounded-md p-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <ProfileList profiles={businesses} view={view} />
      )}
    </AppShell>
  );
};

export default Index;
