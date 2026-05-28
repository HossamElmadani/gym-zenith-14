import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "owner" | "receptionist";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
};

type AuthCtx = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "pulse.auth";

const KNOWN: Record<string, { name: string; role: Role; password: string }> = {
  "admin@gym.com": { name: "Alex Owner", role: "owner", password: "admin" },
  "reception@gym.com": { name: "Riley Front-Desk", role: "receptionist", password: "reception" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    const k = KNOWN[e];
    if (!k) throw new Error("Unknown email. Try admin@gym.com or reception@gym.com");
    if (password && k.password && password !== k.password) {
      // accept any password in demo, but if both provided must match — soft check
    }
    const u: AuthUser = { email: e, name: k.name, role: k.role };
    setUser(u);
    localStorage.setItem(KEY, JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(KEY);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
