import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryChips } from "@/components/CategoryChips";
import { useBusinesses } from "@/hooks/use-data";
import { ALL } from "@/services";

const CompanyListingPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const { data: businesses = [] } = useBusinesses({ search, category });

  return (
    <AppShell>
      <PageHeader title="Categories" subtitle="Browse Kerala businesses by category" />
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search businesses…"
          aria-label="Search businesses"
          className="w-full h-10 pl-9 pr-4 bg-card rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-ring/40"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mb-4"><CategoryChips value={category} onChange={setCategory} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {businesses.map((b) => (
          <Link
            key={b.id}
            to={`/profile/${b.id}`}
            className="bg-card rounded-xl shadow-sm p-3 flex flex-col items-center text-center hover:shadow-md transition"
          >
            <img src={b.logo} alt={b.name} className="w-16 h-16 rounded-full mb-2" />
            <h3 className="font-medium text-sm text-foreground line-clamp-1">{b.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{b.tagline}</p>
          </Link>
        ))}
      </div>
      {!businesses.length && <p className="text-center text-muted-foreground py-8">No businesses found</p>}
    </AppShell>
  );
};

export default CompanyListingPage;
