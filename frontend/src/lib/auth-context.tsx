import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getProfile } from "./api.ts";

export type UserRole = 'student' | 'recruiter' | 'officer' | 'admin';

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
  role: UserRole;
  userName: string;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  unsavedChanges: boolean;
  setUnsavedChanges: (dirty: boolean) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((data: any) =>
          setUser({
            id: data._id || data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            cgpa: data.cgpa,
            branch: data.branch,
            backlogs: data.backlogs,
          })
        )
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const login = (newToken: string, userInfo: UserInfo) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userInfo);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivityAt');
    setToken(null);
    setUser(null);
    setUnsavedChanges(false);
  }, []);

  useEffect(() => {
    if (!token) return;

    const timeoutMs = 30 * 60 * 1000;
    const recordActivity = () => {
      localStorage.setItem('lastActivityAt', String(Date.now()));
    };

    if (!localStorage.getItem('lastActivityAt')) {
      recordActivity();
    }

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const lastActivity = Number(localStorage.getItem('lastActivityAt') || Date.now());
      if (Date.now() - lastActivity >= timeoutMs) {
        logout();
      }
    }, 60 * 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, recordActivity));
      window.clearInterval(interval);
    };
  }, [logout, token]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        role: user?.role || 'student',
        userName: user?.name || 'User',
        login,
        logout,
        unsavedChanges,
        setUnsavedChanges,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
