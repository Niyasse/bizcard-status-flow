
import { Header } from "@/components/Header";
import { ProfileList } from "@/components/ProfileList";
import { companyProfiles } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Grid3X3, MapPin } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "All", 
  "Tech",
  "Design",
  "Logistics",
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Food & Beverage"
];

const locations = [
  "New York",
  "San Francisco",
  "London",
  "Tokyo",
  "Sydney",
  "Berlin",
  "Paris",
  "Toronto"
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("New York");
  
  // Filter profiles based on selected category
  const filteredProfiles = selectedCategory === "All" 
    ? companyProfiles 
    : companyProfiles.filter(profile => 
        profile.tags && profile.tags.includes(selectedCategory)
      );

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {/* Categories Menu */}
        <div className="mb-4 bg-white rounded-lg p-3 shadow-sm">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-1">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-whatsapp-green text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-whatsapp-green" />
            <div className="flex flex-col">
              <h2 className="text-sm font-medium text-gray-500">Location</h2>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[160px] h-8 border-none p-0 text-left">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link 
              to="/status" 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-white shadow-sm border border-gray-200 text-gray-700 flex items-center"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Status Updates
            </Link>
            <Link 
              to="/companies" 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-white shadow-sm border border-gray-200 text-gray-700 flex items-center"
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Grid View
            </Link>
            <Link 
              to="/create-profile" 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-whatsapp-green text-white flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Profile
            </Link>
          </div>
        </div>
        
        <ProfileList profiles={filteredProfiles} hideSearch={true} />
        
        <div className="mt-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-2">Welcome to BizCard</h2>
          <p className="text-gray-600 text-sm mb-3">
            Discover and connect with businesses through their digital business cards. 
            View their latest status updates and contact them directly.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-whatsapp-green/10 p-3 rounded-md">
              <h3 className="text-whatsapp-green font-medium text-sm mb-1">For Businesses</h3>
              <p className="text-xs text-gray-600">Create your digital business card and share updates with potential clients.</p>
            </div>
            <div className="bg-whatsapp-blue/10 p-3 rounded-md">
              <h3 className="text-whatsapp-blue font-medium text-sm mb-1">For Users</h3>
              <p className="text-xs text-gray-600">Discover new businesses and keep up with their latest announcements.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
