
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, User, Clock, BarChart3, Shield, LogOut } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileMenu({ isOpen, onClose, isAdmin = false }: MobileMenuProps) {
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex" onClick={onClose}>
      <div 
        className="bg-white w-4/5 max-w-sm h-full p-4 flex flex-col slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold text-whatsapp-green">BizCard</h2>
          <button onClick={onClose} className="text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col mt-6 space-y-1">
          <div className="bg-whatsapp-light rounded-full w-16 h-16 flex items-center justify-center self-center mb-4">
            <span className="text-xl font-medium text-whatsapp-green">JD</span>
          </div>
          <p className="text-center font-medium">John Doe</p>
          <p className="text-center text-sm text-gray-500">john@example.com</p>
        </div>
        
        <nav className="mt-8 flex-1">
          <Link 
            to="/" 
            className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <User className="h-5 w-5 text-whatsapp-green mr-3" />
            <span>Profiles</span>
          </Link>
          
          <Link 
            to="/status" 
            className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <Clock className="h-5 w-5 text-whatsapp-green mr-3" />
            <span>Status Updates</span>
          </Link>
          
          <Link 
            to="/dashboard" 
            className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-md"
            onClick={onClose}
          >
            <BarChart3 className="h-5 w-5 text-whatsapp-green mr-3" />
            <span>Dashboard</span>
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              <Shield className="h-5 w-5 text-whatsapp-green mr-3" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>
        
        <div className="border-t pt-4">
          <button className="flex items-center py-3 px-4 hover:bg-gray-100 rounded-md w-full text-left text-red-600">
            <LogOut className="h-5 w-5 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
