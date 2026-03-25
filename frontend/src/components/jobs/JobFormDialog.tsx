import { useEffect, useMemo, useState } from 'react';
import type { JobFormValues, JobRecord } from '@/types/job';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const branchOptions = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Mechanical',
  'Civil',
  'Artificial Intelligence',
  'Mathematics',
  'Statistics',
];

const defaultForm: JobFormValues = {
  title: '',
  company: '',
  description: '',
  location: '',
  employmentType: 'full-time',
  salaryMin: 0,
  salaryMax: 0,
  minCGPA: 0,
  allowedBranches: ['Computer Science'],
  maxBacklogs: 0,
  deadline: '',
  status: 'open',
};

interface Props {
  triggerLabel?: string;
  onSubmit: (data: JobFormValues) => Promise<void>;
  initialJob?: JobRecord | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function JobFormDialog({ triggerLabel, onSubmit, initialJob, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<JobFormValues>(defaultForm);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const mode = useMemo(() => (initialJob ? 'edit' : 'create'), [initialJob]);

  useEffect(() => {
    if (initialJob) {
      setForm({
        title: initialJob.title,
        company: initialJob.company,
        description: initialJob.description,
        location: initialJob.location,
        employmentType: initialJob.employmentType,
        salaryMin: initialJob.salaryMin,
        salaryMax: initialJob.salaryMax,
        minCGPA: initialJob.minCGPA,
        allowedBranches: initialJob.allowedBranches,
        maxBacklogs: initialJob.maxBacklogs,
        deadline: initialJob.deadline.slice(0, 10),
        status: initialJob.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialJob, open]);

  const toggleBranch = (branch: string) => {
    setForm((current) => {
      const exists = current.allowedBranches.includes(branch);
      const nextBranches = exists
        ? current.allowedBranches.filter((value) => value !== branch)
        : [...current.allowedBranches, branch];

      return {
        ...current,
        allowedBranches: nextBranches.length > 0 ? nextBranches : current.allowedBranches,
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerLabel ? (
        <DialogTrigger asChild>
          <Button>{triggerLabel}</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Job Posting' : 'Edit Job Posting'}</DialogTitle>
          <DialogDescription>
            Add complete eligibility criteria so backend validation stays consistent with the SRS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Job title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} /></div>
          <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="space-y-2"><Label>Employment type</Label><Select value={form.employmentType} onValueChange={(value: 'full-time' | 'internship') => setForm({ ...form, employmentType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full-time">Full-time</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Salary min</Label><Input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Salary max</Label><Input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Minimum CGPA</Label><Input type="number" min="0" max="4" step="0.01" value={form.minCGPA} onChange={(e) => setForm({ ...form, minCGPA: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Maximum backlogs</Label><Input type="number" min="0" value={form.maxBacklogs} onChange={(e) => setForm({ ...form, maxBacklogs: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value: 'draft' | 'open' | 'closed') => setForm({ ...form, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
          <div className="space-y-2 md:col-span-2"><Label>Allowed branches</Label><div className="flex flex-wrap gap-2">{branchOptions.map((branch) => (<Button key={branch} type="button" variant={form.allowedBranches.includes(branch) ? 'default' : 'outline'} onClick={() => toggleBranch(branch)} className="text-xs">{branch}</Button>))}</div></div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : mode === 'create' ? 'Create Job' : 'Save Changes'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
