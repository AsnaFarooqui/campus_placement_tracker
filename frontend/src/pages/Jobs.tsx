import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { mockJobs, currentStudent } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { Search, MapPin, Clock, DollarSign, CheckCircle2, XCircle, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { applyToJob } from "../services/applicationService";
import { mockApplications } from "@/lib/mock-data";

function checkEligibility(job: typeof mockJobs[0]) {
  const reasons: string[] = [];
  if (currentStudent.cgpa < job.minCGPA) reasons.push(`CGPA ${currentStudent.cgpa} < ${job.minCGPA}`);
  if (!job.allowedBranches.includes(currentStudent.branch)) reasons.push(`Branch not eligible`);
  if (currentStudent.backlogs > job.maxBacklogs) reasons.push(`Too many backlogs`);
  return { eligible: reasons.length === 0, reasons };
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const { role } = useAuth();
  const appliedJobIds = mockApplications.map(app => app.jobId);

  const handleApply = async (jobId: string) => {
    try {
      await applyToJob(jobId);
      toast.success("Application submitted successfully!");

      // OPTIONAL: mark as applied locally
      // (you can later replace with real API state)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error applying");
    }
  };

  const filtered = mockJobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} positions available</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((job, i) => {
          const { eligible, reasons } = checkEligibility(job);
          const isApplied = appliedJobIds.includes(job.id);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                    <p className="text-muted-foreground text-sm">{job.company}</p>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        ₹{job.salaryMin / 1000}K - ₹{job.salaryMax / 1000}K
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Deadline: {job.deadline}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        CGPA ≥ {job.minCGPA}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Max {job.maxBacklogs} backlogs
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {job.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {job.applicants} applicants
                  </span>
  
                  {role === "student" &&
                    (eligible ? (
                      <Button
                        size="sm"
                        onClick={() => handleApply(job.id)} 
                        disabled={isApplied}
                        className={`flex items-center gap-2 px-4 py-2 ${
                          isApplied
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isApplied ? "Applied" : "Apply"}
                      </Button>
                    ) : (
                      <div className="text-right">
                        <Button size="sm" variant="outline" disabled className="opacity-50">
                          <XCircle className="w-4 h-4 mr-1" />
                          Not Eligible
                        </Button>
                        <div className="text-xs text-destructive mt-1">
                          {reasons.join(", ")}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}