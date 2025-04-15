
import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Clock } from "lucide-react";

export interface Status {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  content: string;
  imageUrl?: string;
  link?: {
    url: string;
    title: string;
  };
  postedAt: string;
  expiresAt: string;
}

interface StatusItemProps {
  status: Status;
}

export function StatusItem({ status }: StatusItemProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Calculate time remaining
  const now = new Date();
  const expiresAt = new Date(status.expiresAt);
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  
  // Format expiry time
  const getExpiryText = () => {
    if (hoursRemaining === 0) {
      return "Expires soon";
    } else if (hoursRemaining === 1) {
      return "Expires in 1 hour";
    } else {
      return `Expires in ${hoursRemaining} hours`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-4 slide-in">
      <div className="p-4">
        <div className="flex items-center mb-3">
          <Link to={`/profile/${status.companyId}`} className="flex items-center">
            <div className="status-ring">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src={status.companyLogo} 
                  alt={status.companyName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">{status.companyName}</h3>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{getExpiryText()}</span>
              </div>
            </div>
          </Link>
        </div>
        
        <p className={`text-gray-700 ${!expanded && status.content.length > 100 ? 'line-clamp-3' : ''}`}>
          {status.content}
        </p>
        
        {status.content.length > 100 && (
          <button 
            className="text-whatsapp-green text-sm mt-1 font-medium"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        
        {status.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden bg-gray-100">
            <img 
              src={status.imageUrl} 
              alt="Status update" 
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {status.link && (
          <a 
            href={status.link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 flex items-center p-3 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="mr-3 text-whatsapp-blue">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm text-gray-900">{status.link.title}</span>
              <p className="text-xs text-gray-500 truncate">{status.link.url}</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
