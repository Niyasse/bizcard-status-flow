
import { Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  lastUpdated: string;
  hasNewStatus: boolean;
  tags?: string[]; // Add tags property for category filtering
}

interface ProfileListProps {
  profiles: CompanyProfile[];
  hideSearch?: boolean;
}

export function ProfileList({ profiles, hideSearch = false }: ProfileListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter profiles based on search term
  const filteredProfiles = searchTerm 
    ? profiles.filter(profile => 
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.tagline.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : profiles;

  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      {!hideSearch && (
        <div className="p-3 bg-whatsapp-light border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search profiles..."
              className="w-full py-2 pl-10 pr-4 bg-white rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-whatsapp-green/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}
      
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
            {!hideSearch && <p className="text-sm">Try a different search term</p>}
          </div>
        )}
      </div>
    </div>
  );
}
