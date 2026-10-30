import { Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { BusinessUpdate } from "@/types";

export function StatusItem({ status }: { status: BusinessUpdate }) {
  const hoursLeft = Math.max(0, Math.floor((new Date(status.expiresAt).getTime() - Date.now()) / 3600_000));
  const expiry = hoursLeft === 0 ? "Expires soon" : `Expires in ${hoursLeft}h`;

  return (
    <article className="bg-card rounded-lg shadow-sm p-4 mb-3 slide-in">
      <Link to={`/profile/${status.companyId}`} className="flex items-center gap-3 mb-2">
        <img src={status.companyLogo} alt={status.companyName} className="w-10 h-10 rounded-full object-cover" />
        <div className="min-w-0">
          <h3 className="font-medium text-foreground truncate">{status.companyName}</h3>
          <span className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" /> {expiry}
          </span>
        </div>
      </Link>
      <p className="text-foreground/90 text-sm">{status.content}</p>
      {status.link && (
        <a
          href={status.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" /> {status.link.title}
        </a>
      )}
    </article>
  );
}
