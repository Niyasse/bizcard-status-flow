// Service layer: the only place UI gets data from.
// Connects to Supabase when configured, with mock/local data in development.
import * as db from "@/data/mockData";
import { ownUpdateService } from "./engagement";
export * from "./engagement";
export * from "./admin";
import { moderationService, moderationStore } from "./admin";
import { isPublicListing } from "@/lib/auth";
import { isSupabaseConfigured, supabase, uploadBusinessLogo, isValidUuid, isProd } from "@/lib/supabase";
import type {
  Business, BusinessFilter, BusinessUpdate, CardTemplate, Category, District, Locality, ServiceProfessional, ListingStatus,
} from "@/types";

const delay = <T,>(v: T) => Promise.resolve(structuredClone(v));

const withTimeout = <T,>(p: PromiseLike<T>, ms = 1200): Promise<T> =>
  Promise.race([
    Promise.resolve(p),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Supabase request timeout")), ms)),
  ]);

export const ALL = "All";

export const locationService = {
  getDistricts: async (): Promise<District[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await withTimeout(
          supabase.from("districts").select("id, name").order("name")
        );
        if (!error && data && data.length > 0) {
          return data;
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase getDistricts error, using fallback:", e);
      }
    }
    if (isProd) throw new Error("Districts unavailable in production.");
    return delay(db.districts);
  },

  getLocalities: async (districtId?: string): Promise<Locality[]> => {
    if (isSupabaseConfigured()) {
      try {
        let q = supabase.from("localities").select("id, name, district_id").order("name");
        if (districtId) {
          q = q.eq("district_id", districtId);
        }
        const { data, error } = await withTimeout(q);
        if (!error && data && data.length > 0) {
          return data.map((l: any) => ({
            id: l.id,
            name: l.name,
            districtId: l.district_id,
          }));
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase getLocalities error, using fallback:", e);
      }
    }
    if (isProd) throw new Error("Localities unavailable in production.");
    return delay(districtId ? db.localities.filter((l) => l.districtId === districtId) : db.localities);
  },
};

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await withTimeout(
          supabase.from("categories").select("id, name, name_ml, kind").order("name")
        );
        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            nameMl: c.name_ml ?? undefined,
            kind: c.kind,
          }));
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase getCategories error, using fallback:", e);
      }
    }
    if (isProd) throw new Error("Categories unavailable in production.");
    return delay(db.categories);
  },
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
  const filtered = list.filter((b) =>
    (!f.category || f.category === ALL || b.tags.includes(f.category)) &&
    (!f.districtId || b.districtId === f.districtId) &&
    (!f.localityId || b.localityId === f.localityId) &&
    (!q || searchText(b).includes(q)),
  );

  if (f.page !== undefined && f.pageSize !== undefined && f.pageSize > 0) {
    const start = f.page * f.pageSize;
    return filtered.slice(start, start + f.pageSize);
  }

  return filtered;
}

/* ---------- Owner's registered business (localStorage fallback until backend exists) ---------- */
const MY_BUSINESS_KEY = "bizapp.myBusiness";
export const MY_BUSINESS_ID = "my-business";

function readMine(): Business | null {
  try {
    const v = JSON.parse(localStorage.getItem(MY_BUSINESS_KEY) ?? "null");
    return v && v.id ? v : null;
  } catch {
    return null;
  }
}

const allBusinesses = (): Business[] => {
  const m = readMine();
  return m ? [m, ...db.businesses] : db.businesses;
};

