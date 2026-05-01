import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  LayoutDashboard, Briefcase, FileText, Calendar, BarChart3,
  LogOut, GraduationCap, Users, Settings,
} from "lucide-react";

const navItems = {
  student: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "Job Listings", path: "/jobs" },
    { icon: FileText, label: "My Applications", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
    { icon: Settings, label: "Profile", path: "/profile" },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "My Job Posts", path: "/jobs" },
    { icon: Users, label: "Applicants", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
    { icon: Settings, label: "Profile", path: "/profile" },
  ],
  officer: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "All Jobs", path: "/jobs" },
    { icon: Users, label: "All Applications", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Profile", path: "/profile" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "All Jobs", path: "/jobs" },
    { icon: Users, label: "All Applications", path: "/applications" },
    { icon: Calendar, label: "Interviews", path: "/interviews" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Profile", path: "/profile" },
  ],
};

export default function AppSidebar() {
  const { user, logout, unsavedChanges } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const role = user?.role;
  const userName = user?.name;
  const navigate = useNavigate();
  const location = useLocation();
  const items = role ? navItems[role] : [];
  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-16 lg:w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="p-3 lg:p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-sidebar-foreground hidden lg:inline">PlaceTrack</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {items?.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} title={item.label}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
              <item.icon className="w-4.5 h-4.5" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 lg:p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-sm font-bold">
            {userName?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0 hidden lg:block">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{userName || "User"}</div>
            <div className="text-xs text-sidebar-foreground/50 capitalize">{role}</div>
          </div>
        </div>
        <button onClick={() => {
          if (unsavedChanges) {
            setConfirmLogout(true);
          } else {
            signOut();
          }
        }} title="Sign out"
          className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Sign out with unsaved changes?"
        description="Your unsaved profile or form changes will be discarded when you sign out."
        confirmLabel="Discard and sign out"
        onConfirm={signOut}
      />
    </aside>
  );
}
