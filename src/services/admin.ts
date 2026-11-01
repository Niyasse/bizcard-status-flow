// Sprint 5 & 6D services: listing moderation, user reports, mock user accounts, app settings.
import type { AppUser, ListingStatus, Report } from "@/types";
import { defaultListingStatus } from "@/lib/auth";
import { isSupabaseConfigured, supabase, isValidUuid, isProd } from "@/lib/supabase";
import { store } from "./engagement";

/* ---------- Listing moderation ---------- */
interface ModState { statuses: Record<string, ListingStatus> }
export const moderationStore = store<ModState>("bizapp.moderation", { statuses: {} });
export const moderationService = {
  statusOf: (id: string, ownerRegistered = false): ListingStatus =>
    moderationStore.get().statuses[id] ?? defaultListingStatus(ownerRegistered),

  setStatus: (id: string, status: ListingStatus) => {
    const s = moderationStore.get();
    moderationStore.set({ statuses: { ...s.statuses, [id]: status } });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase
        .from("businesses")
        .update({ status })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase moderation setStatus error:", error.message);
        })
        .catch((err) => console.warn("Supabase moderation setStatus exception:", err));
    }
  },
};

/* ---------- User reports ---------- */
const devReports: Report[] = isProd
  ? []
  : [
      { id: "r1", businessId: "b2", reason: "Phone number not reachable", reporter: "Anu (customer)", createdAt: "2026-10-28T10:00:00Z", status: "open" },
      { id: "r2", businessId: "b5", reason: "Offer already expired in shop", reporter: "Rahul (customer)", createdAt: "2026-10-29T14:30:00Z", status: "open" },
      { id: "r3", businessId: "b1", reason: "Wrong location on map", reporter: "Meera (customer)", createdAt: "2026-10-25T08:15:00Z", status: "resolved" },
    ];

interface ReportState { items: Report[] }
export const reportsStore = store<ReportState>("bizapp.reports", { items: devReports });

export const reportService = {
  list: () => reportsStore.get().items,

  add: (businessId: string, reason: string, reporter: string): Report => {
    const reportId = crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`;
    const r: Report = {
      id: reportId,
      businessId,
      reason,
      reporter,
      createdAt: new Date().toISOString(),
      status: "open",
    };
    reportsStore.set({ items: [r, ...reportsStore.get().items] });

    if (isSupabaseConfigured() && isValidUuid(businessId)) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const user = authData?.user;
        supabase
          .from("reports")
          .insert({
            id: isValidUuid(reportId) ? reportId : undefined,
            business_id: businessId,
            reporter_id: user?.id ?? null,
            reason,
            status: "open",
          })
          .then(({ error }) => {
            if (error) console.warn("Supabase add report error:", error.message);
          })
          .catch((err) => console.warn("Supabase add report exception:", err));
      });
    }

    return r;
  },

  setStatus: (id: string, status: Report["status"]) => {
    reportsStore.set({
      items: reportsStore.get().items.map((r) => (r.id === id ? { ...r, status } : r)),
    });

    if (isSupabaseConfigured() && isValidUuid(id)) {
      supabase
        .from("reports")
        .update({ status })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase report setStatus error:", error.message);
        })
        .catch((err) => console.warn("Supabase report setStatus exception:", err));
    }
  },

  sync: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const items: Report[] = data.map((row: any) => ({
          id: row.id,
          businessId: row.business_id,
          reason: row.reason,
          reporter: row.reporter_id || "Customer",
          createdAt: row.created_at,
          status: row.status,
        }));
        reportsStore.set({ items });
      }
    } catch (e) {
      console.warn("Supabase report list error:", e);
    }
  },
};

/* ---------- Mock user accounts (dev only) ---------- */
const devUsers: AppUser[] = isProd
  ? []
  : [
      { id: "admin1", email: "admin@b.com", phone: "9000000001", name: "Admin User", userType: "admin" },
      { id: "client1", email: "client@b.com", phone: "9000000002", name: "Client User", userType: "client" },
      { id: "business1", email: "business@b.com", phone: "9000000003", name: "Business Owner", userType: "business", businessId: "my-business" },
    ];

interface UsersState { items: AppUser[] }
export const usersStore = store<UsersState>("bizapp.users", { items: devUsers });
export const userService = {
  list: () => usersStore.get().items,
  findByPhone: (phone: string) => usersStore.get().items.find((u) => u.phone === phone) ?? null,
  findByEmail: (email: string) => usersStore.get().items.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
  upsert: (u: AppUser) => {
    const items = usersStore.get().items.filter((x) => x.id !== u.id);
    usersStore.set({ items: [...items, u] });
    return u;
  },
};

/* ---------- App settings ---------- */
export type Language = "en" | "ml";
interface SettingsState { language: Language }
export const settingsStore = store<SettingsState>("bizapp.settings", { language: "en" });
