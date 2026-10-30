import type { Business, BusinessUpdate, Category, Locality } from '@/types';
export const categories: Category[] = [
  { id: 'bakery', name: 'Bakery', malayalam: 'ബേക്കറി', icon: 'cake', keywords: ['cake', 'bread', 'കേക്ക്'] },
  { id: 'travels', name: 'Travels', malayalam: 'ട്രാവൽസ്', icon: 'bus', keywords: ['taxi', 'tour', 'ടാക്സി'] },
  { id: 'hotels', name: 'Hotels', malayalam: 'ഹോട്ടൽ', icon: 'bed', keywords: ['stay', 'rooms', 'താമസം'] },
  { id: 'supermarket', name: 'Supermarket', malayalam: 'സൂപ്പർമാർക്കറ്റ്', icon: 'basket', keywords: ['grocery', 'പലചരക്ക്'] },
  { id: 'textiles', name: 'Textiles', malayalam: 'ടെക്സ്റ്റൈൽസ്', icon: 'shirt', keywords: ['clothes', 'saree', 'വസ്ത്രം'] },
  { id: 'babyshop', name: 'Babyshop', malayalam: 'ബേബിഷോപ്പ്', icon: 'baby', keywords: ['toys', 'baby', 'കുഞ്ഞ്'] },
  { id: 'home-services', name: 'Home Services', malayalam: 'വീട്ടുസേവനങ്ങൾ', icon: 'wrench', keywords: ['repair', 'plumber', 'electrician', 'പ്ലംബർ', 'ഇലക്ട്രീഷ്യൻ'] },
  { id: 'healthcare', name: 'Healthcare', malayalam: 'ആരോഗ്യം', icon: 'heart', keywords: ['clinic', 'doctor', 'ഡോക്ടർ'] }
];
export const districts = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'];
const seeds: [string, string, string, string, string, string, Business['kind'], string[]][] = [
 ['Malabar Bakehouse', 'മലബാർ ബേക്കറി', 'bakery', 'Kozhikode', 'Kozhikode', 'SM Street', 'shop', ['Custom cakes', 'Fresh bread']],
 ['Green Basket Supermarket', 'ഗ്രീൻ ബാസ്കറ്റ് സൂപ്പർമാർക്കറ്റ്', 'supermarket', 'Ernakulam', 'Kochi', 'Edappally', 'shop', ['Grocery delivery']],
 ['Nila Textiles', 'നിള ടെക്സ്റ്റൈൽസ്', 'textiles', 'Thrissur', 'Thrissur', 'Swaraj Round', 'shop', ['Sarees', 'Tailoring']],
 ['Backwater Travels', 'ബാക്ക്‌വാട്ടർ ട്രാവൽസ്', 'travels', 'Alappuzha', 'Alappuzha', 'Punnamada', 'company', ['Taxi booking', 'Houseboat tours']],
 ['Palm Grove Hotel', 'പാം ഗ്രോവ് ഹോട്ടൽ', 'hotels', 'Thiruvananthapuram', 'Kovalam', 'Lighthouse Beach', 'company', ['Room booking']],
 ['Little Steps Babyshop', 'ലിറ്റിൽ സ്റ്റെപ്സ് ബേബിഷോപ്പ്', 'babyshop', 'Malappuram', 'Manjeri', 'Central Junction', 'shop', ['Baby essentials', 'Toys']],
 ['Anoop Electrical Services', 'അനൂപ് ഇലക്ട്രീഷ്യൻ', 'home-services', 'Ernakulam', 'Kochi', 'Kakkanad', 'professional', ['Electrical repairs']],
 ['Fathima Plumbing', 'ഫാത്തിമ പ്ലംബർ', 'home-services', 'Kozhikode', 'Kozhikode', 'Mavoor Road', 'professional', ['Plumbing']],
 ['Care Plus Clinic', 'കെയർ പ്ലസ് ക്ലിനിക്', 'healthcare', 'Kannur', 'Kannur', 'Thavakkara', 'company', ['Doctor consultation']],
 ['Kottayam Cake Studio', 'കോട്ടയം കേക്ക് സ്റ്റുഡിയോ', 'bakery', 'Kottayam', 'Kottayam', 'Baker Junction', 'shop', ['Custom cakes']],
 ['Wayanad Hill Stay', 'വയനാട് ഹിൽ സ്റ്റേ', 'hotels', 'Wayanad', 'Kalpetta', 'Civil Station', 'company', ['Room booking']],
 ['HomeCare Repairs', 'ഹോംകെയർ റിപ്പയർ', 'home-services', 'Ernakulam', 'Kochi', 'Edappally', 'company', ['Electrical repairs', 'Plumbing']]
];
function logo(name: string) { return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#128C7E"/><text x="40" y="49" font-family="Arial" font-size="28" text-anchor="middle" fill="white">${name.split(' ').slice(0,2).map(w=>w[0]).join('')}</text></svg>`)}`; }
export const companyProfiles: Business[] = seeds.map(([name, malayalam, categoryId, district, city, locality, kind, services], i) => ({
 id: `company${i+1}`, name, malayalam, logo: logo(name), categoryId, district, city, locality, kind, services,
 tagline: services.join(' · '), phone: `+91 00000 ${String(i+1).padStart(5,'0')}`, email: `hello${i+1}@bizapp.example`, website: 'https://example.com', address: `${locality}, ${city}, ${district}, Kerala`,
 keywords: [malayalam, district === 'Kozhikode' ? 'കോഴിക്കോട്' : '', district === 'Ernakulam' ? 'കൊച്ചി എറണാകുളം' : '', 'Kerala', 'കേരളം'],
 hours: { days: [0,1,2,3,4,5,6], opens: i === 4 ? '00:00' : '08:00', closes: i === 4 ? '23:59' : i === 6 ? '17:00' : '21:00' },
 template: (['default','modern','minimal','bold','elegant'] as const)[i%5], tags: [categories.find(c=>c.id===categoryId)?.name || categoryId], lastUpdated: 'Today', hasNewStatus: i < 6
}));
export const localities: Locality[] = companyProfiles.map(b => ({ id: b.locality, district: b.district, city: b.city, name: b.locality }));
const now = Date.now();
export const statusUpdates: BusinessUpdate[] = companyProfiles.slice(0,6).map((b,i) => ({ id: `status${i+1}`, companyId: b.id, companyName: b.name, companyLogo: b.logo,
 content: ['Fresh banana bread today — 10% off the evening batch.', 'Free grocery delivery on orders above ₹500 today.', 'Onam collection preview: selected sarees at 15% off.', 'Weekend houseboat packages available. Call for today’s rates.', 'Midweek room offer — breakfast included.', 'Baby essentials bundle: save 10% this week.'][i],
 postedAt: new Date(now-(i+1)*3600000).toISOString(), expiresAt: new Date(now+(23-i)*3600000).toISOString(), link: { url: 'https://example.com', title: 'View offer on website' }
}));
export const cardTemplates = ['default','modern','minimal','bold','elegant'].map(id=>({ id, name: id === 'default' ? 'Classic' : id.charAt(0).toUpperCase()+id.slice(1), description: 'Business card', previewImage: companyProfiles[0].logo }));
