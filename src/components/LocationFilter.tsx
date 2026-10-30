import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDistricts, useLocalities } from "@/hooks/use-data";

export interface LocationValue {
  districtId?: string;
  localityId?: string;
}

const ANY = "__any";

export function LocationFilter({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const { data: districts = [] } = useDistricts();
  const { data: localities = [] } = useLocalities(value.districtId);

  return (
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-xs font-medium text-muted-foreground mb-1">Location</span>
      <div className="flex gap-2">
        <Select
          value={value.districtId ?? ANY}
          onValueChange={(v) => onChange({ districtId: v === ANY ? undefined : v })}
        >
          <SelectTrigger className="h-9 bg-card min-w-0" aria-label="District">
            <SelectValue placeholder="All Kerala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All Kerala</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.localityId ?? ANY}
          onValueChange={(v) => onChange({ ...value, localityId: v === ANY ? undefined : v })}
          disabled={!value.districtId}
        >
          <SelectTrigger className="h-9 bg-card min-w-0" aria-label="Town or locality">
            <SelectValue placeholder="Any town" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any town</SelectItem>
            {localities.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
