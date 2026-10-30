import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, backTo, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {backTo && (
        <Link to={backTo} aria-label="Back" className="p-2 -ml-2 rounded-full text-primary hover:bg-primary/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
