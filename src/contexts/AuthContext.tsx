import React, { createContext, useContext, useState } from "react";
import type { AppUser, UserType } from "@/types";
import { userService } from "@/services/admin";
import { normalizePhone, verifyOtp } from "@/lib/auth";

export type { UserType };
export type User = AppUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** Demo email/password login (password: "password"). */
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  /** Mock OTP login for an existing phone number. */
  loginWithOtp: (phone: string, otp: string) => Promise<User | null>;
  /** Mock OTP signup; returns the created user, or null for a wrong OTP. */
  signup: (data: { name: string; phone: string; email: string; role: UserType }, otp: string) => Promise<User | null>;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "phone">>) => void;
  logout: () => void;
}

const KEY = "currentUser";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

const readUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(readUser);
  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem(KEY, JSON.stringify(u)); else localStorage.removeItem(KEY);
  };

  const value: AuthContextType = {
    user,
    isLoading: false,
    login: async (email, password, userType) => {
      const u = userService.findByEmail(email.trim());
      if (u && u.userType === userType && password === "password") { setUser(u); return true; }
      return false;
    },
    loginWithOtp: async (phone, otp) => {
      const u = userService.findByPhone(normalizePhone(phone));
      if (!u || !verifyOtp(otp)) return null;
      setUser(u);
      return u;
    },
    signup: async ({ name, phone, email, role }, otp) => {
      if (!verifyOtp(otp) || role === "admin") return null;
      const u: User = {
        id: `u-${Date.now()}`, name: name.trim(), phone: normalizePhone(phone), email: email.trim(), userType: role,
        businessId: role === "business" ? "my-business" : undefined,
      };
      userService.upsert(u);
      setUser(u);
      return u;
    },
    updateProfile: (patch) => {
      if (!user) return;
      const next = { ...user, ...patch, phone: patch.phone ? normalizePhone(patch.phone) : user.phone };
      userService.upsert(next);
      setUser(next);
    },
    logout: () => setUser(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
