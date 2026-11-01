// Sprint 4 & 6D services: owner updates, read/alerts state, tracking, connected to Supabase.
import type { BusinessUpdate } from "@/types";
import { detectPlatform, makeReferenceId, type UpdateForm } from "@/lib/engagement";
import { isSupabaseConfigured, supabase, isValidUuid, isProd } from "@/lib/supabase";

export function store<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T | null = null;
  const get = (): T => {
    if (cache) return cache;
    try { cache = { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? "{}") }; } catch { cache = fallback; }
    return cache as T;
  };
  const set = (next: T) => {
    cache = next;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
  return { get, set, subscribe };
}

/* ---------- Owner's updates ---------- */
interface OwnState { items: BusinessUpdate[] }
export const ownUpdatesStore = store<OwnState>("bizapp.myUpdates", { items: [] });
export const ownUpdateService = {
  list: () => ownUpdatesStore.get().items,

  save: (biz: { id: string; name: string; logo: string }, f: UpdateForm, id?: string): BusinessUpdate => {
    const url = f.linkUrl.trim();
    const platform = url ? detectPlatform(url) : undefined;
    const prev = ownUpdatesStore.get().items.find((x) => x.id === id);
    const updateId = id ?? (crypto.randomUUID ? crypto.randomUUID() : `my-${Date.now()}`);
    const item: BusinessUpdate = {
      id: updateId,
      companyId: biz.id,
      companyName: biz.name,
      companyLogo: biz.logo,
      content: f.content.trim(),
      link: url
        ? {
            url,
            platform,
            title: f.linkTitle.trim() || ({ instagram: "View on Instagram", facebook: "View on Facebook", website: "Visit website" }[platform!] || "Visit"),
          }
        : undefined,
      postedAt: prev?.postedAt ?? new Date().toISOString(),
      expiresAt: new Date(f.expiresAt).toISOString(),
    };

    // Optimistically update store
    const items = ownUpdatesStore.get().items.filter((x) => x.id !== item.id);
    ownUpdatesStore.set({ items: [item, ...items] });

    // Sync to Supabase if valid UUID
    if (isSupabaseConfigured() && isValidUuid(biz.id)) {
      const row = {
        id: isValidUuid(updateId) ? updateId : undefined,
        business_id: biz.id,
        content: item.content,
        link_url: url || null,
        link_title: item.link?.title || null,
        link_platform: platform || null,
        posted_at: item.postedAt,
        expires_at: item.expiresAt,
      };

      supabase
        .from("business_updates")
        .upsert(row)
        .then(({ error }) => {
          if (error) {
            console.warn("Supabase save update error:", error.message);
          }
        })
        .catch((err) => {
          console.warn("Supabase save update exception:", err);
        });
    }

    return item;
  },

  remove: (id: string) => {
    ownUpdatesStore.set({ items: ownUpdatesStore.get().items.filter((x) => x.id !== id) });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase
        .from("business_updates")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase remove update error:", error.message);
        })
        .catch((err) => console.warn("Supabase remove update exception:", err));
    }
  },

  /** Sync updates for an owner's business from Supabase. */
  sync: async (businessId: string) => {
    if (!isSupabaseConfigured() || !isValidUuid(businessId)) return;
    try {
      const { data, error } = await supabase
        .from("business_updates")
        .select(`
          *,
          businesses(id, name, logo)
        `)
        .eq("business_id", businessId)
        .order("posted_at", { ascending: false });

      if (!error && data) {
        const items: BusinessUpdate[] = data.map((u: any) => ({
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
        ownUpdatesStore.set({ items });
      }
    } catch (e) {
      console.warn("Supabase ownUpdateService.sync error:", e);
    }
  },
};

/* ---------- Read state + per-business alerts ---------- */
interface PrefState { readIds: string[]; alertsOffIds: string[] }
export const prefsStore = store<PrefState>("bizapp.updatePrefs", { readIds: [], alertsOffIds: [] });
export const prefsService = {
  markRead: (ids: string[]) => {
    const s = prefsStore.get();
    const add = ids.filter((i) => !s.readIds.includes(i));
    if (!add.length) return;
    prefsStore.set({ ...s, readIds: [...s.readIds, ...add] });

    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const user = authData?.user;
        if (user) {
          const rows = add.map((id) => ({ user_id: user.id, update_id: id }));
          supabase.from("update_reads").upsert(rows, { onConflict: "user_id,update_id" }).catch(() => {});
        }
      });
    }
  },

  toggleAlerts: (businessId: string) => {
    const s = prefsStore.get();
    const off = s.alertsOffIds.includes(businessId);
    prefsStore.set({ ...s, alertsOffIds: off ? s.alertsOffIds.filter((x) => x !== businessId) : [...s.alertsOffIds, businessId] });

    if (isSupabaseConfigured() && isValidUuid(businessId)) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const user = authData?.user;
        if (user) {
          supabase
            .from("saved_cards")
            .update({ alerts_off: !off })
            .match({ user_id: user.id, business_id: businessId })
            .catch(() => {});
        }
      });
    }
  },

  /** Sync read IDs and alerts preferences from Supabase for current user. */
  sync: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const [readsRes, cardsRes] = await Promise.all([
        supabase.from("update_reads").select("update_id").eq("user_id", user.id),
        supabase.from("saved_cards").select("business_id, alerts_off").eq("user_id", user.id),
      ]);

      const readIds = readsRes.data?.map((r: any) => r.update_id) || prefsStore.get().readIds;
      const alertsOffIds = cardsRes.data?.filter((c: any) => c.alerts_off).map((c: any) => c.business_id) || prefsStore.get().alertsOffIds;

      prefsStore.set({ readIds, alertsOffIds });
    } catch (e) {
      console.warn("Supabase prefsService.sync error:", e);
    }
  },

  _reset: () => {
    prefsStore.set({ readIds: [], alertsOffIds: [] });
  },
};

