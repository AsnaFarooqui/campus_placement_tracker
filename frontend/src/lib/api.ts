import type { JobFormValues, JobRecord, RecruiterDashboardResponse, OfficerDashboardResponse } from '@/types/job';

const BASE_URL = 'http://localhost:5000/api';

type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: "Applied" | "Shortlisted" | "Interview" | "Selected" | "Rejected";
  appliedDate: string;
  lastUpdated: string;
  resume?: string;
  coverLetter?: string;
};

export interface InterviewSlot {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  type: "aptitude" | "technical" | "hr";
  status: "scheduled" | "completed" | "cancelled";
  candidate?: string;
}

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "recruiter" | "officer";
    cgpa?: number;
    branch?: string;
    backlogs?: number;
  };
};

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed') as Error & { details?: string[] | null };
    error.details = data.details || null;
    throw error;
  }

  return data as T;
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  role: string;
  cgpa?: number;
  branch?: string;
  backlogs?: number;
}) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export async function getProfile() {
  return request('/auth/profile');
}

export async function updateProfile(data: {
  name: string;
  cgpa?: number;
  branch?: string;
  backlogs?: number;
}) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getJobs(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await request<JobRecord[]>(`/jobs${query}`);

  return data.map((job) => ({
    ...job,
    id: job._id,
  }));
}

export async function createJob(job: JobFormValues) {
  return request<JobRecord>('/jobs', {
    method: 'POST',
    body: JSON.stringify(job),
  });
}

export async function updateJob(jobId: string, job: Partial<JobFormValues>) {
  return request<JobRecord>(`/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(job),
  });
}

export async function closeJob(jobId: string) {
  return request<JobRecord>(`/jobs/${jobId}/close`, {
    method: 'PATCH',
  });
}

export async function applyToJob(
  jobId: string,
  data: { resume: string; coverLetter: string }
) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify({ jobId, ...data }),
  });
}

export async function getMyApplications(): Promise<Application[]> {
  const data = await request<any[]>("/applications/me");

  return data.map((app) => ({
    id: app._id,
    jobId: app.jobId?._id || app.jobId,
    jobTitle: app.jobTitle || app.jobId?.title || "Unknown",
    company: app.company || app.jobId?.company || "Unknown",
    
    status: app.status,
    appliedDate: app.appliedDate || app.appliedAt,
    lastUpdated: app.lastUpdated || app.updatedAt,

    resume: app.resume,
    coverLetter: app.coverLetter,
  }));
}

export async function getMyInterviews(): Promise<InterviewSlot[]> {
  return request<InterviewSlot[]>("/interviews");
}

export async function getRecruiterDashboard() {
  return request<RecruiterDashboardResponse>('/jobs/dashboard/recruiter');
}

export async function getOfficerDashboard() {
  return request<OfficerDashboardResponse>('/dashboard/officer');
}
