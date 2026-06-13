import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Role = "owner" | "receptionist";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile from public.staff
  const fetchStaffProfile = async (userId: string): Promise<AuthUser | null> => {
    const { data, error } = await supabase
      .from("staff")
      .select("name, email, role, is_active")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Error fetching staff profile:", error);
      return null;
    }

    if (!data.is_active) {
      console.warn("Staff member is not active:", data.email);
      return null;
    }

    return {
      email: data.email,
      name: data.name,
      role: data.role as Role,
    };
  };

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchStaffProfile(session.user.id);
        if (profile) {
          setUser(profile);
        } else {
          // If profile fetch fails or inactive, log out immediately
          await supabase.auth.signOut();
          setUser(null);
        }
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchStaffProfile(session.user.id);
        if (profile) {
          setUser(profile);
        } else {
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Sign in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Login failed: User record not found.");
    }

    // Immediately fetch and check profile
    const profile = await fetchStaffProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error("Access denied: Your account is not registered in the staff database, or has been suspended.");
    }

    setUser(profile);
    return profile;
  };

  const logout = () => {
    supabase.auth.signOut().then(() => {
      setUser(null);
    });
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
