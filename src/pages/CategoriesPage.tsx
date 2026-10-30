import { CakeSlice, Bus, BedDouble, ShoppingBasket, Shirt, Baby, Wrench, HeartPulse, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell, PageHeader } from '@/components/customer/AppShell';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/use-data';
const icons={cake:CakeSlice,bus:Bus,bed:BedDouble,basket:ShoppingBasket,shirt:Shirt,baby:Baby,wrench:Wrench,heart:HeartPulse};
export default function CategoriesPage(){const {categories,businesses}=useCatalog();return <AppShell><PageHeader title="Categories" subtitle="Shops, local professionals & service companies"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{categories.map(c=>{const Icon=icons[c.icon as keyof typeof icons]||Wrench;return <Button key={c.id} asChild variant="outline" className="h-40 justify-start whitespace-normal bg-card p-4"><Link to={`/?category=${c.id}`} className="flex flex-col items-start"><Icon className="mb-3 !h-7 !w-7 text-primary"/><span className="font-semibold">{c.name}</span><span className="mt-1 text-xs text-muted-foreground">{c.malayalam}</span><span className="mt-auto flex w-full items-center justify-between text-xs text-muted-foreground">{businesses.filter(b=>b.categoryId===c.id).length} businesses<ChevronRight/></span></Link></Button>;})}</div></AppShell>;}
