import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Briefcase, FileText, Calendar, BarChart3,
  LogOut, GraduationCap, Building2, Users, Settings,
} from "lucide-react";

const navItems = {
  student: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "Job Listings", path: "/jobs" },
    { icon: FileText, label: "My Applications", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "My Job Posts", path: "/jobs" },
    { icon: Users, label: "Applicants", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
  ],
  officer: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "All Jobs", path: "/jobs" },
    { icon: Users, label: "All Applications", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ],
};

export default function AppSidebar() {
  const { user } = useAuth();

  const role = user?.role;
  const userName = user?.name;
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = role ? navItems[role] : [];

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-sidebar-foreground">PlaceTrack</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items?.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-sm font-bold">
            {userName?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{userName || "User"}</div>
            <div className="text-xs text-sidebar-foreground/50 capitalize">{role}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
