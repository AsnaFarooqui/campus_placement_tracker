const test = require("node:test");
const assert = require("node:assert/strict");

const { buildPlacementReport } = require("../src/controllers/dashboardController");

test("placement report calculates overall, company-wise, and branch-wise statistics", () => {
  const students = [
    { _id: "s1", branch: "Computer Science" },
    { _id: "s2", branch: "Computer Science" },
    { _id: "s3", branch: "Mechanical" },
  ];
  const jobs = [
    { _id: "j1", company: "Acme", salaryMin: 100000, salaryMax: 120000 },
    { _id: "j2", company: "Globex", salaryMin: 80000, salaryMax: 100000 },
  ];
  const applications = [
    { studentId: "s1", jobId: "j1", status: "Selected", updatedAt: new Date("2026-06-01") },
    { studentId: "s2", jobId: "j2", status: "Rejected", updatedAt: new Date("2026-06-02") },
    { studentId: "s3", jobId: "j2", status: "Selected", updatedAt: new Date("2026-06-03") },
  ];

  const report = buildPlacementReport(students, jobs, applications);

  assert.equal(report.totalStudents, 3);
  assert.equal(report.placedStudents, 2);
  assert.equal(report.placementPercentage, 66.7);
  assert.equal(report.totalCompanies, 2);
  assert.equal(report.totalOffers, 2);
  assert.deepEqual(report.companyWise, [
    { company: "Acme", offers: 1, avgPackage: 110000 },
    { company: "Globex", offers: 1, avgPackage: 90000 },
  ]);
  assert.deepEqual(report.branchWise, [
    { branch: "Computer Science", total: 2, placed: 1, percentage: 50 },
    { branch: "Mechanical", total: 1, placed: 1, percentage: 100 },
  ]);
});
