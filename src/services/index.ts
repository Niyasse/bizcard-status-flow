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

export function filterBusinesses(list: Business[], f: BusinessFilter = {}): Business[] {
  const q = f.search?.trim().toLowerCase();
  return list.filter((b) =>
    (!f.category || f.category === ALL || b.tags.includes(f.category)) &&
    (!f.districtId || b.districtId === f.districtId) &&
    (!f.localityId || b.localityId === f.localityId) &&
    (!q || b.name.toLowerCase().includes(q) || b.tagline.toLowerCase().includes(q)),
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
