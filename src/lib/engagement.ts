// Pure Sprint 4 rules: owner updates, unread/notifications, enquiries. Unit-tested.
import type { BusinessUpdate } from "@/types";
import { isValidUrl } from "./validation";

export const MAX_ACTIVE_UPDATES = 3;
export const MAX_UPDATE_CHARS = 200;
export const MAX_EXPIRY_DAYS = 30;

export const isActive = (u: Pick<BusinessUpdate, "expiresAt">, now = Date.now()) =>
  new Date(u.expiresAt).getTime() > now;

/** True when the owner may publish one more active update (editing an existing active one is always allowed). */
export function canPublish(own: BusinessUpdate[], editingId?: string, now = Date.now()): boolean {
  const active = own.filter((u) => isActive(u, now) && u.id !== editingId);
  return active.length < MAX_ACTIVE_UPDATES;
}

export interface UpdateForm { content: string; linkUrl: string; linkTitle: string; expiresAt: string }
export type UpdateErrors = Partial<Record<keyof UpdateForm, string>>;

export function validateUpdate(f: UpdateForm, now = Date.now()): UpdateErrors {
  const e: UpdateErrors = {};
  const c = f.content.trim();
  if (!c) e.content = "Write a short update";
  else if (c.length > MAX_UPDATE_CHARS) e.content = `Keep it under ${MAX_UPDATE_CHARS} characters`;
  if (f.linkUrl.trim() && !isValidUrl(f.linkUrl.trim())) e.linkUrl = "Link must start with https://";
  const t = new Date(f.expiresAt).getTime();
  if (!f.expiresAt || Number.isNaN(t)) e.expiresAt = "Pick an expiry date";
  else if (t <= now) e.expiresAt = "Expiry must be in the future";
  else if (t - now > MAX_EXPIRY_DAYS * 86400_000) e.expiresAt = `Expiry can be at most ${MAX_EXPIRY_DAYS} days away`;
  return e;
}

/** Guess the link platform from its address. */
export function detectPlatform(url: string): "instagram" | "facebook" | "website" {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/facebook\.com|fb\.(com|me)/i.test(url)) return "facebook";
  return "website";
}

export interface FollowState { savedIds: string[]; mutedIds: string[]; alertsOffIds: string[]; readIds: string[] }

/** Active updates from saved, unmuted businesses that the user hasn't opened yet. */
export const unreadUpdates = (all: BusinessUpdate[], s: FollowState, now = Date.now()) =>
  all.filter((u) => isActive(u, now) && s.savedIds.includes(u.companyId) && !s.mutedIds.includes(u.companyId) && !s.readIds.includes(u.id));

/** In-app notifications: unread followed updates whose business has alerts on. */
export const notifications = (all: BusinessUpdate[], s: FollowState, now = Date.now()) =>
  unreadUpdates(all, s, now).filter((u) => !s.alertsOffIds.includes(u.companyId));

/** Unique enquiry reference like BZ-B1-K3F9Q2. */
export function makeReferenceId(businessId: string, rand: () => number = Math.random): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rand() * chars.length)];
  return `BZ-${businessId.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6)}-${s}`;
}

export const enquiryMessage = (businessName: string, ref: string) =>
  `Hi ${businessName}, I found your business on Bizapp and would like to enquire. Bizapp ref: ${ref}`;

export function whatsAppEnquiryUrl(waId: string, businessName: string, ref: string) {
  return `https://wa.me/${waId}?text=${encodeURIComponent(enquiryMessage(businessName, ref))}`;
}

/** Permanent QR link: profile address tagged as a QR source. */
export const qrLink = (origin: string, businessId: string) => `${origin}/profile/${businessId}?src=qr`;
