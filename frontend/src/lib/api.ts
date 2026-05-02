import type { JobFormValues, JobRecord, RecruiterDashboardResponse, OfficerDashboardResponse } from '@/types/job';

const BASE_URL = 'http://localhost:5000/api';

export type ApplicationStatus =
  | "Applied"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Selected"
  | "Rejected"
  | "Withdrawn";

export type PlacementApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  deadline?: string;
  studentName?: string;
  studentEmail?: string;
  studentCgpa?: number;
  studentBranch?: string;
  status: ApplicationStatus;
  statusHistory?: Array<{ status: ApplicationStatus; changedAt: string; note?: string }>;
  appliedDate: string;
  lastUpdated: string;
  resume?: string;
  coverLetter?: string;
  withdrawnAt?: string;
};

export interface InterviewSlot {
  id: string;
  jobId?: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  startAt?: string;
  endAt?: string;
  type: string;
  status: "available" | "scheduled" | "completed" | "cancelled";
  candidate?: string;
  bookedBy?: string | null;
  interviewer?: string;
  location?: string;
  rescheduleRequest?: {
    requestedBy?: string | null;
    requestedByName?: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    reason?: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    requestedAt?: string | null;
    reviewedBy?: string | null;
    reviewedByName?: string;
    reviewedAt?: string | null;
    responseNote?: string;
  } | null;
}

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "recruiter" | "officer" | "admin";
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
}): Promise<{ message: string; verificationToken?: string }> {
  return request<{ message: string; verificationToken?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export async function verifyEmail(token: string) {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
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

function mapApplication(app: any): PlacementApplication {
  return {
    id: app._id || app.id,
    jobId: app.jobId?._id || app.jobId,
    jobTitle: app.jobTitle || app.jobId?.title || "Unknown",
    company: app.company || app.jobId?.company || "Unknown",
    deadline: app.deadline || app.jobId?.deadline,
    studentName: app.studentName || app.studentId?.name,
    studentEmail: app.studentEmail || app.studentId?.email,
    studentCgpa: app.studentCgpa || app.studentId?.cgpa,
    studentBranch: app.studentBranch || app.studentId?.branch,
    status: app.status,
    statusHistory: app.statusHistory || [],
    appliedDate: app.appliedDate || app.appliedAt,
    lastUpdated: app.lastUpdated || app.updatedAt,
    resume: app.resume,
    coverLetter: app.coverLetter,
    withdrawnAt: app.withdrawnAt,
  };
}

export async function getApplications(): Promise<PlacementApplication[]> {
  const data = await request<any[]>("/applications");
  return data.map(mapApplication);
}

export async function getMyApplications(): Promise<PlacementApplication[]> {
  const data = await request<any[]>("/applications/me");
  return data.map(mapApplication);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, note?: string) {
  return request(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function withdrawApplication(id: string) {
  return request(`/applications/${id}/withdraw`, {
    method: "PATCH",
  });
}

export async function getMyInterviews(): Promise<InterviewSlot[]> {
  return request<InterviewSlot[]>("/interviews");
}

export async function createInterviewSlot(data: {
  jobId: string;
  startAt: string;
  durationMinutes: number;
  type: string;
  interviewer?: string;
  location?: string;
}) {
  return request<InterviewSlot>("/interviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function bookInterviewSlot(id: string) {
  return request<InterviewSlot>(`/interviews/${id}/book`, {
    method: "PATCH",
  });
}

export async function cancelInterviewSlot(id: string) {
  return request<InterviewSlot>(`/interviews/${id}/cancel`, {
    method: "PATCH",
  });
}

export async function rescheduleInterviewSlot(id: string, data: { startAt: string; durationMinutes?: number }) {
  return request<InterviewSlot>(`/interviews/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function requestInterviewReschedule(
  id: string,
  data: { startAt: string; durationMinutes?: number; reason?: string }
) {
  return request<InterviewSlot>(`/interviews/${id}/reschedule-request`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function reviewInterviewRescheduleRequest(
  id: string,
  data: { decision: "approve" | "reject"; responseNote?: string }
) {
  return request<InterviewSlot>(`/interviews/${id}/reschedule-request/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getRecruiterDashboard() {
  return request<RecruiterDashboardResponse>('/jobs/dashboard/recruiter');
}

export async function getOfficerDashboard() {
  return request<OfficerDashboardResponse>('/dashboard/officer');
}

export async function exportOfficerReport(format: "csv" | "pdf" | "json" = "csv") {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/dashboard/officer/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Report export failed");
  }

  return response.blob();
}

export async function getNotifications(): Promise<{
  notifications: Array<{ _id: string; title: string; message: string; type: string; readAt?: string | null }>;
  announcements: Array<{ _id: string; title: string; message: string; audience: string }>;
}> {
  return request("/notifications");
}
