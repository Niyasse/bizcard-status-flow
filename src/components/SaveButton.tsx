import { Bookmark, BookmarkCheck, Bell, BellOff, BellRing } from "lucide-react";
import { usePrefs, useWallet } from "@/hooks/use-data";
import { prefsService, walletService } from "@/services";
import { cn } from "@/lib/utils";

export function SaveButton({ businessId, className }: { businessId: string; className?: string }) {
  const { savedIds, mutedIds } = useWallet();
  const saved = savedIds.includes(businessId);
  const muted = mutedIds.includes(businessId);
  const alertsOn = !usePrefs().alertsOffIds.includes(businessId);
  return (
    <div className={cn("flex gap-2", className)}>
      <button
        type="button"
        onClick={() => walletService.toggleSave(businessId)}
        className={cn(
          "flex-1 h-10 rounded-md text-sm font-medium flex items-center justify-center gap-1.5",
          saved ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        {saved ? "Saved · Following" : "Save card & follow"}
      </button>
      {saved && (
        <button
          type="button"
          aria-label={muted ? "Unmute offers" : "Mute offers"}
          onClick={() => walletService.toggleMute(businessId)}
          className="h-10 px-3 rounded-md border bg-card text-sm flex items-center gap-1.5 text-muted-foreground"
        >
          {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {muted ? "Muted" : "Mute"}
        </button>
      )}
      {saved && !muted && (
        <button
          type="button"
          aria-label={alertsOn ? "Turn alerts off" : "Turn alerts on"}
          aria-pressed={alertsOn}
          onClick={() => prefsService.toggleAlerts(businessId)}
          className={cn("h-10 px-3 rounded-md border text-sm flex items-center gap-1.5",
            alertsOn ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground")}
        >
          <BellRing className="w-4 h-4" />{alertsOn ? "Alerts on" : "Alerts off"}
        </button>
      )}
    </div>
  );
}
