
import { useState } from "react";
import { Phone, MessageCircle, Share2, ExternalLink, Mail, MapPin, QrCode } from "lucide-react";

export interface BusinessCardProps {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  template?: "default" | "modern" | "minimal" | "bold" | "elegant";
}

export function BusinessCard({ 
  name, 
  logo, 
  tagline, 
  phone, 
  email, 
  website, 
  address, 
  social,
  template = "default"
}: BusinessCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Handle card actions
  const handleCall = () => window.open(`tel:${phone}`);
  const handleWhatsApp = () => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: `Check out ${name}'s digital business card`,
        url: window.location.href,
      });
    } else {
      alert(`Share ${name}'s business card: ${window.location.href}`);
    }
  };

  const handleGoogleMaps = () => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    }
  };

  const getTemplateClasses = () => {
    switch(template) {
      case "modern":
        return {
          front: "bg-gradient-to-br from-whatsapp-blue to-whatsapp-green text-white",
          back: "bg-slate-800 text-white"
        };
      case "minimal":
        return {
          front: "bg-white border border-gray-200",
          back: "bg-gray-50 border border-gray-200"
        };
      case "bold":
        return {
          front: "bg-whatsapp-green text-white",
          back: "bg-black text-white"
        };
      case "elegant":
        return {
          front: "bg-gradient-to-r from-slate-600 to-slate-800 text-white",
          back: "bg-slate-700 text-white"
        };
      default:
        return {
          front: "bg-white shadow-md",
          back: "bg-whatsapp-cardBack shadow-md"
        };
    }
  };

  const templateClasses = getTemplateClasses();

  return (
    <div className="card-container mx-auto my-6 w-full max-w-md h-64 md:h-72">
      <div className={`card ${isFlipped ? 'card-flip' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        {/* Front of card */}
        <div className={`card-front p-6 flex flex-col ${templateClasses.front}`}>
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-white bg-white flex-shrink-0">
              <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm opacity-90">{tagline}</p>
            </div>
            <div className="ml-2">
              <QrCode className="w-8 h-8 opacity-70" />
            </div>
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center mb-2">
              <Phone className="w-4 h-4 mr-2 opacity-70" />
              <span className="text-sm">{phone}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 opacity-70" />
              <span className="text-sm">{email}</span>
            </div>
          </div>
          
          <div className="flex justify-around pt-4 border-t border-t-black/10">
            <button onClick={(e) => { e.stopPropagation(); handleCall(); }} className="flex flex-col items-center text-sm">
              <Phone className="w-5 h-5 mb-1" />
              <span>Call</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }} className="flex flex-col items-center text-sm">
              <MessageCircle className="w-5 h-5 mb-1" />
              <span>WhatsApp</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center text-sm">
              <Share2 className="w-5 h-5 mb-1" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="absolute bottom-2 right-2 text-xs opacity-50">
            Tap to flip
          </div>
        </div>
        
        {/* Back of card */}
        <div className={`card-back p-6 ${templateClasses.back}`}>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">{name}</h3>
          
          {website && (
            <div className="flex items-center mb-3">
              <ExternalLink className="w-4 h-4 mr-2 opacity-70" />
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm underline" onClick={(e) => e.stopPropagation()}>
                {website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
          
          {address && (
            <div className="mb-3">
              <div className="flex items-start mb-2">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 opacity-70" />
                <span className="text-sm">{address}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleGoogleMaps(); }}
                className="ml-6 text-sm text-blue-400 underline hover:text-blue-300"
              >
                View on Google Maps
              </button>
            </div>
          )}
          
          {social && Object.keys(social).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Connect with us:</h4>
              <div className="flex space-x-3">
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">f</div>
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white">t</div>
                  </a>
                )}
                {social.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white">in</div>
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white">
                      <span className="text-xs">ig</span>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 text-xs opacity-50">
            Tap to flip
          </div>
        </div>
      </div>
    </div>
  );
}
