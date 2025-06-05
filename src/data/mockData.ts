// Mock data for our application

// Company profiles
export const companyProfiles = [
  {
    id: "company1",
    name: "Acme Inc",
    logo: "https://ui-avatars.com/api/?name=Acme+Inc&background=0D8ABC&color=fff",
    tagline: "Innovative solutions for every need",
    phone: "+1 (555) 123-4567",
    email: "contact@acmeinc.example",
    website: "https://acmeinc.example",
    address: "123 Business Ave, Suite 101, New York, NY 10001",
    lastUpdated: "10:30 AM",
    hasNewStatus: true,
    tags: ["Tech", "Innovation"],
    social: {
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com",
      instagram: "https://instagram.com"
    },
    template: "default"
  },
  {
    id: "company2",
    name: "TechCorp",
    logo: "https://ui-avatars.com/api/?name=TechCorp&background=6C3483&color=fff",
    tagline: "Technology of tomorrow, today",
    phone: "+1 (555) 987-6543",
    email: "hello@techcorp.example",
    website: "https://techcorp.example",
    address: "456 Tech Blvd, San Francisco, CA 94107",
    lastUpdated: "Yesterday",
    hasNewStatus: true,
    tags: ["Tech", "Innovation", "Software"],
    social: {
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com"
    },
    template: "modern"
  },
  {
    id: "company3",
    name: "EcoFriendly Solutions",
    logo: "https://ui-avatars.com/api/?name=Eco+Friendly&background=229954&color=fff",
    tagline: "Sustainable products for a better world",
    phone: "+1 (555) 456-7890",
    email: "info@ecofriendly.example",
    website: "https://ecofriendly.example",
    address: "789 Green St, Portland, OR 97201",
    lastUpdated: "2 days ago",
    hasNewStatus: false,
    tags: ["Retail", "Green", "Logistics"],
    template: "minimal"
  },
  {
    id: "company4",
    name: "Luxe Design Studio",
    logo: "https://ui-avatars.com/api/?name=Luxe+Design&background=7D3C98&color=fff",
    tagline: "Elegant design solutions for discerning clients",
    phone: "+1 (555) 234-5678",
    email: "hello@luxedesign.example",
    website: "https://luxedesign.example",
    address: "1010 Design District, Miami, FL 33137",
    lastUpdated: "2 days ago",
    hasNewStatus: true,
    tags: ["Design", "Creative"],
    social: {
      instagram: "https://instagram.com",
      linkedin: "https://linkedin.com"
    },
    template: "elegant"
  },
  {
    id: "company5",
    name: "Speedy Logistics",
    logo: "https://ui-avatars.com/api/?name=Speedy+Logistics&background=E74C3C&color=fff",
    tagline: "Fast, reliable shipping worldwide",
    phone: "+1 (555) 345-6789",
    email: "support@speedylogistics.example",
    website: "https://speedylogistics.example",
    address: "2020 Delivery Lane, Chicago, IL 60607",
    lastUpdated: "1 week ago",
    hasNewStatus: false,
    tags: ["Logistics", "Transport"],
    template: "bold"
  },
  {
    id: "company6",
    name: "Sweet Dreams Bakery",
    logo: "https://ui-avatars.com/api/?name=Sweet+Dreams&background=F39C12&color=fff",
    tagline: "Fresh baked goods daily",
    phone: "+1 (555) 123-9876",
    email: "orders@sweetdreams.example",
    website: "https://sweetdreams.example",
    address: "456 Main Street, Boston, MA 02101",
    lastUpdated: "3 hours ago",
    hasNewStatus: true,
    tags: ["Bakery", "Food & Beverage"],
    social: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com"
    },
    template: "default"
  },
  {
    id: "company7",
    name: "City Supermarket",
    logo: "https://ui-avatars.com/api/?name=City+Super&background=27AE60&color=fff",
    tagline: "Your neighborhood grocery store",
    phone: "+1 (555) 654-3210",
    email: "info@citysupermarket.example",
    website: "https://citysupermarket.example",
    address: "789 Commerce Ave, Seattle, WA 98101",
    lastUpdated: "1 hour ago",
    hasNewStatus: true,
    tags: ["Supermarket", "Retail"],
    social: {
      facebook: "https://facebook.com"
    },
    template: "modern"
  },
  {
    id: "company8",
    name: "Little Angels Baby Shop",
    logo: "https://ui-avatars.com/api/?name=Little+Angels&background=E91E63&color=fff",
    tagline: "Everything for your little one",
    phone: "+1 (555) 789-0123",
    email: "hello@littleangels.example",
    website: "https://littleangels.example",
    address: "321 Family Lane, Austin, TX 78701",
    lastUpdated: "5 hours ago",
    hasNewStatus: false,
    tags: ["Babyshop", "Retail"],
    social: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com"
    },
    template: "minimal"
  },
  {
    id: "company9",
    name: "Premium Textiles Co",
    logo: "https://ui-avatars.com/api/?name=Premium+Textiles&background=8E44AD&color=fff",
    tagline: "Quality fabrics for every need",
    phone: "+1 (555) 456-7891",
    email: "sales@premiumtextiles.example",
    website: "https://premiumtextiles.example",
    address: "654 Industrial Blvd, Atlanta, GA 30301",
    lastUpdated: "2 days ago",
    hasNewStatus: true,
    tags: ["Textiles", "Retail"],
    social: {
      linkedin: "https://linkedin.com"
    },
    template: "elegant"
  }
];

// Status updates
export const statusUpdates = [
  {
    id: "status1",
    companyId: "company1",
    companyName: "Acme Inc",
    companyLogo: "https://ui-avatars.com/api/?name=Acme+Inc&background=0D8ABC&color=fff",
    content: "We're excited to announce our new product line launching next month! Stay tuned for more details about our innovative solutions.",
    postedAt: "2023-09-12T08:30:00Z",
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    imageUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnVzaW5lc3MlMjBtZWV0aW5nfGVufDB8fDB8fHww"
  },
  {
    id: "status2",
    companyId: "company2",
    companyName: "TechCorp",
    companyLogo: "https://ui-avatars.com/api/?name=TechCorp&background=6C3483&color=fff",
    content: "Join us for our virtual tech conference on September 15th. We'll be showcasing the latest innovations in AI and machine learning. Register now!",
    postedAt: "2023-09-11T14:00:00Z",
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    link: {
      url: "https://example.com/tech-conference",
      title: "Register for TechCorp Conference"
    }
  },
  {
    id: "status3",
    companyId: "company4",
    companyName: "Luxe Design Studio",
    companyLogo: "https://ui-avatars.com/api/?name=Luxe+Design&background=7D3C98&color=fff",
    content: "Check out our latest design project for a luxury hotel in Miami. We're proud of the elegant, sustainable approach we took to transform this space.",
    postedAt: "2023-09-11T10:15:00Z",
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // 22 hours from now
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bHV4dXJ5JTIwaG90ZWx8ZW58MHx8MHx8fDA%3D"
  }
];

// Template options for business cards
export const cardTemplates = [
  {
    id: "default",
    name: "Classic",
    description: "Clean and professional design",
    previewImage: "https://via.placeholder.com/100x60?text=Classic"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary gradient style",
    previewImage: "https://via.placeholder.com/100x60?text=Modern"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant layout",
    previewImage: "https://via.placeholder.com/100x60?text=Minimal"
  },
  {
    id: "bold",
    name: "Bold",
    description: "Striking and impactful design",
    previewImage: "https://via.placeholder.com/100x60?text=Bold"
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated and premium feel",
    previewImage: "https://via.placeholder.com/100x60?text=Elegant"
  }
];
