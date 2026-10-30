export type BusinessKind = 'shop' | 'professional' | 'company';
export type CardTemplate = 'default' | 'modern' | 'minimal' | 'bold' | 'elegant';
export interface Locality { id: string; district: string; city: string; name: string }
export interface Category { id: string; name: string; malayalam: string; icon: string; keywords: string[] }
export interface OperatingHours { days: number[]; opens: string; closes: string }
export interface Business {
  id: string; name: string; malayalam: string; logo: string; tagline: string;
  phone: string; email: string; website?: string; address: string;
  categoryId: string; kind: BusinessKind; services: string[]; keywords: string[];
  district: string; city: string; locality: string; hours: OperatingHours;
  template: CardTemplate; tags: string[]; lastUpdated: string; hasNewStatus: boolean;
  social?: { instagram?: string; facebook?: string }; 
}
export interface ServiceProfessional extends Business { kind: 'professional' }
export interface DigitalCard { businessId: string; template: CardTemplate }
export interface BusinessUpdate { id: string; companyId: string; companyName: string; companyLogo: string; content: string; postedAt: string; expiresAt: string; imageUrl?: never; link?: { url: string; title: string } }
export interface CustomerPreferences { savedIds: string[]; followedIds: string[]; mutedIds: string[] }
export interface User { id: string; name: string; email: string; role: 'client' | 'admin' | 'business'; businessId?: string }
export interface BusinessFilters { district: string; city: string; locality: string; category: string; service: string; kind: string; openNow: boolean; offers: boolean }
