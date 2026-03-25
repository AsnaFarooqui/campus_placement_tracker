import { describe, it, expect } from "vitest";

// ─── Types ───────────────────────────────────────────────────────────────────

type JobStatus = "open" | "closed";

interface Job {
  id: string;
  title: string;
  description: string;
  salaryMin: number;
  salaryMax: number;
  minCGPA: number;
  allowedBranches: string[];
  maxBacklogs: number;
  deadline: string;
  status: JobStatus;
}

interface StudentProfile {
  cgpa: number;
  branch: string;
  backlogs: number;
}

// ─── Simulated functions (mirrors what Member B's backend does) ───────────────

function createJob(data: Omit<Job, "id" | "status">): Job {
  if (!data.title || !data.description) {
    throw new Error("Title and description are required");
  }
  if (data.salaryMin > data.salaryMax) {
    throw new Error("Minimum salary cannot exceed maximum salary");
  }
  if (data.minCGPA < 0 || data.minCGPA > 4) {
    throw new Error("CGPA must be between 0 and 4");
  }
  if (!data.deadline) {
    throw new Error("Deadline is required");
  }
  return {
    ...data,
    id: "job_" + Math.random().toString(36).substr(2, 9),
    status: "open",
  };
}

function editJob(job: Job, updates: Partial<Omit<Job, "id">>): Job {
  if (job.status === "closed") {
    throw new Error("Cannot edit a closed job posting");
  }
  if (updates.salaryMin !== undefined && updates.salaryMax !== undefined) {
    if (updates.salaryMin > updates.salaryMax) {
      throw new Error("Minimum salary cannot exceed maximum salary");
    }
  }
  return { ...job, ...updates };
}

function closeJob(job: Job): Job {
  if (job.status === "closed") {
    throw new Error("Job is already closed");
  }
  return { ...job, status: "closed" };
}

function checkEligibility(job: Job, student: StudentProfile): boolean {
  if (student.cgpa < job.minCGPA) return false;
  if (!job.allowedBranches.includes(student.branch)) return false;
  if (student.backlogs > job.maxBacklogs) return false;
  return true;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const sampleJobData: Omit<Job, "id" | "status"> = {
  title: "Software Engineer",
  description: "Build scalable backend systems",
  salaryMin: 80000,
  salaryMax: 120000,
  minCGPA: 3.0,
  allowedBranches: ["Computer Science", "Information Technology"],
  maxBacklogs: 0,
  deadline: "2026-05-01",
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe("Job Posting — Create", () => {
  it("should create a job with correct fields", () => {
    const job = createJob(sampleJobData);
    expect(job.title).toBe("Software Engineer");
    expect(job.status).toBe("open");
    expect(job.id).toBeDefined();
  });

  it("should throw if title is missing", () => {
    expect(() =>
      createJob({ ...sampleJobData, title: "" })
    ).toThrow("Title and description are required");
  });

  it("should throw if description is missing", () => {
    expect(() =>
      createJob({ ...sampleJobData, description: "" })
    ).toThrow("Title and description are required");
  });

  it("should throw if salaryMin is greater than salaryMax", () => {
    expect(() =>
      createJob({ ...sampleJobData, salaryMin: 150000, salaryMax: 80000 })
    ).toThrow("Minimum salary cannot exceed maximum salary");
  });

  it("should throw if CGPA requirement is out of range", () => {
    expect(() =>
      createJob({ ...sampleJobData, minCGPA: 5 })
    ).toThrow("CGPA must be between 0 and 4");
  });

  it("should throw if deadline is missing", () => {
    expect(() =>
      createJob({ ...sampleJobData, deadline: "" })
    ).toThrow("Deadline is required");
  });
});

describe("Job Posting — Edit", () => {
  it("should update job title successfully", () => {
    const job = createJob(sampleJobData);
    const updated = editJob(job, { title: "Senior Software Engineer" });
    expect(updated.title).toBe("Senior Software Engineer");
  });

  it("should update salary range successfully", () => {
    const job = createJob(sampleJobData);
    const updated = editJob(job, { salaryMin: 90000, salaryMax: 130000 });
    expect(updated.salaryMin).toBe(90000);
    expect(updated.salaryMax).toBe(130000);
  });

  it("should throw if editing a closed job", () => {
    const job = createJob(sampleJobData);
    const closed = closeJob(job);
    expect(() =>
      editJob(closed, { title: "New Title" })
    ).toThrow("Cannot edit a closed job posting");
  });

  it("should throw if updated salaryMin exceeds salaryMax", () => {
    const job = createJob(sampleJobData);
    expect(() =>
      editJob(job, { salaryMin: 200000, salaryMax: 100000 })
    ).toThrow("Minimum salary cannot exceed maximum salary");
  });
});

describe("Job Posting — Close", () => {
  it("should close an open job", () => {
    const job = createJob(sampleJobData);
    const closed = closeJob(job);
    expect(closed.status).toBe("closed");
  });

  it("should throw if job is already closed", () => {
    const job = createJob(sampleJobData);
    const closed = closeJob(job);
    expect(() => closeJob(closed)).toThrow("Job is already closed");
  });
});

describe("Job Posting — Eligibility Check", () => {
  it("should return true for a fully eligible student", () => {
    const job = createJob(sampleJobData);
    const student: StudentProfile = {
      cgpa: 3.5,
      branch: "Computer Science",
      backlogs: 0,
    };
    expect(checkEligibility(job, student)).toBe(true);
  });

  it("should return false if CGPA is too low", () => {
    const job = createJob(sampleJobData);
    const student: StudentProfile = {
      cgpa: 2.5,
      branch: "Computer Science",
      backlogs: 0,
    };
    expect(checkEligibility(job, student)).toBe(false);
  });

  it("should return false if branch is not allowed", () => {
    const job = createJob(sampleJobData);
    const student: StudentProfile = {
      cgpa: 3.5,
      branch: "Mechanical",
      backlogs: 0,
    };
    expect(checkEligibility(job, student)).toBe(false);
  });

  it("should return false if student has too many backlogs", () => {
    const job = createJob(sampleJobData);
    const student: StudentProfile = {
      cgpa: 3.5,
      branch: "Computer Science",
      backlogs: 2,
    };
    expect(checkEligibility(job, student)).toBe(false);
  });

  it("should return true if student meets exact minimum requirements", () => {
    const job = createJob(sampleJobData);
    const student: StudentProfile = {
      cgpa: 3.0,
      branch: "Information Technology",
      backlogs: 0,
    };
    expect(checkEligibility(job, student)).toBe(true);
  });
});