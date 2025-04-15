
import { Clock, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  lastUpdated: string;
  hasNewStatus: boolean;
}

interface ProfileListProps {
  profiles: CompanyProfile[];
}

export function ProfileList({ profiles }: ProfileListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.tagline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <div className="p-3 bg-whatsapp-light border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search profiles..."
            className="w-full py-2 pl-10 pr-4 bg-white rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-whatsapp-green/50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-2.5"
          >
            <Filter className="h-4 w-4 text-gray-400 hover:text-whatsapp-green" />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
            <h4 className="font-medium text-xs text-gray-500 mb-1">SORT BY</h4>
            <div className="flex flex-wrap gap-2">
              <button className="px-2 py-1 bg-whatsapp-green/10 text-whatsapp-green rounded-full text-xs">
                Recently Updated
              </button>
              <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                Alphabetical
              </button>
              <button className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                New Status
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="divide-y">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => (
            <Link 
              to={`/profile/${profile.id}`} 
              key={profile.id}
              className="flex items-center px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="relative">
                {profile.hasNewStatus && (
                  <div className="status-ring">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img 
                        src={profile.logo} 
                        alt={profile.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                )}
                
                {!profile.hasNewStatus && (
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={profile.logo} 
                      alt={profile.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
              
              <div className="ml-3 flex-grow">
                <h3 className="font-medium text-gray-900">{profile.name}</h3>
                <p className="text-sm text-gray-500 truncate">{profile.tagline}</p>
              </div>
              
              <div className="flex flex-col items-end text-xs text-gray-400">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> 
                  {profile.lastUpdated}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No profiles found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
