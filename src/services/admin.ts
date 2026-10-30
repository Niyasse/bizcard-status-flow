// Sprint 5 local stores: listing moderation, user reports, mock user accounts, app settings.
import type { AppUser, ListingStatus, Report } from "@/types";
import { defaultListingStatus } from "@/lib/auth";
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
  },
};

/* ---------- User reports ---------- */
const seedReports: Report[] = [
  { id: "r1", businessId: "b2", reason: "Phone number not reachable", reporter: "Anu (customer)", createdAt: "2026-10-28T10:00:00Z", status: "open" },
  { id: "r2", businessId: "b5", reason: "Offer already expired in shop", reporter: "Rahul (customer)", createdAt: "2026-10-29T14:30:00Z", status: "open" },
  { id: "r3", businessId: "b1", reason: "Wrong location on map", reporter: "Meera (customer)", createdAt: "2026-10-25T08:15:00Z", status: "resolved" },
];
interface ReportState { items: Report[] }
export const reportsStore = store<ReportState>("bizapp.reports", { items: seedReports });
export const reportService = {
  list: () => reportsStore.get().items,
  add: (businessId: string, reason: string, reporter: string) => {
    const r: Report = { id: `r-${Date.now()}`, businessId, reason, reporter, createdAt: new Date().toISOString(), status: "open" };
    reportsStore.set({ items: [r, ...reportsStore.get().items] });
    return r;
  },
  setStatus: (id: string, status: Report["status"]) =>
    reportsStore.set({ items: reportsStore.get().items.map((r) => (r.id === id ? { ...r, status } : r)) }),
};

/* ---------- Mock user accounts ---------- */
const seedUsers: AppUser[] = [
  { id: "admin1", email: "admin@b.com", phone: "9000000001", name: "Admin User", userType: "admin" },
  { id: "client1", email: "client@b.com", phone: "9000000002", name: "Client User", userType: "client" },
  { id: "business1", email: "business@b.com", phone: "9000000003", name: "Business Owner", userType: "business", businessId: "my-business" },
];
interface UsersState { items: AppUser[] }
export const usersStore = store<UsersState>("bizapp.users", { items: seedUsers });
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
