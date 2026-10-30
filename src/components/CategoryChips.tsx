import { useCategories } from "@/hooks/use-data";
import { ALL } from "@/services";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (name: string) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  const { data: categories = [] } = useCategories();
  const names = [ALL, ...categories.map((c) => c.name)];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x" role="tablist" aria-label="Categories">
      {names.map((name) => (
        <button
          key={name}
          role="tab"
          aria-selected={value === name}
          onClick={() => onChange(name)}
          className={cn(
            "snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            value === name
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
