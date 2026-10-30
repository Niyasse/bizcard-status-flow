import { ReactNode } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  /** Show the customer bottom navigation (default true) */
  showBottomNav?: boolean;
  className?: string;
}

export function AppShell({ children, showBottomNav = true, className }: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main
        className={cn(
          "flex-1 w-full mx-auto max-w-2xl px-3 sm:px-4 py-4",
          showBottomNav && "pb-24",
          className,
        )}
      >
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
