import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getProfile } from "./api";

export type UserRole = "student" | "recruiter" | "officer";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cgpa?: number;
  branch?: string;
  backlogs?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserInfo | null;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        });
    }
  }, [token]);

  const login = (newToken: string, userInfo: UserInfo) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
