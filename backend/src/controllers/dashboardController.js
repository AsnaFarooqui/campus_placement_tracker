const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

exports.getOfficerDashboard = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" });
  const jobs = await Job.find();
  const applications = await Application.find();

  // ===== BASIC STATS =====
  const totalStudents = students.length;

  const selectedApps = applications.filter(a => a.status === "selected");
  const placedStudents = new Set(
    selectedApps.map(a => a.studentId.toString())
  ).size;

  const totalCompanies = new Set(jobs.map(j => j.company)).size;
  const totalOffers = selectedApps.length;

  // ===== BRANCH-WISE =====
  const branchMap = {};

  students.forEach(student => {
    const branch = student.branch || "Unknown";

    if (!branchMap[branch]) {
      branchMap[branch] = { total: 0, placed: 0 };
    }

    branchMap[branch].total += 1;
  });

  selectedApps.forEach(app => {
    const student = students.find(
      s => s._id.toString() === app.studentId.toString()
    );

    if (!student) return;

    const branch = student.branch || "Unknown";
    branchMap[branch].placed += 1;
  });

  const branchWise = Object.entries(branchMap).map(([branch, data]) => ({
    branch,
    total: data.total,
    placed: data.placed,
    percentage: data.total
      ? Number(((data.placed / data.total) * 100).toFixed(1))
      : 0,
  }));

  // ===== COMPANY-WISE =====
  const companyMap = {};

  selectedApps.forEach(app => {
    const job = jobs.find(
      j => j._id.toString() === app.jobId.toString()
    );

    if (!job) return;

    const company = job.company;

    if (!companyMap[company]) {
      companyMap[company] = { offers: 0 };
    }

    companyMap[company].offers += 1;
  });

  const companyWise = Object.entries(companyMap).map(([company, data]) => ({
    company,
    offers: data.offers,
  }));

  res.json({
    totalStudents,
    placedStudents,
    totalCompanies,
    totalOffers,
    branchWise,
    companyWise,
  });
});