import React, { createContext, useContext, useEffect, useState } from "react";
import type { AppUser, UserType } from "@/types";
import { userService } from "@/services/admin";
import { normalizePhone, verifyOtp } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type { UserType };
export type User = AppUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** Email/password login with role verification. */
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  /** OTP login for a mobile number. */
  loginWithOtp: (phone: string, otp: string) => Promise<User | null>;
  /** OTP signup; returns the created user, or null on failure. */
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

const readLocalUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};

async function fetchSupabaseUser(sessionUser: any): Promise<User | null> {
  try {
    // 1. Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, phone, email")
      .eq("id", sessionUser.id)
      .maybeSingle();

    // 2. Fetch role from user_roles table
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sessionUser.id);

    const userType: UserType = (roles?.[0]?.role as UserType) || "client";

    return {
      id: sessionUser.id,
      name: profile?.name || sessionUser.user_metadata?.name || "User",
      phone: profile?.phone || normalizePhone(sessionUser.phone || ""),
      email: profile?.email || sessionUser.email || "",
      userType,
      businessId: userType === "business" ? "my-business" : undefined,
    };
  } catch (err) {
    console.warn("Error fetching Supabase user profile:", err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(readLocalUser);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured());

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem(KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(KEY);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const u = await fetchSupabaseUser(session.user);
        if (isMounted) setUser(u);
      }
      if (isMounted) setIsLoading(false);
    });

    // Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const u = await fetchSupabaseUser(session.user);
        if (isMounted) setUser(u);
      } else {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,

    login: async (email, password, userType) => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error || !data.user) return false;

          const u = await fetchSupabaseUser(data.user);
          if (u && u.userType === userType) {
            setUser(u);
            return true;
          }
          // If role doesn't match requested area, sign out
          await supabase.auth.signOut();
          return false;
        } catch (e) {
          console.warn("Supabase login error:", e);
          return false;
        }
      }

      // Local mock fallback
      const u = userService.findByEmail(email.trim());
      if (u && u.userType === userType && password === "password") {
        setUser(u);
        return true;
      }
      return false;
    },

    loginWithOtp: async (phone, otp) => {
      const cleanPhone = normalizePhone(phone);

      if (isSupabaseConfigured()) {
        try {
          const formatted = `+91${cleanPhone}`;
          const { data, error } = await supabase.auth.verifyOtp({
            phone: formatted,
            token: otp.trim(),
            type: "sms",
          });
          if (error || !data.user) return null;

          const u = await fetchSupabaseUser(data.user);
          if (u) setUser(u);
          return u;
        } catch (e) {
          console.warn("Supabase verifyOtp error:", e);
          return null;
        }
      }

      // Local mock fallback
      const u = userService.findByPhone(cleanPhone);
      if (!u || !verifyOtp(otp)) return null;
      setUser(u);
      return u;
    },

    signup: async ({ name, phone, email, role }, otp) => {
      // SECURITY: admin accounts cannot be created by signup
      if (role === "admin") return null;

      const cleanPhone = normalizePhone(phone);

      if (isSupabaseConfigured()) {
        try {
          const formatted = `+91${cleanPhone}`;
          // Verify phone OTP with metadata attached
          const { data, error } = await supabase.auth.verifyOtp({
            phone: formatted,
            token: otp.trim(),
            type: "sms",
          });

          if (!error && data.user) {
            // Update profile with name and role
            await supabase.auth.updateUser({
              data: { name: name.trim(), role },
            });
            const u = await fetchSupabaseUser(data.user);
            if (u) setUser(u);
            return u;
          }
          return null;
        } catch (e) {
          console.warn("Supabase signup error:", e);
          return null;
        }
      }

      // Local mock fallback
      if (!verifyOtp(otp)) return null;
      const u: User = {
        id: `u-${Date.now()}`,
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        userType: role,
        businessId: role === "business" ? "my-business" : undefined,
      };
      userService.upsert(u);
      setUser(u);
      return u;
    },

    updateProfile: async (patch) => {
      if (!user) return;
      const nextPhone = patch.phone ? normalizePhone(patch.phone) : user.phone;
      const next = { ...user, ...patch, phone: nextPhone };

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from("profiles")
            .update({
              name: next.name,
              email: next.email,
              phone: next.phone,
            })
            .eq("id", user.id);
        } catch (e) {
          console.warn("Supabase updateProfile error:", e);
        }
      }

      userService.upsert(next);
      setUser(next);
    },

    logout: async () => {
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn("Supabase signOut error:", e);
        }
      }
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
