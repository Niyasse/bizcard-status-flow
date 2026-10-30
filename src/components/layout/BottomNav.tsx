import { NavLink } from "react-router-dom";
import { Compass, MessageSquare, LayoutGrid, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, type TKey } from "@/lib/i18n";

const tabs = [
  { to: "/", label: "discover", icon: Compass, end: true },
  { to: "/companies", label: "categories", icon: LayoutGrid, end: false },
  { to: "/saved", label: "myCards", icon: Wallet, end: false },
  { to: "/status", label: "updates", icon: MessageSquare, end: false },
] as const satisfies readonly { label: TKey; [k: string]: unknown }[];

export function BottomNav() {
  const { t } = useLanguage();
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-50 bg-card border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto max-w-2xl flex justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn("rounded-full px-4 py-1", isActive && "bg-primary/10")}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {t(label)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
