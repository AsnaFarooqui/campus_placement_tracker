import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { mockApplications, mockJobs, mockInterviews, placementStats } from "@/lib/mock-data";
import { Briefcase, FileText, Calendar, TrendingUp, Users, Building2, Award, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  applied: "bg-info/10 text-info border-info/20",
  shortlisted: "bg-accent/10 text-accent border-accent/20",
  interview: "bg-secondary/10 text-secondary border-secondary/20",
  selected: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

function StudentDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase} label="Open Jobs" value={mockJobs.filter(j => j.status === "open").length} color="primary" />
        <StatCard icon={FileText} label="My Applications" value={mockApplications.length} color="secondary" />
        <StatCard icon={Calendar} label="Upcoming Interviews" value={mockInterviews.filter(i => i.status === "scheduled").length} color="accent" />
        <StatCard icon={TrendingUp} label="Shortlisted" value={mockApplications.filter(a => a.status === "shortlisted").length} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {mockApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium text-sm">{app.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">{app.company}</div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusColors[app.status]}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Interviews */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Upcoming Interviews</h3>
          <div className="space-y-3">
            {mockInterviews.filter(i => i.status === "scheduled").map((iv) => (
              <div key={iv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium text-sm">{iv.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">{iv.company} · {iv.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{iv.date}</div>
                  <div className="text-xs text-muted-foreground">{iv.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function OfficerDashboard() {
  const stats = placementStats;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="primary" />
        <StatCard icon={Award} label="Students Placed" value={stats.placedStudents} change={`${((stats.placedStudents / stats.totalStudents) * 100).toFixed(1)}%`} color="success" />
        <StatCard icon={Building2} label="Companies" value={stats.totalCompanies} color="secondary" />
        <StatCard icon={DollarSign} label="Avg Package (LPA)" value={stats.avgPackage} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Branch-wise Placement</h3>
          <div className="space-y-3">
            {stats.branchWise.map((b) => (
              <div key={b.branch} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.branch}</span>
                  <span className="text-muted-foreground">{b.placed}/{b.total} ({b.percentage}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${b.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Top Recruiters</h3>
          <div className="space-y-3">
            {stats.companyWise.slice(0, 5).map((c, i) => (
              <div key={c.company} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{c.company}</div>
                  <div className="text-xs text-muted-foreground">{c.offers} offers · ₹{c.avgPackage} LPA avg</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role, userName } = useAuth();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">
          Welcome back, {userName || "User"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your placements.</p>
      </div>
      {role === "officer" ? <OfficerDashboard /> : <StudentDashboard />}
    </DashboardLayout>
  );
}
