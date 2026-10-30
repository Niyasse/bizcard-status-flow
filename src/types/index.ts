// Shared data models. Shapes are kept flat so they map 1:1 to future database tables.

export type ID = string;

export type CardTemplateId = "default" | "modern" | "minimal" | "bold" | "elegant" | "royal";
export type CardOrientation = "landscape" | "portrait";

export interface District {
  id: ID;
  name: string;
}

export interface Locality {
  id: ID;
  name: string; // town / locality
  districtId: ID;
}

export interface Category {
  id: ID;
  name: string;
  nameMl?: string;
  kind: "business" | "service";
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface Business {
  id: ID;
  name: string;
  nameMl?: string; // Malayalam name for bilingual search
  logo: string;
  tagline: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  address: string;
  districtId: ID;
  localityId: ID;
  categoryIds: ID[];
  /** Category display names, kept for convenience/filtering in UI */
  tags: string[];
  social?: SocialLinks;
  /** Short list of services/products shown on the card back */
  services?: string[];
  template: CardTemplateId;
  orientation: CardOrientation;
  lastUpdated: string;
  hasNewStatus: boolean;
  ownerId?: ID;
}

export interface ServiceProfessional {
  id: ID;
  name: string;
  profession: string;
  photo: string;
  phone: string;
  whatsapp?: string;
  districtId: ID;
  localityId: ID;
  categoryIds: ID[];
  experienceYears: number;
}

export interface CardTemplate {
  id: CardTemplateId;
  name: string;
  description: string;
  previewImage: string;
}

/** Short text offer with optional external link. No images or video. */
export interface BusinessUpdate {
  id: ID;
  companyId: ID;
  companyName: string;
  companyLogo: string;
  content: string;
  link?: { url: string; title: string; platform?: "instagram" | "facebook" | "website" };
  postedAt: string;
  expiresAt: string;
}

export type UserType = "client" | "admin" | "business";

export interface AppUser {
  id: ID;
  email: string;
  name: string;
  userType: UserType;
  businessId?: ID;
  savedCardIds?: ID[];
  followedBusinessIds?: ID[];
}

export interface BusinessFilter {
  category?: string; // category name, "All" = no filter
  districtId?: ID;
  localityId?: ID;
  search?: string;
}
