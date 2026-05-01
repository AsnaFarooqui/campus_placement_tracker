import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Award, Building2, DollarSign, TrendingUp, Trophy, Download } from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { exportOfficerReport, getOfficerDashboard } from "@/lib/api.ts";

const PIE_COLORS = [
  "hsl(175, 60%, 40%)",
  "hsl(222, 60%, 22%)",
  "hsl(38, 92%, 50%)",
  "hsl(205, 80%, 50%)",
  "hsl(152, 60%, 40%)",
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["officer-dashboard"],
    queryFn: getOfficerDashboard,
  });

  async function handleExport(format: "csv" | "pdf") {
    try {
      const blob = await exportOfficerReport(format);
      downloadBlob(blob, format === "csv" ? "placement-report.csv" : "placement-report.html");
      toast.success(format === "csv" ? "Excel-compatible CSV exported" : "PDF-ready report opened for printing");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (isLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="text-muted-foreground">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Placement Analytics</h1>
          <p className="text-muted-foreground mt-1">Institutional placement statistics and reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="primary" />
        <StatCard icon={Award} label="Placed" value={stats.placedStudents} color="success" />
        <StatCard icon={Building2} label="Companies" value={stats.totalCompanies} color="secondary" />
        <StatCard icon={DollarSign} label="Avg Package" value={stats.avgPackage} color="accent" />
        <StatCard icon={Trophy} label="Highest Package" value={stats.highestPackage} color="info" />
        <StatCard icon={TrendingUp} label="Total Offers" value={stats.totalOffers} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Monthly Placement Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip />
              <Line type="monotone" dataKey="placements" stroke="hsl(175, 60%, 40%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Company-wise Offers</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.companyWise}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 87%)" />
              <XAxis dataKey="company" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
              <Tooltip />
              <Bar dataKey="offers" fill="hsl(222, 60%, 22%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Branch-wise Distribution</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={280} className="max-w-xs">
            <PieChart>
              <Pie data={stats.branchWise} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="placed" nameKey="branch" paddingAngle={3}>
                {stats.branchWise.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3 flex-1 w-full">
            {stats.branchWise.map((branch, index) => (
              <div key={branch.branch} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{branch.branch}</span>
                    <span className="text-muted-foreground">{branch.placed} placed ({branch.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-1">
                    <div className="h-full rounded-full" style={{ width: `${branch.percentage}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
