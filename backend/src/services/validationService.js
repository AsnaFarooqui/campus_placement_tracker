const VALID_ROLES = ["student", "recruiter", "officer", "admin"];
const VALID_JOB_STATUSES = ["draft", "open", "closed"];
const VALID_EMPLOYMENT_TYPES = ["full-time", "internship"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFutureDate(value, now = new Date()) {
  const date = parseDate(value);
  return Boolean(date && date.getTime() > now.getTime());
}

function validateStudentProfile(profile) {
  const errors = [];

  if (!isNonEmptyString(profile.name)) errors.push("Name is required");
  if (!isNonEmptyString(profile.email)) errors.push("Email is required");
  if (!VALID_ROLES.includes(profile.role)) errors.push("A valid role is required");

  if (profile.role === "student") {
    if (!isNonEmptyString(profile.branch)) errors.push("Branch is required for students");
    if (!isFiniteNumber(profile.cgpa) || profile.cgpa < 0 || profile.cgpa > 4) {
      errors.push("CGPA must be between 0.0 and 4.0");
    }
    if (!Number.isInteger(profile.backlogs) || profile.backlogs < 0) {
      errors.push("Backlogs must be a non-negative whole number");
    }
  }

  return errors;
}

function validateJobPayload(payload, { partial = false, now = new Date() } = {}) {
  const errors = [];

  const requiredStrings = ["title", "company", "description"];
  for (const field of requiredStrings) {
    if (!partial || Object.prototype.hasOwnProperty.call(payload, field)) {
      if (!isNonEmptyString(payload[field])) errors.push(`${field} is required`);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "employmentType")) {
    if (payload.employmentType && !VALID_EMPLOYMENT_TYPES.includes(payload.employmentType)) {
      errors.push("Employment type must be full-time or internship");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "status")) {
    if (payload.status && !VALID_JOB_STATUSES.includes(payload.status)) {
      errors.push("Job status must be draft, open, or closed");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "salaryMin")) {
    if (!isFiniteNumber(payload.salaryMin) || payload.salaryMin < 0) {
      errors.push("Minimum salary must be a non-negative number");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "salaryMax")) {
    if (!isFiniteNumber(payload.salaryMax) || payload.salaryMax < 0) {
      errors.push("Maximum salary must be a non-negative number");
    }
  }

  if (
    isFiniteNumber(payload.salaryMin) &&
    isFiniteNumber(payload.salaryMax) &&
    payload.salaryMin > payload.salaryMax
  ) {
    errors.push("Maximum salary must be greater than or equal to minimum salary");
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "minCGPA")) {
    if (!isFiniteNumber(payload.minCGPA) || payload.minCGPA < 0 || payload.minCGPA > 4) {
      errors.push("Minimum CGPA must be between 0.0 and 4.0");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "maxBacklogs")) {
    if (!Number.isInteger(payload.maxBacklogs) || payload.maxBacklogs < 0) {
      errors.push("Maximum backlogs must be a non-negative whole number");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "allowedBranches")) {
    if (!Array.isArray(payload.allowedBranches) || payload.allowedBranches.length === 0) {
      errors.push("At least one allowed branch is required");
    } else if (payload.allowedBranches.some((branch) => !isNonEmptyString(branch))) {
      errors.push("Allowed branches cannot contain empty values");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "deadline")) {
    if (!payload.deadline) {
      errors.push("Application deadline is required");
    } else if ((payload.status || "open") !== "closed" && !isFutureDate(payload.deadline, now)) {
      errors.push("Application deadline must be in the future");
    }
  }

  return errors;
}

function validateInterviewPayload(payload, { partial = false, now = new Date() } = {}) {
  const errors = [];

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "jobId")) {
    if (!isNonEmptyString(String(payload.jobId || ""))) errors.push("Job is required");
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "startAt")) {
    if (!payload.startAt || !parseDate(payload.startAt)) {
      errors.push("A valid interview start time is required");
    } else if (!isFutureDate(payload.startAt, now)) {
      errors.push("Interview start time must be in the future");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "durationMinutes")) {
    if (
      payload.durationMinutes !== undefined &&
      (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 15 || payload.durationMinutes > 240)
    ) {
      errors.push("Interview duration must be between 15 and 240 minutes");
    }
  }

  return errors;
}

module.exports = {
  VALID_ROLES,
  isFutureDate,
  parseDate,
  validateStudentProfile,
  validateJobPayload,
  validateInterviewPayload,
};
