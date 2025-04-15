
import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { companyProfiles } from "@/data/mockData";

const CompanyListingPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter companies based on search term
  const filteredCompanies = companyProfiles.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.tagline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 text-transparent bg-clip-text">
            Create your dream
          </h1>
          <p className="text-gray-400 mt-1">
            Discover the visuals to inspire you
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full py-3 pl-10 pr-4 bg-gray-800/50 backdrop-blur-lg rounded-full text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
        
        {/* Company Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredCompanies.map(company => (
            <Link to={`/profile/${company.id}`} key={company.id}>
              <Card className="overflow-hidden h-40 md:h-48 relative group hover:scale-[1.02] transition-all duration-200">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 backdrop-blur-sm"
                  style={{
                    backgroundImage: `url(${company.logo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.7
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-medium text-white truncate">{company.name}</h3>
                  <p className="text-xs text-gray-300 truncate">{company.tagline}</p>
                </div>
                
                {company.hasNewStatus && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Create New Button */}
        <div className="fixed bottom-6 right-1/2 transform translate-x-1/2">
          <Link
            to="/create-profile"
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create new company
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CompanyListingPage;
