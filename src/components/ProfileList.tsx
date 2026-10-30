import { Link } from "react-router-dom";
import type { Business } from "@/types";

export type ListView = "list" | "grid";

export function ProfileList({ profiles, view = "list" }: { profiles: Business[]; view?: ListView }) {
  if (!profiles.length) {
    return (
      <div className="bg-card rounded-md shadow-sm py-8 text-center text-muted-foreground">
        No businesses found here yet
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {profiles.map((p) => (
          <Link
            to={`/profile/${p.id}`}
            key={p.id}
            className="bg-card rounded-lg shadow-sm p-2 flex flex-col items-center text-center hover:bg-muted/60 transition"
          >
            <div className={p.hasNewStatus ? "status-ring p-0.5 mb-1" : "mb-1"}>
              <img src={p.logo} alt={p.name} className="w-11 h-11 rounded-full object-cover" />
            </div>
            <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{p.name}</h3>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md shadow-sm overflow-hidden divide-y">
      {profiles.map((p) => (
        <Link
          to={`/profile/${p.id}`}
          key={p.id}
          className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/60 transition"
        >
          <div className={p.hasNewStatus ? "status-ring p-0.5 shrink-0" : "shrink-0"}>
            <img src={p.logo} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="flex-1 min-w-0 text-sm leading-4 font-medium text-foreground truncate">{p.name}</h3>
              <span className="text-[10px] text-muted-foreground shrink-0">{p.lastUpdated}</span>
            </div>
            <p className="text-[11px] leading-[13px] text-muted-foreground line-clamp-2">{p.tagline}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
