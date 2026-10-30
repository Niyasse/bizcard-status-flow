import { useState } from "react";
import { Search, X, Clock } from "lucide-react";
import { recentSearchService } from "@/services";
import { useBusinesses } from "@/hooks/use-data";

export function BusinessSearch({ query, onChange }: { query: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState(recentSearchService.get);
  const { data: matches = [] } = useBusinesses({ search: query });
  const suggestions = query.trim() ? matches.slice(0, 4).map((b) => b.name) : recent;
  const remember = (s: string) => s.trim() && setRecent(recentSearchService.add(s));

  return (
    <div className="relative mb-3">
      <form role="search" onSubmit={(e) => { e.preventDefault(); remember(query); setFocused(false); }}>
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search businesses"
          placeholder="Search businesses, services, places… / മലയാളം"
          className="w-full h-10 pl-9 pr-9 bg-card rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-ring/40"
          value={query}
          onFocus={() => setFocused(true)}
          onBlur={() => { remember(query); setFocused(false); }}
          onChange={(e) => onChange(e.target.value)}
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => onChange("")}
            className="absolute right-2 top-2 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      {focused && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-11 z-30 rounded-md border bg-popover p-1 shadow-md">
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <span>{query ? "Suggestions" : "Recent searches"}</span>
            {!query && (
              <button type="button" className="text-primary" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { recentSearchService.clear(); setRecent([]); }}>Clear</button>
            )}
          </div>
          {suggestions.map((s) => (
            <button key={s} type="button" onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s); remember(s); setFocused(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm text-left rounded hover:bg-muted">
              {query ? <Search className="h-4 w-4 text-muted-foreground" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
