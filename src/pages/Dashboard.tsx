import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BusinessCard } from "@/components/BusinessCard";
import { useTemplates } from "@/hooks/use-data";
import { 
  ArrowLeft, 
  Edit, 
  BarChart3, 
  Clock, 
  Eye, 
  MessageCircle, 
  Share2, 
  Image, 
  Type 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  
  // Mock user profile for the dashboard
  const [userProfile, setUserProfile] = useState({
    id: "userCompany",
    name: user?.name || "Your Business",
    logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Your Business')}&background=128C7E&color=fff`,
    tagline: "Your business tagline",
    phone: "+1 (555) 123-4567",
    email: user?.email || "contact@yourbusiness.example",
    website: "https://yourbusiness.example",
    address: "123 Business St, Business City, 12345",
    template: "default" as const
  });
  
  // Mock analytics data
  const analytics = {
    profileViews: 247,
    messagesSent: 32,
    statusViews: 156,
    shareClicks: 18
  };
  
  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setUserProfile({
      ...userProfile,
      template: templateId as any
    });
  };

  if (!user || user.userType !== 'business') {
    return (
      <div className="flex flex-col min-h-screen bg-whatsapp-light">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">This page is only available for business owners.</p>
            <Link to="/login" className="text-whatsapp-green underline">
              Login as Business Owner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="flex items-center text-whatsapp-green font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Profiles
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Analytics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Analytics</h2>
                <BarChart3 className="text-whatsapp-green" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Eye className="text-blue-500 w-5 h-5 mr-3" />
                    <span>Profile Views</span>
                  </div>
                  <span className="font-bold">{analytics.profileViews}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <MessageCircle className="text-whatsapp-green w-5 h-5 mr-3" />
                    <span>Messages</span>
                  </div>
                  <span className="font-bold">{analytics.messagesSent}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Clock className="text-amber-500 w-5 h-5 mr-3" />
                    <span>Status Views</span>
                  </div>
                  <span className="font-bold">{analytics.statusViews}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <Share2 className="text-purple-500 w-5 h-5 mr-3" />
                    <span>Shares</span>
                  </div>
                  <span className="font-bold">{analytics.shareClicks}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Quick Actions</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Link to="/create-status" className="p-3 bg-whatsapp-green/10 rounded-md text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-whatsapp-green" />
                  <span className="text-sm font-medium">Post Status</span>
                </Link>
                
                <Link to="/create-profile" className="p-3 bg-blue-500/10 rounded-md text-center">
                  <Edit className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </Link>
                
                <button className="p-3 bg-purple-500/10 rounded-md text-center">
                  <Image className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <span className="text-sm font-medium">Upload Media</span>
                </button>
                
                <Link to="/create-profile" className="p-3 bg-amber-500/10 rounded-md text-center">
                  <Type className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <span className="text-sm font-medium">Update Info</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right column - Business Card & Templates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Business Card</h2>
                <Link to="/create-profile" className="text-whatsapp-green flex items-center text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </div>
              
              <BusinessCard 
                id={userProfile.id}
                name={userProfile.name}
                logo={userProfile.logo}
                tagline={userProfile.tagline}
                phone={userProfile.phone}
                email={userProfile.email}
                website={userProfile.website}
                address={userProfile.address}
                template={userProfile.template}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Card Templates</h2>
                <span className="text-xs bg-whatsapp-green text-white px-2 py-1 rounded-full">
                  Premium
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cardTemplates.map(template => (
                  <div 
                    key={template.id}
                    className={`border rounded-md p-3 cursor-pointer transition ${
                      userProfile.template === template.id 
                        ? "border-whatsapp-green bg-whatsapp-green/5" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                      <img 
                        src={template.previewImage} 
                        alt={template.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <p className="text-xs text-gray-500">{template.description}</p>
                    
                    {userProfile.template === template.id && (
                      <div className="mt-2 bg-whatsapp-green/10 text-whatsapp-green text-xs py-1 rounded text-center">
                        Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
