
import { useState } from "react";
import { Phone, MessageCircle, Share2, ExternalLink, Mail, MapPin, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          front: "premium-modern-front",
          back: "premium-modern-back"
        };
      case "minimal":
        return {
          front: "premium-minimal-front",
          back: "premium-minimal-back"
        };
      case "bold":
        return {
          front: "premium-bold-front",
          back: "premium-bold-back"
        };
      case "elegant":
        return {
          front: "premium-elegant-front",
          back: "premium-elegant-back"
        };
      default:
        return {
          front: "premium-default-front",
          back: "premium-default-back"
        };
    }
  };

  const templateClasses = getTemplateClasses();

  return (
    <div className="card-container mx-auto my-6 w-full max-w-md h-[340px] sm:h-80">
      <div className={`card ${isFlipped ? 'card-flip' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
        {/* Front of card */}
        <div aria-hidden={isFlipped} className={`card-front p-4 sm:p-6 flex flex-col ${templateClasses.front}`}>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden mr-3 border-2 border-card bg-card flex-shrink-0">
              <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold break-words">{name}</h2>
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
              <span className="text-sm break-all">{email}</span>
            </div>
          </div>
          
          <div className="flex justify-around pt-3 pb-3 border-t border-current/10">
            <Button tabIndex={isFlipped?-1:0} variant="ghost" onClick={(e) => { e.stopPropagation(); handleCall(); }} className="h-14 flex flex-col items-center gap-0 text-sm">
              <Phone className="w-5 h-5 mb-1" />
              <span>Call</span>
            </Button>
            <Button tabIndex={isFlipped?-1:0} variant="ghost" onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }} className="h-14 flex flex-col items-center gap-0 text-sm">
              <MessageCircle className="w-5 h-5 mb-1" />
              <span>WhatsApp</span>
            </Button>
            <Button tabIndex={isFlipped?-1:0} variant="ghost" onClick={(e) => { e.stopPropagation(); handleShare(); }} className="h-14 flex flex-col items-center gap-0 text-sm">
              <Share2 className="w-5 h-5 mb-1" />
              <span>Share</span>
            </Button>
          </div>
          
          <Button tabIndex={isFlipped?-1:0} variant="ghost" size="sm" className="absolute bottom-0 right-1 h-7 text-xs" onClick={e=>{e.stopPropagation();setIsFlipped(true);}}>Flip card</Button>
        </div>
        
        {/* Back of card */}
        <div aria-hidden={!isFlipped} className={`card-back p-4 sm:p-6 ${templateClasses.back}`}>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">{name}</h3>
          
          {website && (
            <div className="flex items-center mb-3">
              <ExternalLink className="w-4 h-4 mr-2 opacity-70" />
              <a tabIndex={isFlipped?0:-1} href={website} target="_blank" rel="noopener noreferrer" className="text-sm underline break-all" onClick={(e) => e.stopPropagation()}>
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
              <Button tabIndex={isFlipped?0:-1} variant="link" size="sm"
                onClick={(e) => { e.stopPropagation(); handleGoogleMaps(); }}
                className="ml-6 p-0 text-sm text-inherit underline"
              >
                View on Google Maps
              </Button>
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
          
          <Button tabIndex={isFlipped?0:-1} variant="ghost" size="sm" className="absolute bottom-0 right-1 h-7 text-xs" onClick={e=>{e.stopPropagation();setIsFlipped(false);}}>Flip card</Button>
        </div>
      </div>
    </div>
  );
}
