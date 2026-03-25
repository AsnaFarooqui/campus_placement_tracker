import type { JobFormValues, JobRecord, RecruiterDashboardResponse } from '@/types/job';

const BASE_URL = 'http://localhost:5000/api';

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

export async function loginUser(email: string, password: string) {
  return request('/auth/login', {
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
  return request<JobRecord[]>(`/jobs${query}`);
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

export async function applyToJob(jobId: string) {
  return request(`/jobs/${jobId}/apply`, {
    method: 'POST',
  });
}

export async function getRecruiterDashboard() {
  return request<RecruiterDashboardResponse>('/jobs/dashboard/recruiter');
}
