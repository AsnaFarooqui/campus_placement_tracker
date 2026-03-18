import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole, currentStudent } from "./mock-data";

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  userName: string;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [userName, setUserName] = useState("");

  const login = (r: UserRole, name: string) => {
    setIsAuthenticated(true);
    setRole(r);
    setUserName(name || (r === "student" ? currentStudent.name : r === "recruiter" ? "Recruiter" : "Placement Officer"));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole("student");
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
