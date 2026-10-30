import { useParams, Link } from 'react-router-dom';
import { AppShell, PageHeader } from '@/components/customer/AppShell';
import { SaveButton, MuteButton, EmptyState } from '@/components/customer/BusinessResults';
import { BusinessCard } from '@/components/BusinessCard';
import { StatusItem } from '@/components/StatusItem';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/use-data';
import { useCustomer } from '@/contexts/CustomerContext';
export default function ProfilePage(){const {id}=useParams();const {businesses,updates}=useCatalog();const {preferences}=useCustomer();const b=businesses.find(b=>b.id===id);if(!b)return <AppShell><EmptyState title="Business not found"><Button asChild variant="outline"><Link to="/">Discover businesses</Link></Button></EmptyState></AppShell>;const offers=updates.filter(u=>u.companyId===b.id&&Date.parse(u.expiresAt)>Date.now());return <AppShell><PageHeader title="Business card" back/><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{b.tags[0]} · {b.city}</span><div className="flex gap-1">{preferences.followedIds.includes(b.id)&&<MuteButton business={b}/>}<SaveButton business={b}/></div></div><BusinessCard {...b}/><section className="mt-6 border-t pt-5"><h2 className="mb-3 text-lg font-semibold">Services</h2><p className="text-sm text-muted-foreground">{b.services.join(' · ')}</p><p className="mt-2 text-sm text-muted-foreground">{b.address}</p></section><section className="mt-6"><h2 className="mb-3 text-lg font-semibold">Latest offers</h2>{offers.length?offers.map(u=><StatusItem key={u.id} status={u}/>):<p className="text-sm text-muted-foreground">No active offers</p>}</section></AppShell>;}
