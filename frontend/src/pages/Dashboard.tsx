import DashboardLayout from '@/components/DashboardLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Clock3, CheckCircle2, Users, Award, Building2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRecruiterDashboard, getMyApplications, getMyInterviews, getOfficerDashboard } from '@/lib/api.ts';
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: getMyApplications,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["interviews"],
    queryFn: getMyInterviews,
  });
  const activeApps = applications.filter((a) => !['Selected', 'Rejected'].includes(a.status)).length;
  const upcomingInterviews = interviews.filter((i) => i.status === 'scheduled').length;
  const selected = applications.filter((a) => a.status === 'Selected').length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase} label="Applications" value={applications.length} color="primary" 
          onClick={() => navigate("/applications")} />
        <StatCard icon={Clock3} label="Active" value={activeApps} color="secondary" 
          onClick={() => navigate("/applications?status=active")} />
        <StatCard icon={CheckCircle2} label="Selected" value={selected} color="success" 
          onClick={() => navigate("/applications?status=selected")} />
        <StatCard icon={Users} label="Interviews" value={upcomingInterviews} color="accent" 
          onClick={() => navigate("/interviews")} />
      </div>
    </>
  );
}

function OfficerDashboard() {
   const { data, isLoading } = useQuery({
    queryKey: ["officer-dashboard"],
    queryFn: getOfficerDashboard,
  });

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={data.totalStudents} color="primary" />
        <StatCard icon={Award} label="Students Placed" value={data.placedStudents} change={`${((data.placedStudents / data.totalStudents) * 100).toFixed(1)}%`} color="success" />
        <StatCard icon={Building2} label="Companies" value={data.totalCompanies} color="secondary" />
        <StatCard icon={DollarSign} label="Avg Package (LPA)" value={data.avgPackage} color="accent" />
      </div>
    </>
  );
}

function RecruiterDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-dashboard'],
    queryFn: getRecruiterDashboard,
  });

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading recruiter dashboard...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase} label="Total Jobs" value={data.stats.totalJobs} color="primary" />
        <StatCard icon={CheckCircle2} label="Open Jobs" value={data.stats.openJobs} color="success" />
        <StatCard icon={Users} label="Applications" value={data.stats.totalApplications} color="secondary" />
        <StatCard icon={Award} label="Selected" value={data.stats.selected} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Recent Job Posts</h3>
          <div className="space-y-3">
            {data.recentJobs.map((job) => (
              <div key={job.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{job.title}</div>
                  <div className="text-xs text-muted-foreground">{job.company} · Deadline {job.deadline.slice(0, 10)}</div>
                </div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{job.status}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Company-wise Results</h3>
          <div className="space-y-3">
            {data.companyBreakdown.map((company) => (
              <div key={company.company} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{company.company}</span>
                  <span className="text-muted-foreground">{company.selected}/{company.applications} selected</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${company.applications ? (company.selected / company.applications) * 100 : 0}%` }}
                  />
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
        <h1 className="font-display text-2xl font-bold">Welcome back, {userName} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your placements.</p>
      </div>
      {role === 'officer' ? <OfficerDashboard /> : role === 'recruiter' ? <RecruiterDashboard /> : <StudentDashboard />}
    </DashboardLayout>
  );
}
