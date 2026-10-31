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
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, phone, email")
      .eq("id", sessionUser.id)
      .maybeSingle();

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem(KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(KEY);
    }
  };

  useEffect(() => {
    // If user already logged in via local storage/demo, preserve it
    const local = readLocalUser();
    if (local) {
      setUserState(local);
      return;
    }

    if (!isSupabaseConfigured()) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const u = await fetchSupabaseUser(session.user);
        if (isMounted && u) setUser(u);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const u = await fetchSupabaseUser(session.user);
        if (isMounted && u) setUser(u);
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
      // 1. Instant dummy login for development & demo accounts
      const u = userService.findByEmail(email.trim());
      if (u && (password === "password" || !password || u.userType === userType)) {
        setUser(u);
        return true;
      }

      // 2. Remote Supabase password login if available
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (!error && data.user) {
            const su = await fetchSupabaseUser(data.user);
            if (su && su.userType === userType) {
              setUser(su);
              return true;
            }
          }
        } catch (e) {
          console.warn("Supabase login error:", e);
        }
      }

      return false;
    },

    loginWithOtp: async (phone, otp) => {
      const cleanPhone = normalizePhone(phone);

      // 1. Verify demo OTP (123456)
      if (verifyOtp(otp)) {
        const existing = userService.findByPhone(cleanPhone);
        if (existing) {
          setUser(existing);
          return existing;
        }

        // New dummy client user
        const devUser: User = {
          id: `u-${Date.now()}`,
          name: `User (${cleanPhone.slice(-4)})`,
          phone: cleanPhone,
          email: `${cleanPhone}@dev.local`,
          userType: "client",
        };
        userService.upsert(devUser);
        setUser(devUser);
        return devUser;
      }

      // 2. Real Supabase SMS OTP if configured
      if (isSupabaseConfigured()) {
        try {
          const formatted = `+91${cleanPhone}`;
          const { data, error } = await supabase.auth.verifyOtp({
            phone: formatted,
            token: otp.trim(),
            type: "sms",
          });
          if (!error && data.user) {
            const u = await fetchSupabaseUser(data.user);
            if (u) {
              setUser(u);
              return u;
            }
          }
        } catch (e) {
          console.warn("Supabase verifyOtp error:", e);
        }
      }

      return null;
    },

    signup: async ({ name, phone, email, role }, otp) => {
      if (role === "admin") return null;
      const cleanPhone = normalizePhone(phone);

      // Verify demo OTP (123456)
      if (verifyOtp(otp)) {
        const u: User = {
          id: `u-${Date.now()}`,
          name: name.trim() || "User",
          phone: cleanPhone,
          email: email.trim() || `${cleanPhone}@dev.local`,
          userType: role,
          businessId: role === "business" ? "my-business" : undefined,
        };
        userService.upsert(u);
        setUser(u);
        return u;
      }

      if (isSupabaseConfigured()) {
        try {
          const formatted = `+91${cleanPhone}`;
          const { data, error } = await supabase.auth.verifyOtp({
            phone: formatted,
            token: otp.trim(),
            type: "sms",
          });

          if (!error && data.user) {
            await supabase.auth.updateUser({
              data: { name: name.trim(), role },
            });
            const u = await fetchSupabaseUser(data.user);
            if (u) {
              setUser(u);
              return u;
            }
          }
        } catch (e) {
          console.warn("Supabase signup error:", e);
        }
      }

      return null;
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
