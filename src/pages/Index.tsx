
import { Header } from "@/components/Header";
import { ProfileList } from "@/components/ProfileList";
import { companyProfiles } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Grid3X3 } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Profiles</h1>
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
        
        <ProfileList profiles={companyProfiles} />
        
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
