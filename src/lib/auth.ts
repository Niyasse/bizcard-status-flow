// Pure auth + moderation rules (mock until the backend exists). Tested in auth.test.ts.
import type { ListingStatus, UserType } from "@/types";

/** Demo OTP — no SMS is sent. Replace with backend phone auth. */
export const MOCK_OTP = "123456";

export const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
export const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(normalizePhone(p));
export const verifyOtp = (code: string) => code.trim() === MOCK_OTP;

/** Where each role lands after signing in. */
export function homeFor(role: UserType): string {
  return role === "admin" ? "/admin" : role === "business" ? "/dashboard" : "/";
}

/** Route access: admin may open everything; others only their own roles. */
export function canAccess(role: UserType | null | undefined, allowed: UserType[]): boolean {
  if (!role) return false;
  return role === "admin" || allowed.includes(role);
}

/** Only approved listings appear in public discovery. */
export const isPublicListing = (s: ListingStatus) => s === "approved";

/** Seeded demo businesses start approved; newly registered owner businesses wait for review. */
export const defaultListingStatus = (isOwnerRegistered: boolean): ListingStatus =>
  isOwnerRegistered ? "pending" : "approved";

export interface SignupForm { name: string; phone: string; email: string; role: UserType }
export function validateSignup(f: SignupForm): Partial<Record<keyof SignupForm, string>> {
  const e: Partial<Record<keyof SignupForm, string>> = {};
  if (f.name.trim().length < 2) e.name = "Enter your name";
  if (!isValidPhone(f.phone)) e.phone = "Enter a 10-digit mobile number";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email";
  if (f.role === "admin") e.role = "Admin accounts can't be created by signup";
  return e;
}
