// Sprint 4 local stores (localStorage until the backend exists): owner updates, read/alerts state, tracking.
import type { BusinessUpdate } from "@/types";
import { detectPlatform, makeReferenceId, type UpdateForm } from "@/lib/engagement";

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
    const item: BusinessUpdate = {
      id: id ?? `my-${Date.now()}`, companyId: biz.id, companyName: biz.name, companyLogo: biz.logo,
      content: f.content.trim(),
      link: url ? { url, platform, title: f.linkTitle.trim() || ({ instagram: "View on Instagram", facebook: "View on Facebook", website: "Visit website" }[platform!]) } : undefined,
      postedAt: prev?.postedAt ?? new Date().toISOString(), expiresAt: new Date(f.expiresAt).toISOString(),
    };
    const items = ownUpdatesStore.get().items.filter((x) => x.id !== item.id);
    ownUpdatesStore.set({ items: [item, ...items] });
    return item;
  },
  remove: (id: string) => ownUpdatesStore.set({ items: ownUpdatesStore.get().items.filter((x) => x.id !== id) }),
};

/* ---------- Read state + per-business alerts ---------- */
interface PrefState { readIds: string[]; alertsOffIds: string[] }
export const prefsStore = store<PrefState>("bizapp.updatePrefs", { readIds: [], alertsOffIds: [] });
export const prefsService = {
  markRead: (ids: string[]) => {
    const s = prefsStore.get();
    const add = ids.filter((i) => !s.readIds.includes(i));
    if (add.length) prefsStore.set({ ...s, readIds: [...s.readIds, ...add] });
  },
  toggleAlerts: (businessId: string) => {
    const s = prefsStore.get();
    const off = s.alertsOffIds.includes(businessId);
    prefsStore.set({ ...s, alertsOffIds: off ? s.alertsOffIds.filter((x) => x !== businessId) : [...s.alertsOffIds, businessId] });
  },
};

/* ---------- Tracking: profile views, QR visits, WhatsApp enquiries ---------- */
export interface Enquiry { ref: string; businessId: string; at: string }
interface TrackState { views: Record<string, number>; qrVisits: Record<string, number>; enquiries: Enquiry[] }
export const trackStore = store<TrackState>("bizapp.tracking", { views: {}, qrVisits: {}, enquiries: [] });
const bump = (m: Record<string, number>, id: string) => ({ ...m, [id]: (m[id] ?? 0) + 1 });
export const trackingService = {
  view: (id: string) => { const s = trackStore.get(); trackStore.set({ ...s, views: bump(s.views, id) }); },
  qrVisit: (id: string) => { const s = trackStore.get(); trackStore.set({ ...s, qrVisits: bump(s.qrVisits, id) }); },
  enquiry: (businessId: string): string => {
    const ref = makeReferenceId(businessId);
    const s = trackStore.get();
    trackStore.set({ ...s, enquiries: [{ ref, businessId, at: new Date().toISOString() }, ...s.enquiries].slice(0, 200) });
    return ref;
  },
};

/** Mock baseline numbers per business so the dashboard isn't empty (deterministic). */
export function mockBaseline(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { views: 40 + (h % 160), saves: 3 + (h % 25), qrVisits: 2 + (h % 18), enquiries: 1 + (h % 9) };
}
