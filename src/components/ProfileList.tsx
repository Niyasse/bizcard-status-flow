import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { Business } from "@/types";

export function ProfileList({ profiles }: { profiles: Business[] }) {
  return (
    <div className="bg-card rounded-md shadow-sm overflow-hidden divide-y">
      {profiles.length > 0 ? (
        profiles.map((p) => (
          <Link
            to={`/profile/${p.id}`}
            key={p.id}
            className="flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-muted/60 transition"
          >
            <div className={p.hasNewStatus ? "status-ring p-0.5" : ""}>
              <img src={p.logo} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{p.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{p.tagline}</p>
            </div>
            <span className="flex items-center text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              {p.lastUpdated}
            </span>
          </Link>
        ))
      ) : (
        <div className="py-8 text-center text-muted-foreground">No businesses found here yet</div>
      )}
    </div>
  );
}
