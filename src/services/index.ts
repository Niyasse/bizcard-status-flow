// Service layer: the only place UI gets data from.
// Every function is async so the mock implementation can later be swapped for backend calls
// without changing any component.
import * as db from "@/data/mockData";
import type {
  Business, BusinessFilter, BusinessUpdate, CardTemplate, Category, District, Locality, ServiceProfessional,
} from "@/types";

const delay = <T,>(v: T) => Promise.resolve(structuredClone(v));

export const ALL = "All";

export const locationService = {
  getDistricts: (): Promise<District[]> => delay(db.districts),
  getLocalities: (districtId?: string): Promise<Locality[]> =>
    delay(districtId ? db.localities.filter((l) => l.districtId === districtId) : db.localities),
};

export const categoryService = {
  getCategories: (): Promise<Category[]> => delay(db.categories),
};

/** English + Malayalam searchable text for a business (name, tagline, categories, place). */
function searchText(b: Business): string {
  const cats = db.categories.filter((c) => b.categoryIds.includes(c.id));
  const loc = db.localities.find((l) => l.id === b.localityId)?.name ?? "";
  const dist = db.districts.find((d) => d.id === b.districtId)?.name ?? "";
  return [b.name, b.nameMl, b.tagline, ...b.tags, ...cats.flatMap((c) => [c.name, c.nameMl]), loc, dist]
    .filter(Boolean).join(" ").toLowerCase();
}

export function filterBusinesses(list: Business[], f: BusinessFilter = {}): Business[] {
  const q = f.search?.trim().toLowerCase();
  return list.filter((b) =>
    (!f.category || f.category === ALL || b.tags.includes(f.category)) &&
    (!f.districtId || b.districtId === f.districtId) &&
    (!f.localityId || b.localityId === f.localityId) &&
    (!q || searchText(b).includes(q)),
  );
}

export const businessService = {
  list: (filter?: BusinessFilter): Promise<Business[]> => delay(filterBusinesses(db.businesses, filter)),
  getById: (id: string): Promise<Business | null> => delay(db.businesses.find((b) => b.id === id) ?? null),
};

export const professionalService = {
  list: (): Promise<ServiceProfessional[]> => delay(db.serviceProfessionals),
};

export const updateService = {
  list: (companyId?: string): Promise<BusinessUpdate[]> =>
    delay(companyId ? db.updates.filter((u) => u.companyId === companyId) : db.updates),
};

export const templateService = {
  list: (): Promise<CardTemplate[]> => delay(db.cardTemplates),
};

/* ---------- Saved-card wallet (localStorage until the backend exists) ---------- */
const WALLET_KEY = "bizapp.wallet";
export interface WalletState { savedIds: string[]; mutedIds: string[] }
const listeners = new Set<() => void>();
let cache: WalletState | null = null;

function read(): WalletState {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(WALLET_KEY) ?? "{}");
    cache = { savedIds: Array.isArray(raw.savedIds) ? raw.savedIds : [], mutedIds: Array.isArray(raw.mutedIds) ? raw.mutedIds : [] };
  } catch { cache = { savedIds: [], mutedIds: [] }; }
  return cache;
}
function write(next: WalletState) {
  cache = next;
  localStorage.setItem(WALLET_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const walletService = {
  get: read,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Saving a card follows the business; unsaving also clears its mute. */
  toggleSave: (id: string) => {
    const s = read();
    const saved = s.savedIds.includes(id);
    write({ savedIds: toggle(s.savedIds, id), mutedIds: saved ? s.mutedIds.filter((x) => x !== id) : s.mutedIds });
  },
  toggleMute: (id: string) => { const s = read(); write({ ...s, mutedIds: toggle(s.mutedIds, id) }); },
  /** Offers from saved, unmuted businesses. */
  followedUpdates: (all: BusinessUpdate[], s: WalletState = read()) =>
    all.filter((u) => s.savedIds.includes(u.companyId) && !s.mutedIds.includes(u.companyId)),
  _reset: () => { cache = null; },
};
