import { describe, expect, test } from 'bun:test';
import { companyProfiles as businesses, categories, statusUpdates } from '../data/mockData';
import { emptyFilters, emptyPreferences, filterBusinesses, followedUpdates, isOpen, toggleMuted, toggleSaved } from './discovery';
const now=new Date('2026-10-30T07:00:00Z');
describe('Sprint 2 customer rules',()=>{
 test('English name, category, service, keyword and location searches',()=>{
  for(const [query,id] of [['Malabar','company1'],['Bakery','company1'],['Plumbing','company8'],['പ്ലംബർ','company8'],['Edappally','company2']]) expect(filterBusinesses(businesses,categories,statusUpdates,query,emptyFilters,now).map(b=>b.id)).toContain(id);
 });
 test('Malayalam search returns Kerala business',()=>{expect(filterBusinesses(businesses,categories,statusUpdates,'ബേക്കറി',emptyFilters,now).map(b=>b.id)).toEqual(['company1','company10']);});
 test('filters combine district city locality category service and shop type',()=>{expect(filterBusinesses(businesses,categories,statusUpdates,'',{...emptyFilters,district:'Ernakulam',city:'Kochi',locality:'Edappally',category:'supermarket',service:'Grocery delivery',kind:'shop'},now).map(b=>b.id)).toEqual(['company2']);});
 test('each filter excludes nonmatching businesses',()=>{for(const filters of [{district:'Ernakulam'},{city:'Kochi'},{locality:'Edappally'},{category:'supermarket'},{service:'Grocery delivery'},{kind:'shop'}]) { const result=filterBusinesses(businesses,categories,statusUpdates,'',{...emptyFilters,...filters},now);expect(result.length).toBeGreaterThan(0);expect(result.length).toBeLessThan(businesses.length); }});
 test('open now uses mock hours in Kerala timezone',()=>{const b=businesses[0];expect(isOpen(b,new Date('2026-10-30T02:29:00Z'))).toBe(false);expect(isOpen(b,new Date('2026-10-30T02:30:00Z'))).toBe(true);expect(isOpen(b,new Date('2026-10-30T15:30:00Z'))).toBe(false);});
 test('open now filter removes closed professionals',()=>{expect(filterBusinesses(businesses,categories,statusUpdates,'',{...emptyFilters,openNow:true},new Date('2026-10-30T13:00:00Z')).map(b=>b.id)).not.toContain('company7');});
 test('offers available excludes expired offers',()=>{const offers=[{...statusUpdates[0],postedAt:'2026-10-30T06:00:00Z',expiresAt:'2026-10-30T08:00:00Z'},{...statusUpdates[1],expiresAt:'2026-10-29T00:00:00Z'}];expect(filterBusinesses(businesses,categories,offers,'',{...emptyFilters,offers:true},now).map(b=>b.id)).toEqual(['company1']);});
 test('saving automatically follows',()=>{expect(toggleSaved(emptyPreferences,'company1')).toEqual({savedIds:['company1'],followedIds:['company1'],mutedIds:[]});});
 test('removing saved card removes follow and mute',()=>{expect(toggleSaved({savedIds:['company1'],followedIds:['company1'],mutedIds:['company1']},'company1')).toEqual(emptyPreferences);});
 test('mute suppresses followed offer and unmute restores it',()=>{const offer={...statusUpdates[0],postedAt:'2026-10-30T06:00:00Z',expiresAt:'2026-10-30T08:00:00Z'};const p=toggleSaved(emptyPreferences,'company1');const muted=toggleMuted(p,'company1');expect(followedUpdates([offer],muted,now)).toEqual([]);expect(followedUpdates([offer],toggleMuted(muted,'company1'),now).map(u=>u.id)).toEqual(['status1']);});
 test('unfollowed and expired updates stay hidden',()=>{const p=toggleSaved(emptyPreferences,'company1');expect(followedUpdates([{...statusUpdates[0],expiresAt:'2026-10-29T00:00:00Z'},statusUpdates[1]],p,now)).toEqual([]);});
 test('clearing all filters returns full catalog',()=>{expect(filterBusinesses(businesses,categories,statusUpdates,'',emptyFilters,now)).toHaveLength(12);});
});
