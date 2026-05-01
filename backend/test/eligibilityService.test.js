const test = require("node:test");
const assert = require("node:assert/strict");

const { getEligibilityResult } = require("../src/services/eligibilityService");

const job = {
  minCGPA: 3.2,
  allowedBranches: ["Computer Science", "Information Technology"],
  maxBacklogs: 1,
};

test("eligibility passes when the student meets all criteria", () => {
  const result = getEligibilityResult({
    role: "student",
    cgpa: 3.5,
    branch: "Computer Science",
    backlogs: 0,
  }, job);

  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test("eligibility returns clear reasons for each failed criterion", () => {
  const result = getEligibilityResult({
    role: "student",
    cgpa: 2.8,
    branch: "Mechanical",
    backlogs: 3,
  }, job);

  assert.equal(result.eligible, false);
  assert.deepEqual(result.reasons, [
    "Minimum CGPA required is 3.2",
    "Maximum allowed backlogs is 1",
    "Your branch is not eligible for this job",
  ]);
});

test("eligibility rejects invalid CGPA range", () => {
  const result = getEligibilityResult({
    role: "student",
    cgpa: 4.5,
    branch: "Computer Science",
    backlogs: 0,
  }, job);

  assert.equal(result.eligible, false);
  assert.match(result.reasons.join(" "), /0\.0 and 4\.0/);
});
