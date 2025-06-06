
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserType = 'client' | 'admin' | 'business';

export interface User {
  id: string;
  email: string;
  userType: UserType;
  name: string;
  businessId?: string; // For business owners
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users for demonstration
  const mockUsers = {
    'admin@b.com': { id: 'admin1', email: 'admin@b.com', userType: 'admin' as UserType, name: 'Admin User' },
    'client@b.com': { id: 'client1', email: 'client@b.com', userType: 'client' as UserType, name: 'Client User' },
    'business@b.com': { id: 'business1', email: 'business@b.com', userType: 'business' as UserType, name: 'Business Owner', businessId: 'company1' }
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock authentication - in real app, this would be an API call
    const mockUser = mockUsers[email as keyof typeof mockUsers];
    
    if (mockUser && mockUser.userType === userType && password === 'password') {
      setUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
