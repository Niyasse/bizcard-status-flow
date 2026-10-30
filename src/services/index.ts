import { companyProfiles, categories, districts, localities, statusUpdates, cardTemplates } from '@/data/mockData';
import type { CustomerPreferences } from '@/types';
import { emptyPreferences } from './discovery';
export const catalogService = { getCatalog: () => ({ businesses: companyProfiles, categories, districts, localities, updates: statusUpdates, cardTemplates }) };
const key='bizapp.customer.v1';
export const customerService = {
 read(): CustomerPreferences { try { const p=JSON.parse(localStorage.getItem(key)||'null'); const strings=(v: unknown): string[]=>Array.isArray(v) ? [...new Set(v.filter((x): x is string=>typeof x==='string' && companyProfiles.some(b=>b.id===x)))] : []; return p ? { savedIds: strings(p.savedIds), followedIds: strings(p.followedIds), mutedIds: strings(p.mutedIds) } : emptyPreferences; } catch { return emptyPreferences; } },
 write(p: CustomerPreferences) { localStorage.setItem(key,JSON.stringify(p)); },
 readRecent(): string[] { try { const v=JSON.parse(localStorage.getItem('bizapp.search.v1')||'[]'); return Array.isArray(v)?v.filter((s):s is string=>typeof s==='string').slice(0,6):[]; } catch { return []; } },
 writeRecent(v: string[]) { localStorage.setItem('bizapp.search.v1',JSON.stringify(v)); }
};
