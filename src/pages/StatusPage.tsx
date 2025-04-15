
import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatusItem } from "@/components/StatusItem";
import { statusUpdates, companyProfiles } from "@/data/mockData";
import { ArrowLeft, Plus } from "lucide-react";

const StatusPage = () => {
  const [filter, setFilter] = useState<string>("all");
  
  // Filter status updates based on selected filter
  const filteredStatuses = filter === "all" 
    ? statusUpdates 
    : statusUpdates.filter(status => status.companyId === filter);

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6 flex justify-between items-center">
          <Link to="/" className="flex items-center text-whatsapp-green font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profiles
          </Link>
          
          <Link 
            to="/create-status" 
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-whatsapp-green text-white flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Status
          </Link>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-4">Status Updates</h1>
        
        <div className="bg-white rounded-lg p-3 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">FILTER BY COMPANY</h2>
          <div className="flex overflow-x-auto gap-2 pb-2">
            <button 
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === "all" 
                  ? "bg-whatsapp-green text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setFilter("all")}
            >
              All Updates
            </button>
            
            {companyProfiles.map(profile => (
              <button 
                key={profile.id}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                  filter === profile.id 
                    ? "bg-whatsapp-green text-white" 
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setFilter(profile.id)}
              >
                <img 
                  src={profile.logo} 
                  alt={profile.name} 
                  className="w-4 h-4 rounded-full mr-1" 
                />
                {profile.name}
              </button>
            ))}
          </div>
        </div>
        
        {filteredStatuses.length > 0 ? (
          <div>
            {filteredStatuses.map(status => (
              <StatusItem key={status.id} status={status} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-500">No status updates available</p>
            {filter !== "all" && (
              <button 
                className="text-whatsapp-green mt-2"
                onClick={() => setFilter("all")}
              >
                Show all status updates
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StatusPage;
