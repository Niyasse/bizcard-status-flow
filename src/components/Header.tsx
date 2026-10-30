
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PowerIcon, Settings, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto max-w-2xl flex items-center justify-between h-14 px-3 sm:px-4">
        <Link to="/" className="flex items-center space-x-2" aria-label="Bizapp home">
          <div className="w-9 h-9 bg-primary-foreground rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-xl">B</span>
          </div>
          <span className="font-bold text-lg">Bizapp</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 w-11 p-0 rounded-full" aria-label="Account menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=128C7E&color=fff`} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-primary capitalize">{user.userType}</p>
                </div>
                <DropdownMenuSeparator />
                {user.userType === 'business' && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.userType === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <PowerIcon className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="min-h-11 hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
