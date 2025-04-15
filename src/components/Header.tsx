
import { Search, Bell, Menu, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mock admin state - in a real app this would come from authentication
  const isAdmin = true;

  return (
    <>
      <header className="bg-whatsapp-green text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="h-6 w-6 md:hidden flex items-center justify-center"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link to="/" className="font-bold text-xl tracking-wide">
                BizCard
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:opacity-80 transition">Profiles</Link>
              <Link to="/status" className="hover:opacity-80 transition">Status</Link>
              <Link to="/dashboard" className="hover:opacity-80 transition">Dashboard</Link>
              {isAdmin && (
                <Link to="/admin" className="hover:opacity-80 transition flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {searchOpen ? (
                <div className="bg-white/20 rounded-full py-1 px-3 flex items-center">
                  <Search className="h-4 w-4 text-white/70" />
                  <input 
                    className="bg-transparent border-none outline-none text-white placeholder-white/70 text-sm w-36 md:w-64 ml-2"
                    placeholder="Search profiles..."
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                </div>
              ) : (
                <Search 
                  className="h-5 w-5 cursor-pointer hover:opacity-80 transition" 
                  onClick={() => setSearchOpen(true)}
                />
              )}
              <Link to="/notifications">
                <Bell className="h-5 w-5 cursor-pointer hover:opacity-80 transition" />
              </Link>
              <Link to="/dashboard" className="hidden md:block">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                  <span className="text-sm font-medium">JD</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        isAdmin={isAdmin} 
      />
    </>
  );
}