/* ---------- Tracking: profile views, QR visits, WhatsApp enquiries ---------- */
export interface Enquiry { ref: string; businessId: string; at: string }
interface TrackState { views: Record<string, number>; qrVisits: Record<string, number>; enquiries: Enquiry[] }
export const trackStore = store<TrackState>("bizapp.tracking", { views: {}, qrVisits: {}, enquiries: [] });
const bump = (m: Record<string, number>, id: string) => ({ ...m, [id]: (m[id] ?? 0) + 1 });

export const trackingService = {
  view: (id: string) => {
    const s = trackStore.get();
    trackStore.set({ ...s, views: bump(s.views, id) });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase.from("events").insert({ business_id: id, event_type: "view" }).catch(() => {});
    }
  },

  qrVisit: (id: string) => {
    const s = trackStore.get();
    trackStore.set({ ...s, qrVisits: bump(s.qrVisits, id) });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase.from("events").insert({ business_id: id, event_type: "qr_visit" }).catch(() => {});
    }
  },

  enquiry: (businessId: string): string => {
    const ref = makeReferenceId(businessId);
    const s = trackStore.get();
    trackStore.set({ ...s, enquiries: [{ ref, businessId, at: new Date().toISOString() }, ...s.enquiries].slice(0, 200) });

    if (isSupabaseConfigured() && isValidUuid(businessId)) {
      supabase.from("events").insert({
        business_id: businessId,
        event_type: "whatsapp_enquiry",
        ref_id: ref,
      }).catch(() => {});
    }
    return ref;
  },

  /** Sync real dashboard counts from Supabase events for the owner. */
  syncCounts: async (businessId: string) => {
    if (!isSupabaseConfigured() || !isValidUuid(businessId)) return;
    try {
      const { data: events, error } = await supabase
        .from("events")
        .select("event_type, ref_id, created_at")
        .eq("business_id", businessId);

      if (!error && events) {
        const viewsCount = events.filter((e) => e.event_type === "view").length;
        const qrCount = events.filter((e) => e.event_type === "qr_visit").length;
        const enquiries = events
          .filter((e) => e.event_type === "whatsapp_enquiry")
          .map((e) => ({
            ref: e.ref_id || "REF",
            businessId,
            at: e.created_at,
          }))
          .sort((a, b) => b.at.localeCompare(a.at));

        const s = trackStore.get();
        trackStore.set({
          views: { ...s.views, [businessId]: Math.max(s.views[businessId] ?? 0, viewsCount) },
          qrVisits: { ...s.qrVisits, [businessId]: Math.max(s.qrVisits[businessId] ?? 0, qrCount) },
          enquiries: enquiries.length ? enquiries : s.enquiries,
        });
      }
    } catch (e) {
      console.warn("Supabase trackingService.syncCounts error:", e);
    }
  },
};

/**
 * Baseline numbers per business.
 * In production builds (PROD), returns 0 so only real live counts are displayed.
 * In development builds, returns deterministic baseline numbers so the UI has visual test data.
 */
export function mockBaseline(id: string) {
  if (isProd) {
    return { views: 0, saves: 0, qrVisits: 0, enquiries: 0 };
  }
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { views: 40 + (h % 160), saves: 3 + (h % 25), qrVisits: 2 + (h % 18), enquiries: 1 + (h % 9) };
}
