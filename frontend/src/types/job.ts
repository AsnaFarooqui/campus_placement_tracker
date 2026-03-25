export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface JobRecord {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'full-time' | 'internship';
  salaryMin: number;
  salaryMax: number;
  minCGPA: number;
  allowedBranches: string[];
  maxBacklogs: number;
  deadline: string;
  status: 'draft' | 'open' | 'closed';
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  eligibility?: EligibilityResult;
}

export interface JobFormValues {
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'full-time' | 'internship';
  salaryMin: number;
  salaryMax: number;
  minCGPA: number;
  allowedBranches: string[];
  maxBacklogs: number;
  deadline: string;
  status: 'draft' | 'open' | 'closed';
}

export interface RecruiterDashboardResponse {
  stats: {
    totalJobs: number;
    openJobs: number;
    closedJobs: number;
    totalApplications: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
  companyBreakdown: Array<{
    company: string;
    applications: number;
    selected: number;
  }>;
  recentJobs: Array<{
    id: string;
    title: string;
    company: string;
    status: string;
    deadline: string;
    createdAt: string;
  }>;
}
