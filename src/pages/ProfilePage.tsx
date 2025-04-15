
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BusinessCard } from "@/components/BusinessCard";
import { StatusItem } from "@/components/StatusItem";
import { companyProfiles, statusUpdates } from "@/data/mockData";
import { ArrowLeft, BookOpen } from "lucide-react";

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [companyStatuses, setCompanyStatuses] = useState<any[]>([]);

  useEffect(() => {
    // Find the profile by ID
    const foundProfile = companyProfiles.find(p => p.id === id);
    if (foundProfile) {
      setProfile(foundProfile);
    }
    
    // Find statuses for this company
    const foundStatuses = statusUpdates.filter(s => s.companyId === id);
    setCompanyStatuses(foundStatuses);
  }, [id]);

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-whatsapp-light">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Profile not found</p>
          <Link to="/" className="text-whatsapp-green mt-2 inline-block">
            Return to profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <Link to="/" className="flex items-center text-whatsapp-green font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profiles
          </Link>
        </div>
        
        <BusinessCard 
          id={profile.id}
          name={profile.name}
          logo={profile.logo}
          tagline={profile.tagline}
          phone={profile.phone}
          email={profile.email}
          website={profile.website}
          address={profile.address}
          social={profile.social}
          template={profile.template}
        />
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Latest Status Updates
            </h2>
            <Link to={`/profile/${id}/status`} className="text-sm text-whatsapp-green">
              View all
            </Link>
          </div>
          
          {companyStatuses.length > 0 ? (
            <div>
              {companyStatuses.map(status => (
                <StatusItem key={status.id} status={status} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500">No status updates yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
