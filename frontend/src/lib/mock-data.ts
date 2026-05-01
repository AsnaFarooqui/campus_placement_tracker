export type UserRole = "student" | "recruiter" | "officer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface StudentProfile extends User {
  role: "student";
  cgpa: number;
  branch: string;
  year: number;
  backlogs: number;
  resumeUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  salaryMin: number;
  salaryMax: number;
  minCGPA: number;
  allowedBranches: string[];
  maxBacklogs: number;
  deadline: string;
  postedDate: string;
  status: "open" | "closed";
  applicants: number;
  location: string;
  employmentType: "full-time" | "internship";
}

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "selected" | "rejected";

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdated: string;
  interviewDate?: string;
}

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

export const currentStudent: StudentProfile = {
  id: "s1",
  name: "Ayesha Khan",
  email: "ayesha.khan@uni.edu.pk",
  role: "student",
  cgpa: 3.6,
  branch: "Computer Science",
  year: 4,
  backlogs: 0,
};

export const mockJobs: Job[] = [
  {
    id: "j1", title: "Software Engineer", company: "Systems Limited", description: "Build scalable enterprise applications for Karachi-based clients.",
    salaryMin: 120000, salaryMax: 180000, minCGPA: 3.5, allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 0, deadline: "2026-06-15", postedDate: "2026-03-01", status: "open", applicants: 42,
    location: "Karachi - PECHS", employmentType: "full-time",
  },
  {
    id: "j2", title: "Data Analyst Intern", company: "10Pearls", description: "Analyze product and customer datasets for local technology teams.",
    salaryMin: 40000, salaryMax: 60000, minCGPA: 3.0, allowedBranches: ["Computer Science", "Mathematics", "Statistics"],
    maxBacklogs: 1, deadline: "2026-06-20", postedDate: "2026-03-05", status: "open", applicants: 78,
    location: "Karachi - Shahrah-e-Faisal", employmentType: "internship",
  },
  {
    id: "j3", title: "Product Manager", company: "Habib Bank Limited", description: "Lead digital product strategy and execution for banking services.",
    salaryMin: 140000, salaryMax: 200000, minCGPA: 3.2, allowedBranches: ["Computer Science", "Electronics", "Mechanical"],
    maxBacklogs: 0, deadline: "2026-06-25", postedDate: "2026-02-28", status: "open", applicants: 35,
    location: "Karachi - HBL Plaza", employmentType: "full-time",
  },
  {
    id: "j4", title: "Frontend Developer", company: "Folio3", description: "Build responsive user interfaces for web and commerce platforms.",
    salaryMin: 80000, salaryMax: 120000, minCGPA: 3.0, allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 2, deadline: "2026-06-30", postedDate: "2026-03-10", status: "open", applicants: 56,
    location: "Karachi - Korangi Creek", employmentType: "full-time",
  },
  {
    id: "j5", title: "ML Engineer", company: "Careem", description: "Work on machine learning models for mobility and marketplace systems.",
    salaryMin: 150000, salaryMax: 220000, minCGPA: 3.7, allowedBranches: ["Computer Science", "Artificial Intelligence"],
    maxBacklogs: 0, deadline: "2026-06-10", postedDate: "2026-03-08", status: "open", applicants: 23,
    location: "Karachi - DHA", employmentType: "full-time",
  },
];

export const mockApplications: Application[] = [
  { id: "a1", jobId: "j1", jobTitle: "Software Engineer", company: "Systems Limited", status: "shortlisted", appliedDate: "2026-03-02", lastUpdated: "2026-03-10" },
  { id: "a2", jobId: "j2", jobTitle: "Data Analyst Intern", company: "10Pearls", status: "interview", appliedDate: "2026-03-06", lastUpdated: "2026-03-12", interviewDate: "2026-03-20" },
  { id: "a3", jobId: "j4", jobTitle: "Frontend Developer", company: "Folio3", status: "applied", appliedDate: "2026-03-11", lastUpdated: "2026-03-11" },
];

export const mockInterviews: InterviewSlot[] = [
  { id: "i1", jobTitle: "Data Analyst Intern", company: "10Pearls", date: "2026-03-20", time: "10:00 AM", type: "technical", status: "scheduled", candidate: "Ayesha Khan" },
  { id: "i2", jobTitle: "Software Engineer", company: "Systems Limited", date: "2026-03-22", time: "2:00 PM", type: "aptitude", status: "scheduled", candidate: "Ayesha Khan" },
  { id: "i3", jobTitle: "Software Engineer", company: "Systems Limited", date: "2026-03-25", time: "11:00 AM", type: "technical", status: "scheduled" },
];

export const placementStats = {
  totalStudents: 450,
  placedStudents: 287,
  totalCompanies: 42,
  avgPackage: 12.5,
  highestPackage: 45,
  totalOffers: 312,
  branchWise: [
    { branch: "Computer Science", total: 120, placed: 98, percentage: 81.7 },
    { branch: "Electronics", total: 80, placed: 52, percentage: 65.0 },
    { branch: "Mechanical", total: 90, placed: 48, percentage: 53.3 },
    { branch: "Civil", total: 70, placed: 35, percentage: 50.0 },
    { branch: "Information Technology", total: 90, placed: 54, percentage: 60.0 },
  ],
  companyWise: [
    { company: "Systems Limited", offers: 12, avgPackage: 35 },
    { company: "10Pearls", offers: 18, avgPackage: 28 },
    { company: "Habib Bank Limited", offers: 22, avgPackage: 25 },
    { company: "Folio3", offers: 15, avgPackage: 18 },
    { company: "Meezan Bank", offers: 45, avgPackage: 8 },
    { company: "TPS Worldwide", offers: 38, avgPackage: 7.5 },
  ],
  monthlyTrend: [
    { month: "Aug", placements: 12 },
    { month: "Sep", placements: 28 },
    { month: "Oct", placements: 45 },
    { month: "Nov", placements: 67 },
    { month: "Dec", placements: 52 },
    { month: "Jan", placements: 43 },
    { month: "Feb", placements: 28 },
    { month: "Mar", placements: 12 },
  ],
};
