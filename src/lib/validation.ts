// Business registration validation rules (pure, unit-tested).
export const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

export interface BusinessForm {
  name: string; tagline: string; phone: string; whatsapp: string; email: string; website: string;
  address: string; districtId: string; localityId: string; categoryIds: string[];
  services: string; logo: string; template: string; orientation: "landscape" | "portrait";
  facebook: string; instagram: string; linkedin: string; youtube: string;
}

/** Indian mobile: optional +91 / 0, then 10 digits starting 6-9. Spaces and dashes allowed. */
export function isValidPhone(v: string): boolean {
  const d = v.replace(/[\s-]/g, "");
  return /^(\+91|91|0)?[6-9]\d{9}$/.test(d);
}
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isValidUrl = (v: string) => { try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } };

export function validateLogoFile(file: { size: number; type: string }): string | null {
  if (!file.type.startsWith("image/")) return "Logo must be an image file";
  if (file.size > MAX_LOGO_BYTES) return "Logo must be 1 MB or smaller";
  return null;
}

export type Errors = Partial<Record<keyof BusinessForm, string>>;

export function validateStep(step: number, f: BusinessForm): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.name.trim()) e.name = "Business name is required";
    if (!f.tagline.trim()) e.tagline = "Short description is required";
    if (!f.phone.trim()) e.phone = "Phone number is required";
    else if (!isValidPhone(f.phone)) e.phone = "Enter a valid 10-digit Indian mobile number";
    if (f.whatsapp.trim() && !isValidPhone(f.whatsapp)) e.whatsapp = "Enter a valid 10-digit WhatsApp number";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(f.email)) e.email = "Enter a valid email address";
    if (f.website.trim() && !isValidUrl(f.website)) e.website = "Website must start with https://";
    for (const k of ["facebook", "instagram", "linkedin", "youtube"] as const)
      if (f[k].trim() && !isValidUrl(f[k])) e[k] = "Link must start with https://";
  }
  if (step === 1) {
    if (!f.districtId) e.districtId = "Select a district";
    if (!f.localityId) e.localityId = "Select a town";
    if (!f.address.trim()) e.address = "Address is required";
    if (f.categoryIds.length === 0) e.categoryIds = "Pick at least one category";
  }
  if (step === 2 && !f.template) e.template = "Choose a card design";
  return e;
}

/** Digits-only WhatsApp id with 91 country code. */
export function toWhatsAppId(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d.replace(/^0/, "91");
}
