import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AppShell, PageHeader } from '@/components/customer/AppShell';
import { BusinessResults, EmptyState } from '@/components/customer/BusinessResults';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCustomer } from '@/contexts/CustomerContext';
import { useCatalog } from '@/hooks/use-data';
import { emptyFilters, filterBusinesses } from '@/services/discovery';
export default function MyCardsPage(){const {preferences}=useCustomer();const {businesses,categories,updates}=useCatalog();const [query,setQuery]=useState('');const saved=businesses.filter(b=>preferences.savedIds.includes(b.id));const found=filterBusinesses(saved,categories,updates,query,emptyFilters);return <AppShell><PageHeader title="My Cards" subtitle={`${saved.length} saved ${saved.length===1?'business':'businesses'}`}/><div className="relative mb-5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label="Search saved cards" placeholder="Search saved cards…" className="h-11 bg-card pl-10" value={query} onChange={e=>setQuery(e.target.value)}/></div>{found.length?categories.map(c=>{const group=found.filter(b=>b.categoryId===c.id);return group.length>0&&<section key={c.id} className="mb-6"><h2 className="mb-2 text-sm font-semibold text-muted-foreground">{c.name} · {group.length}</h2><BusinessResults businesses={group} wallet/></section>;}):<EmptyState title={saved.length?'No saved cards match':'No saved cards yet'}><Button asChild variant="outline"><Link to="/">Discover businesses</Link></Button></EmptyState>}</AppShell>;}
