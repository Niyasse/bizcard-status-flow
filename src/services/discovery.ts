import type { Business, BusinessFilters, BusinessUpdate, Category, CustomerPreferences } from '../types';
export const emptyFilters: BusinessFilters = { district: '', city: '', locality: '', category: '', service: '', kind: '', openNow: false, offers: false };
export function isOpen(b: Business, now = new Date()): boolean {
 const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
 const value = (key: string) => parts.find(p=>p.type===key)?.value || '';
 const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(value('weekday'));
 const minutes = Number(value('hour'))*60+Number(value('minute'));
 const parse = (s: string) => { const [h,m]=s.split(':').map(Number); return h*60+m; };
 const start=parse(b.hours.opens), end=parse(b.hours.closes);
 if (start <= end) return b.hours.days.includes(day) && minutes >= start && minutes < end;
 return (b.hours.days.includes(day) && minutes >= start) || (b.hours.days.includes((day+6)%7) && minutes < end);
}
const normalize = (s: string) => s.normalize('NFKC').toLocaleLowerCase().trim();
export function filterBusinesses(businesses: Business[], categories: Category[], updates: BusinessUpdate[], query: string, filters: BusinessFilters, now = new Date()): Business[] {
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 return businesses.filter(b=>{
 const c=categories.find(c=>c.id===b.categoryId);
 const searchable=normalize([b.name,b.malayalam,b.tagline,b.district,b.city,b.locality,...b.services,...b.keywords,c?.name,c?.malayalam,...(c?.keywords||[])].join(' '));
 return terms.every(t=>searchable.includes(t)) && (!filters.district||b.district===filters.district) && (!filters.city||b.city===filters.city) && (!filters.locality||b.locality===filters.locality) && (!filters.category||b.categoryId===filters.category) && (!filters.kind||b.kind===filters.kind) && (!filters.service||b.services.includes(filters.service)) && (!filters.openNow||isOpen(b,now)) && (!filters.offers||updates.some(u=>u.companyId===b.id && Date.parse(u.expiresAt)>now.getTime() && Date.parse(u.postedAt)<=now.getTime()));
 });
}
export const emptyPreferences: CustomerPreferences = { savedIds: [], followedIds: [], mutedIds: [] };
export function toggleSaved(p: CustomerPreferences, id: string): CustomerPreferences {
 if (p.savedIds.includes(id)) return { savedIds: p.savedIds.filter(v=>v!==id), followedIds: p.followedIds.filter(v=>v!==id), mutedIds: p.mutedIds.filter(v=>v!==id) };
 return { ...p, savedIds: [...p.savedIds,id], followedIds: [...new Set([...p.followedIds,id])] };
}
export function toggleMuted(p: CustomerPreferences, id: string): CustomerPreferences {
 if (!p.followedIds.includes(id)) return p;
 return { ...p, mutedIds: p.mutedIds.includes(id) ? p.mutedIds.filter(v=>v!==id) : [...p.mutedIds,id] };
}
export function followedUpdates(updates: BusinessUpdate[], p: CustomerPreferences, now=new Date()) {
 return updates.filter(u=>p.followedIds.includes(u.companyId) && !p.mutedIds.includes(u.companyId) && Date.parse(u.expiresAt)>now.getTime() && Date.parse(u.postedAt)<=now.getTime()).sort((a,b)=>Date.parse(b.postedAt)-Date.parse(a.postedAt));
}