function mapRowToBusiness(row: any): Business {
  const categoryIds = (row.business_categories || []).map((bc: any) => bc.category_id || bc.categories?.id).filter(Boolean);
  const tags = (row.business_categories || []).map((bc: any) => bc.categories?.name).filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    nameMl: row.name_ml ?? undefined,
    logo: row.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=128C7E&color=fff`,
    tagline: row.tagline,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email,
    website: row.website ?? undefined,
    address: row.address,
    districtId: row.district_id,
    localityId: row.locality_id,
    categoryIds,
    tags,
    social: row.social ?? undefined,
    services: row.services ?? undefined,
    template: row.template ?? "default",
    orientation: row.orientation ?? "landscape",
    lastUpdated: row.updated_at ? new Date(row.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
    hasNewStatus: false,
    ownerId: row.owner_id ?? undefined,
  };
}

export const businessService = {
  /** Public discovery: approved listings only with paginated search & joined filters. */
  list: async (filter?: BusinessFilter): Promise<Business[]> => {
    if (isSupabaseConfigured()) {
      try {
        const hasCategory = Boolean(filter?.category && filter.category !== ALL);
        let q = supabase
          .from("businesses")
          .select(`
            *,
            business_categories${hasCategory ? "!inner" : ""}(
              category_id,
              categories${hasCategory ? "!inner" : ""}(id, name, name_ml)
            )
          `)
          .eq("status", "approved")
          .order("updated_at", { ascending: false });

        if (filter?.districtId) q = q.eq("district_id", filter.districtId);
        if (filter?.localityId) q = q.eq("locality_id", filter.localityId);

        if (hasCategory) {
          q = q.eq("business_categories.categories.name", filter!.category);
        }

        if (filter?.search?.trim()) {
          const s = filter.search.trim();
          q = q.or(`name.ilike.%${s}%,name_ml.ilike.%${s}%,tagline.ilike.%${s}%,address.ilike.%${s}%`);
        }

        if (filter?.page !== undefined && filter?.pageSize) {
          const from = filter.page * filter.pageSize;
          const to = from + filter.pageSize - 1;
          q = q.range(from, to);
        }

        const { data, error } = await withTimeout(q);
        if (error) {
          if (isProd) throw error;
          console.warn("Supabase businessService.list error, using fallback:", error.message);
        } else if (data) {
          return data.map(mapRowToBusiness);
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase businessService.list error, using fallback:", e);
      }
    }

    if (isProd) {
      throw new Error("Supabase is not configured or failed in production environment.");
    }

    return delay(
      filterBusinesses(
        allBusinesses().filter((b) => isPublicListing(moderationService.statusOf(b.id, b.id === MY_BUSINESS_ID))),
        filter
      )
    );
  },

  /** Admin: every listing regardless of moderation status. */
  listAll: async (): Promise<Business[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select(`
            *,
            business_categories(
              category_id,
              categories(id, name, name_ml)
            )
          `)
          .order("created_at", { ascending: false });

        if (!error && data) {
          // Sync moderation store with actual database statuses
          const statuses: Record<string, ListingStatus> = {};
          data.forEach((row: any) => {
            if (row.status) statuses[row.id] = row.status;
          });
          const current = moderationStore.get();
          moderationStore.set({ statuses: { ...current.statuses, ...statuses } });

          return data.map(mapRowToBusiness);
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase listAll error, using fallback:", e);
      }
    }
    if (isProd) return [];
    return delay(allBusinesses());
  },

  getById: async (id: string): Promise<Business | null> => {
    if (isSupabaseConfigured() && isValidUuid(id)) {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select(`
            *,
            business_categories(
              category_id,
              categories(id, name, name_ml)
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          return mapRowToBusiness(data);
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase getById error, using fallback:", e);
      }
    }
    if (isProd) return null;
    return delay(allBusinesses().find((b) => b.id === id) ?? null);
  },
};

export const myBusinessService = {
  get: async (): Promise<Business | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const { data, error } = await supabase
            .from("businesses")
            .select(`
              *,
              business_categories(
                category_id,
                categories(id, name, name_ml)
              )
            `)
            .eq("owner_id", user.id)
            .maybeSingle();

          if (!error && data) {
            return mapRowToBusiness(data);
          }
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase myBusinessService.get error, using fallback:", e);
      }
    }
    if (isProd) return null;
    const local = readMine();
    if (local) return delay(local);
    return delay(db.businesses[0]);
  },

  save: async (input: Omit<Business, "id" | "tags" | "lastUpdated" | "hasNewStatus">): Promise<Business> => {
    if (isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const { data: existing } = await supabase
            .from("businesses")
            .select("id, status")
            .eq("owner_id", user.id)
            .maybeSingle();

          const bizId = existing?.id || (crypto.randomUUID ? crypto.randomUUID() : undefined);
          const uploadedLogo = bizId ? await uploadBusinessLogo(bizId, input.logo) : input.logo;

          const payload: any = {
            owner_id: user.id,
            name: input.name,
            name_ml: input.nameMl ?? null,
            logo: uploadedLogo,
            tagline: input.tagline,
            phone: input.phone,
            whatsapp: input.whatsapp ?? null,
            email: input.email,
            website: input.website ?? null,
            address: input.address,
            district_id: input.districtId,
            locality_id: input.localityId,
            services: input.services ?? [],
            social: input.social ?? {},
            template: input.template,
            orientation: input.orientation,
            status: existing ? existing.status : "pending",
          };
          if (bizId) payload.id = bizId;

          const { data: savedRow, error: upsertErr } = await supabase
            .from("businesses")
            .upsert(payload)
            .select("id")
            .single();

          if (!upsertErr && savedRow?.id) {
            const actualBizId = savedRow.id;
            await supabase.from("business_categories").delete().eq("business_id", actualBizId);
            if (input.categoryIds?.length) {
              const catRows = input.categoryIds.map((cid) => ({
                business_id: actualBizId,
                category_id: cid,
              }));
              await supabase.from("business_categories").insert(catRows);
            }

            const fresh = await businessService.getById(actualBizId);
            if (fresh) return fresh;
          } else {
            console.warn("Supabase upsert business error:", upsertErr?.message);
            if (isProd) throw upsertErr;
          }
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase myBusinessService.save error, using fallback:", e);
      }
    }

    if (isProd) {
      throw new Error("Cannot save business: user is not authenticated or Supabase failed in production.");
    }

    // Local fallback for dev
    const tags = db.categories.filter((c) => input.categoryIds.includes(c.id)).map((c) => c.name);
    const b: Business = { ...input, id: MY_BUSINESS_ID, tags, lastUpdated: "Just now", hasNewStatus: false };
    localStorage.setItem(MY_BUSINESS_KEY, JSON.stringify(b));
    return delay(b);
  },

  remove: async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          await supabase.from("businesses").delete().eq("owner_id", user.id);
        }
      } catch (e) {
        console.warn("Supabase remove error:", e);
      }
    }
    localStorage.removeItem(MY_BUSINESS_KEY);
  },
};

