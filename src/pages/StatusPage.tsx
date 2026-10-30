import { Link } from 'react-router-dom';
import { AppShell, PageHeader } from '@/components/customer/AppShell';
import { EmptyState, MuteButton } from '@/components/customer/BusinessResults';
import { StatusItem } from '@/components/StatusItem';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/use-data';
import { useCustomer } from '@/contexts/CustomerContext';
import { followedUpdates } from '@/services/discovery';
export default function StatusPage(){const {updates,businesses}=useCatalog();const {preferences}=useCustomer();const items=followedUpdates(updates,preferences);const followed=businesses.filter(b=>preferences.followedIds.includes(b.id));return <AppShell><PageHeader title="Updates" subtitle="Offers from your saved businesses"/>{followed.length>0&&<details className="mb-5 border-b pb-4"><summary className="cursor-pointer text-sm font-medium">Manage updates · {followed.length} followed</summary><div className="mt-3 divide-y">{followed.map(b=><div key={b.id} className="flex items-center justify-between gap-2 py-2"><Link className="min-w-0 text-sm" to={`/profile/${b.id}`}>{b.name}</Link><MuteButton business={b}/></div>)}</div></details>}{items.length?items.map(u=><StatusItem key={u.id} status={u}/>):<EmptyState title={followed.length?'No new offers right now':'No followed businesses yet'}><Button asChild variant="outline"><Link to={followed.length?'/my-cards':'/'}>{followed.length?'Manage saved cards':'Discover businesses'}</Link></Button></EmptyState>}</AppShell>;}
