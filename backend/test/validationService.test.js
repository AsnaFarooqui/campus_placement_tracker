const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isFutureDate,
  validateJobPayload,
  validateStudentProfile,
} = require("../src/services/validationService");

test("deadline validation rejects past dates and accepts future dates", () => {
  const now = new Date("2026-05-01T00:00:00.000Z");
  assert.equal(isFutureDate("2026-04-30", now), false);
  assert.equal(isFutureDate("2026-05-02", now), true);
});

test("job validation enforces salary, CGPA, branch, backlog, and future deadline rules", () => {
  const errors = validateJobPayload({
    title: "Engineer",
    company: "Acme",
    description: "Build services",
    salaryMin: 90000,
    salaryMax: 80000,
    minCGPA: 4.5,
    allowedBranches: [],
    maxBacklogs: -1,
    deadline: "2026-04-30",
    status: "open",
  }, { now: new Date("2026-05-01T00:00:00.000Z") });

  assert.ok(errors.includes("Maximum salary must be greater than or equal to minimum salary"));
  assert.ok(errors.includes("Minimum CGPA must be between 0.0 and 4.0"));
  assert.ok(errors.includes("At least one allowed branch is required"));
  assert.ok(errors.includes("Maximum backlogs must be a non-negative whole number"));
  assert.ok(errors.includes("Application deadline must be in the future"));
});

test("student profile validation constrains CGPA to 0.0 through 4.0", () => {
  const errors = validateStudentProfile({
    name: "Student",
    email: "student@example.com",
    role: "student",
    branch: "Computer Science",
    cgpa: 4.2,
    backlogs: 0,
  });

  assert.deepEqual(errors, ["CGPA must be between 0.0 and 4.0"]);
});