export const professionalService = {
  list: async (): Promise<ServiceProfessional[]> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from("professionals")
          .select(`
            *,
            professional_categories(category_id)
          `);
        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            profession: p.profession,
            photo: p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=2C3E50&color=fff`,
            phone: p.phone,
            whatsapp: p.whatsapp ?? undefined,
            districtId: p.district_id,
            localityId: p.locality_id,
            categoryIds: (p.professional_categories || []).map((pc: any) => pc.category_id),
            experienceYears: p.experience_years ?? 0,
          }));
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase professionalService.list error, using fallback:", e);
      }
    }
    if (isProd) return [];
    return delay(db.serviceProfessionals);
  },
};

export const updateService = {
  /** Active offers (mock + owner's own), newest first. */
  list: async (companyId?: string): Promise<BusinessUpdate[]> => {
    if (isSupabaseConfigured()) {
      try {
        let q = supabase
          .from("business_updates")
          .select(`
            *,
            businesses(id, name, logo)
          `)
          .gt("expires_at", new Date().toISOString())
          .order("posted_at", { ascending: false });

        if (companyId && isValidUuid(companyId)) {
          q = q.eq("business_id", companyId);
        }

        const { data, error } = await withTimeout(q);
        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            companyId: u.business_id,
            companyName: u.businesses?.name || "Business",
            companyLogo: u.businesses?.logo || "",
            content: u.content,
            link: u.link_url
              ? {
                  url: u.link_url,
                  title: u.link_title || "Visit",
                  platform: u.link_platform as any,
                }
              : undefined,
            postedAt: u.posted_at,
            expiresAt: u.expires_at,
          }));
        } else if (error && isProd) {
          throw error;
        }
      } catch (e) {
        if (isProd) throw e;
        console.warn("Supabase updateService.list error, using fallback:", e);
      }
    }

    if (isProd) return [];
    const now = Date.now();
    const all = [...ownUpdateService.list(), ...db.updates]
      .filter((u) => new Date(u.expiresAt).getTime() > now && (!companyId || u.companyId === companyId))
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return delay(all);
  },
};

export const templateService = {
  list: (): Promise<CardTemplate[]> => delay(db.cardTemplates),
};

/* ---------- Saved-card wallet (localStorage + Supabase sync) ---------- */
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
    const nextSavedIds = toggle(s.savedIds, id);
    const nextMutedIds = saved ? s.mutedIds.filter((x) => x !== id) : s.mutedIds;
    write({ savedIds: nextSavedIds, mutedIds: nextMutedIds });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const user = authData?.user;
        if (user) {
          if (saved) {
            supabase.from("saved_cards").delete().match({ user_id: user.id, business_id: id }).catch(() => {});
          } else {
            supabase.from("saved_cards").insert({ user_id: user.id, business_id: id }).catch(() => {});
          }
        }
      });
    }
  },

  toggleMute: (id: string) => {
    const s = read();
    const nextMutedIds = toggle(s.mutedIds, id);
    const willBeMuted = nextMutedIds.includes(id);
    write({ ...s, mutedIds: nextMutedIds });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const user = authData?.user;
        if (user) {
          supabase.from("saved_cards").update({ muted: willBeMuted }).match({ user_id: user.id, business_id: id }).catch(() => {});
        }
      });
    }
  },

  /** Sync saved and muted cards from Supabase for current authenticated user. */
  sync: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from("saved_cards")
        .select("business_id, muted")
        .eq("user_id", user.id);
      if (!error && data) {
        const savedIds = data.map((r: any) => r.business_id);
        const mutedIds = data.filter((r: any) => r.muted).map((r: any) => r.business_id);
        write({ savedIds, mutedIds });
      }
    } catch (e) {
      console.warn("Supabase walletService.sync error:", e);
    }
  },

  /** Offers from saved, unmuted businesses. */
  followedUpdates: (all: BusinessUpdate[], s: WalletState = read()) =>
    all.filter((u) => s.savedIds.includes(u.companyId) && !s.mutedIds.includes(u.companyId)),

  _reset: () => {
    cache = { savedIds: [], mutedIds: [] };
    try { localStorage.removeItem(WALLET_KEY); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  },
};

/* ---------- Recent searches (localStorage — stays local) ---------- */
const RECENT_KEY = "bizapp.recentSearches";
export const recentSearchService = {
  get: (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  },
  add: (q: string): string[] => {
    const t = q.trim();
    const next = t ? [t, ...recentSearchService.get().filter((x) => x !== t)].slice(0, 6) : recentSearchService.get();
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  },
  clear: () => { try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } },
};
