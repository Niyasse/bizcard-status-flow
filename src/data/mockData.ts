// Dummy Kerala data. Only the service layer (src/services) may import this file.
import type {
  Business, BusinessUpdate, CardTemplate, Category, District, Locality, ServiceProfessional,
} from "@/types";

const logo = (name: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;
const hours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const districts: District[] = [
  { id: "tvm", name: "Thiruvananthapuram" },
  { id: "kollam", name: "Kollam" },
  { id: "alp", name: "Alappuzha" },
  { id: "ktm", name: "Kottayam" },
  { id: "ekm", name: "Ernakulam" },
  { id: "tsr", name: "Thrissur" },
  { id: "pkd", name: "Palakkad" },
  { id: "kzd", name: "Kozhikode" },
  { id: "knr", name: "Kannur" },
];

export const localities: Locality[] = [
  { id: "kowdiar", name: "Kowdiar", districtId: "tvm" },
  { id: "pattom", name: "Pattom", districtId: "tvm" },
  { id: "chinnakada", name: "Chinnakada", districtId: "kollam" },
  { id: "mullakkal", name: "Mullakkal", districtId: "alp" },
  { id: "kumarakom", name: "Kumarakom", districtId: "ktm" },
  { id: "kakkanad", name: "Kakkanad", districtId: "ekm" },
  { id: "edappally", name: "Edappally", districtId: "ekm" },
  { id: "fortkochi", name: "Fort Kochi", districtId: "ekm" },
  { id: "mgroad-ekm", name: "MG Road", districtId: "ekm" },
  { id: "swaraj", name: "Swaraj Round", districtId: "tsr" },
  { id: "olavakkode", name: "Olavakkode", districtId: "pkd" },
  { id: "mavoor", name: "Mavoor Road", districtId: "kzd" },
  { id: "thalassery", name: "Thalassery", districtId: "knr" },
];

export const categories: Category[] = [
  { id: "bakery", name: "Bakery", kind: "business" },
  { id: "supermarket", name: "Supermarket", kind: "business" },
  { id: "textiles", name: "Textiles", kind: "business" },
  { id: "hotels", name: "Hotels", kind: "business" },
  { id: "restaurant", name: "Restaurant", kind: "business" },
  { id: "travels", name: "Travels", kind: "business" },
  { id: "babyshop", name: "Babyshop", kind: "business" },
  { id: "jewellery", name: "Jewellery", kind: "business" },
  { id: "ayurveda", name: "Ayurveda", kind: "service" },
  { id: "healthcare", name: "Healthcare", kind: "service" },
  { id: "education", name: "Education", kind: "service" },
  { id: "electrician", name: "Electrician", kind: "service" },
  { id: "plumber", name: "Plumber", kind: "service" },
];

export const businesses: Business[] = [
  {
    id: "b1", name: "Kochi Bake House", logo: logo("Kochi Bake", "C0392B"),
    tagline: "Plum cakes, puffs & Kerala snacks since 1987",
    phone: "+91 98470 12345", whatsapp: "919847012345", email: "hello@kochibake.in",
    website: "https://kochibake.in", address: "Edappally Junction, Kochi, Ernakulam 682024",
    districtId: "ekm", localityId: "edappally", categoryIds: ["bakery"], tags: ["Bakery"],
    social: { instagram: "https://instagram.com", facebook: "https://facebook.com" },
    template: "default", orientation: "landscape", lastUpdated: "10:30 AM", hasNewStatus: true, ownerId: "business1",
  },
  {
    id: "b2", name: "Malabar Fresh Mart", logo: logo("Malabar Fresh", "27AE60"),
    tagline: "Daily groceries, fish & vegetables delivered",
    phone: "+91 94460 22334", email: "care@malabarfresh.in",
    address: "Mavoor Road, Kozhikode 673004",
    districtId: "kzd", localityId: "mavoor", categoryIds: ["supermarket"], tags: ["Supermarket"],
    social: { facebook: "https://facebook.com" },
    template: "modern", orientation: "portrait", lastUpdated: "1 hour ago", hasNewStatus: true,
  },
  {
    id: "b3", name: "Seematti Weaves", logo: logo("Seematti Weaves", "8E44AD"),
    tagline: "Kasavu sarees, set mundu & wedding silks",
    phone: "+91 98950 55667", email: "sales@seemattiweaves.in", website: "https://seemattiweaves.in",
    address: "MG Road, Ernakulam 682035",
    districtId: "ekm", localityId: "mgroad-ekm", categoryIds: ["textiles"], tags: ["Textiles"],
    social: { instagram: "https://instagram.com" },
    template: "elegant", orientation: "landscape", lastUpdated: "2 days ago", hasNewStatus: true,
  },
  {
    id: "b4", name: "Kumarakom Lake Retreat", logo: logo("Lake Retreat", "E67E22"),
    tagline: "Backwater houseboats & lakeside cottages",
    phone: "+91 94471 88990", email: "stay@kumarakomretreat.in", website: "https://kumarakomretreat.in",
    address: "Kumarakom North, Kottayam 686563",
    districtId: "ktm", localityId: "kumarakom", categoryIds: ["hotels", "travels"], tags: ["Hotels", "Travels"],
    template: "elegant", orientation: "portrait", lastUpdated: "2 hours ago", hasNewStatus: false,
  },
  {
    id: "b5", name: "Sreerag Tours & Travels", logo: logo("Sreerag Tours", "3498DB"),
    tagline: "Munnar, Thekkady & Wayanad packages",
    phone: "+91 97440 33445", email: "book@sreeragtours.in",
    address: "Swaraj Round East, Thrissur 680001",
    districtId: "tsr", localityId: "swaraj", categoryIds: ["travels"], tags: ["Travels"],
    social: { instagram: "https://instagram.com", facebook: "https://facebook.com" },
    template: "bold", orientation: "landscape", lastUpdated: "5 hours ago", hasNewStatus: true,
  },
  {
    id: "b6", name: "Paragon Family Restaurant", logo: logo("Paragon Family", "D35400"),
    tagline: "Malabar biryani & seafood thali",
    phone: "+91 95390 77881", email: "info@paragonfamily.in",
    address: "Thalassery Main Road, Kannur 670101",
    districtId: "knr", localityId: "thalassery", categoryIds: ["restaurant"], tags: ["Restaurant"],
    template: "default", orientation: "portrait", lastUpdated: "3 hours ago", hasNewStatus: true,
  },
  {
    id: "b7", name: "Kunjus Baby World", logo: logo("Kunjus Baby", "F06292"),
    tagline: "Baby clothing, toys & care essentials",
    phone: "+91 90370 44556", email: "hello@kunjusbaby.in",
    address: "Kowdiar, Thiruvananthapuram 695003",
    districtId: "tvm", localityId: "kowdiar", categoryIds: ["babyshop"], tags: ["Babyshop"],
    social: { instagram: "https://instagram.com" },
    template: "minimal", orientation: "landscape", lastUpdated: "1 day ago", hasNewStatus: false,
  },
  {
    id: "b8", name: "Vaidyaratnam Ayur Clinic", logo: logo("Vaidyaratnam Ayur", "16A085"),
    tagline: "Panchakarma & traditional Ayurvedic care",
    phone: "+91 94953 66778", email: "care@vaidyaratnamclinic.in",
    address: "Olavakkode, Palakkad 678002",
    districtId: "pkd", localityId: "olavakkode", categoryIds: ["ayurveda", "healthcare"], tags: ["Ayurveda", "Healthcare"],
    template: "modern", orientation: "portrait", lastUpdated: "6 hours ago", hasNewStatus: true,
  },
  {
    id: "b9", name: "Alleppey Gold Palace", logo: logo("Gold Palace", "B7950B"),
    tagline: "916 hallmark gold & temple jewellery",
    phone: "+91 98461 99001", email: "info@alleppeygold.in",
    address: "Mullakkal, Alappuzha 688011",
    districtId: "alp", localityId: "mullakkal", categoryIds: ["jewellery"], tags: ["Jewellery"],
    template: "elegant", orientation: "landscape", lastUpdated: "Yesterday", hasNewStatus: false,
  },
];

export const serviceProfessionals: ServiceProfessional[] = [
  { id: "sp1", name: "Anil Kumar", profession: "Electrician", photo: logo("Anil Kumar", "2C3E50"),
    phone: "+91 98460 11223", districtId: "ekm", localityId: "kakkanad", categoryIds: ["electrician"], experienceYears: 12 },
  { id: "sp2", name: "Shibu Thomas", profession: "Plumber", photo: logo("Shibu Thomas", "34495E"),
    phone: "+91 94470 33221", districtId: "ktm", localityId: "kumarakom", categoryIds: ["plumber"], experienceYears: 8 },
  { id: "sp3", name: "Dr. Lakshmi Menon", profession: "Ayurveda Physician", photo: logo("Lakshmi Menon", "16A085"),
    phone: "+91 90480 55443", districtId: "tsr", localityId: "swaraj", categoryIds: ["ayurveda"], experienceYears: 15 },
];

export const updates: BusinessUpdate[] = [
  { id: "u1", companyId: "b1", companyName: "Kochi Bake House", companyLogo: businesses[0].logo,
    content: "Christmas plum cake pre-orders open! 15% off on 1kg cakes booked before Dec 15.",
    link: { url: "https://instagram.com", title: "See cakes on Instagram", platform: "instagram" },
    postedAt: ago(2), expiresAt: hours(22) },
  { id: "u2", companyId: "b2", companyName: "Malabar Fresh Mart", companyLogo: businesses[1].logo,
    content: "Fresh Kozhikode sardines & mackerel in today. Free home delivery above ₹500 on Mavoor Road.",
    postedAt: ago(4), expiresAt: hours(20) },
  { id: "u3", companyId: "b3", companyName: "Seematti Weaves", companyLogo: businesses[2].logo,
    content: "Onam kasavu collection is here — flat 20% off on set mundu this week.",
    link: { url: "https://seemattiweaves.in", title: "Browse collection", platform: "website" },
    postedAt: ago(6), expiresAt: hours(18) },
  { id: "u4", companyId: "b5", companyName: "Sreerag Tours & Travels", companyLogo: businesses[4].logo,
    content: "Munnar 2N/3D family package from ₹6,999 per person. Limited seats for the long weekend.",
    link: { url: "https://facebook.com", title: "Package details on Facebook", platform: "facebook" },
    postedAt: ago(8), expiresAt: hours(16) },
  { id: "u5", companyId: "b8", companyName: "Vaidyaratnam Ayur Clinic", companyLogo: businesses[7].logo,
    content: "Karkidaka chikitsa bookings open. Free consultation on Saturdays.",
    postedAt: ago(10), expiresAt: hours(14) },
];

export const cardTemplates: CardTemplate[] = [
  { id: "default", name: "Classic", description: "Clean and professional design", previewImage: "https://placehold.co/100x60?text=Classic" },
  { id: "modern", name: "Modern", description: "Contemporary gradient style", previewImage: "https://placehold.co/100x60?text=Modern" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant layout", previewImage: "https://placehold.co/100x60?text=Minimal" },
  { id: "bold", name: "Bold", description: "Striking and impactful design", previewImage: "https://placehold.co/100x60?text=Bold" },
  { id: "elegant", name: "Elegant", description: "Sophisticated and premium feel", previewImage: "https://placehold.co/100x60?text=Elegant" },
];
