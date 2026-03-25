import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { applyToJob, closeJob, createJob, getJobs, getMyApplications, updateJob } from '@/lib/api.ts';
import type { JobFormValues, JobRecord } from '@/types/job';
import { Search, MapPin, Clock, DollarSign, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import JobFormDialog from '@/components/jobs/JobFormDialog';
import { useNavigate } from "react-router-dom";

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export default function Jobs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { role } = useAuth();

  const navigate = useNavigate();
  
  const { data: myApps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: getMyApplications,
  });

  const appliedJobIds = new Set(myApps.map(a => a.jobId));

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobs(),
  });

  const filteredJobs = useMemo(
    () => jobs.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())),
    [jobs, search]
  );

  const createMutation = useMutation({
    mutationFn: (data: JobFormValues) => createJob(data),
    onSuccess: () => {
      toast.success('Job created successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormValues> }) => updateJob(id, data),
    onSuccess: () => {
      toast.success('Job updated successfully');
      setEditingJob(null);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const closeMutation = useMutation({
    mutationFn: (jobId: string) => closeJob(jobId),
    onSuccess: () => {
      toast.success('Job closed successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{role === 'recruiter' ? 'Job Posting and Management' : 'Job Listings'}</h1>
          <p className="text-muted-foreground mt-1">
            {role === 'recruiter' ? 'Create, edit, and close jobs from one place.' : `${filteredJobs.length} positions available`}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {(role === 'recruiter' || role === 'officer') && (
            <JobFormDialog triggerLabel="Post Job" onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
            }} />
          )}
          {editingJob && (
            <JobFormDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              initialJob={editingJob}
              onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id: editingJob._id, data });
            }}
            />
          )}
        </div>
      </div>

      {isLoading ? <div className="text-muted-foreground">Loading jobs...</div> : null}

      <div className="grid gap-4">
        {filteredJobs.map((job, i) => {
          const eligibility = job.eligibility;
          return (
            <motion.div
              key={job._id}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{job.company}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />₹{formatMoney(job.salaryMin)} - ₹{formatMoney(job.salaryMax)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Deadline: {job.deadline.slice(0, 10)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 max-w-3xl">{job.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge variant="secondary" className="text-xs">CGPA ≥ {job.minCGPA}</Badge>
                      <Badge variant="secondary" className="text-xs">Max {job.maxBacklogs} backlogs</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{job.employmentType}</Badge>
                      {job.allowedBranches.map((branch) => (
                        <Badge variant="outline" className="text-xs" key={branch}>{branch}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 min-w-[220px]">
                  {role === 'student' && eligibility ? (
                    eligibility.eligible ? (
                      <div className="flex items-center gap-2 text-success text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Eligible
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-destructive text-sm">
                          <XCircle className="w-4 h-4" /> Not eligible
                        </div>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          {eligibility.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                        </ul>
                      </div>
                    )
                  ) : null}

                  {role === 'student' ? (
                    <Button
                      disabled={!eligibility?.eligible || job.status !== 'open' ||  appliedJobIds.has(job._id)}
                      onClick={() => navigate(`/apply/${job._id}`)}
                    >
                      {appliedJobIds.has(job._id) ? "Applied" : "Apply now"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setEditingJob(job); setEditOpen(true); }}>Edit</Button>
                      <Button variant="destructive" disabled={job.status === 'closed'} onClick={() => closeMutation.mutate(job._id)}>
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
