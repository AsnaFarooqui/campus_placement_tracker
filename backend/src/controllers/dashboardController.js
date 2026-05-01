const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpErrors");

function buildPlacementReport(students, jobs, applications) {
  const selectedApps = applications.filter((app) => app.status === "Selected");
  const totalStudents = students.length;
  const placedStudents = new Set(selectedApps.map((app) => String(app.studentId))).size;
  const totalCompanies = new Set(jobs.map((job) => job.company)).size;
  const totalOffers = selectedApps.length;
  const placementPercentage = totalStudents ? Number(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

  const selectedJobMap = new Map(jobs.map((job) => [String(job._id), job]));
  const selectedSalaries = selectedApps
    .map((app) => selectedJobMap.get(String(app.jobId)))
    .filter(Boolean)
    .map((job) => (job.salaryMin + job.salaryMax) / 2);
  const avgPackage = selectedSalaries.length
    ? Number((selectedSalaries.reduce((sum, value) => sum + value, 0) / selectedSalaries.length).toFixed(1))
    : 0;
  const highestPackage = selectedSalaries.length ? Math.max(...selectedSalaries) : 0;

  const branchMap = {};
  for (const student of students) {
    const branch = student.branch || "Unknown";
    branchMap[branch] = branchMap[branch] || { total: 0, placed: 0 };
    branchMap[branch].total += 1;
  }

  for (const app of selectedApps) {
    const student = students.find((entry) => String(entry._id) === String(app.studentId));
    if (!student) continue;
    const branch = student.branch || "Unknown";
    branchMap[branch] = branchMap[branch] || { total: 0, placed: 0 };
    branchMap[branch].placed += 1;
  }

  const branchWise = Object.entries(branchMap).map(([branch, data]) => ({
    branch,
    total: data.total,
    placed: data.placed,
    percentage: data.total ? Number(((data.placed / data.total) * 100).toFixed(1)) : 0,
  }));

  const companyMap = {};
  for (const app of selectedApps) {
    const job = selectedJobMap.get(String(app.jobId));
    if (!job) continue;
    companyMap[job.company] = companyMap[job.company] || { offers: 0, avgPackage: 0, salaryTotal: 0 };
    companyMap[job.company].offers += 1;
    companyMap[job.company].salaryTotal += (job.salaryMin + job.salaryMax) / 2;
  }

  const companyWise = Object.entries(companyMap).map(([company, data]) => ({
    company,
    offers: data.offers,
    avgPackage: data.offers ? Number((data.salaryTotal / data.offers).toFixed(1)) : 0,
  }));

  const monthlyMap = {};
  for (const app of selectedApps) {
    const date = new Date(app.updatedAt || app.createdAt);
    const month = date.toLocaleString("en-US", { month: "short" });
    monthlyMap[month] = (monthlyMap[month] || 0) + 1;
  }

  const monthlyTrend = Object.entries(monthlyMap).map(([month, placements]) => ({ month, placements }));

  return {
    totalStudents,
    placedStudents,
    placementPercentage,
    totalCompanies,
    totalOffers,
    avgPackage,
    highestPackage,
    branchWise,
    companyWise,
    monthlyTrend,
  };
}

exports.getOfficerDashboard = asyncHandler(async (req, res) => {
  if (!["officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only officers or admins can view institutional reports");
  }

  const students = await User.find({ role: "student" });
  const jobs = await Job.find();
  const applications = await Application.find();

  res.json(buildPlacementReport(students, jobs, applications));
});

exports.exportOfficerReport = asyncHandler(async (req, res) => {
  if (!["officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only officers or admins can export institutional reports");
  }

  const format = req.query.format || "csv";
  const students = await User.find({ role: "student" });
  const jobs = await Job.find();
  const applications = await Application.find();
  const report = buildPlacementReport(students, jobs, applications);

  if (format === "json") {
    return res.json(report);
  }

  if (format === "pdf") {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", "attachment; filename=placement-report.html");
    return res.send(`
      <html>
        <head><title>Placement Report</title></head>
        <body>
          <h1>Campus Placement Report</h1>
          <p>Total students: ${report.totalStudents}</p>
          <p>Placed students: ${report.placedStudents}</p>
          <p>Placement percentage: ${report.placementPercentage}%</p>
          <p>Total companies: ${report.totalCompanies}</p>
          <p>Total offers: ${report.totalOffers}</p>
          <script>window.print()</script>
        </body>
      </html>
    `);
  }

  const rows = [
    ["Metric", "Value"],
    ["Total Students", report.totalStudents],
    ["Placed Students", report.placedStudents],
    ["Placement Percentage", report.placementPercentage],
    ["Total Companies", report.totalCompanies],
    ["Total Offers", report.totalOffers],
    ["Average Package", report.avgPackage],
    ["Highest Package", report.highestPackage],
    [],
    ["Branch", "Total", "Placed", "Percentage"],
    ...report.branchWise.map((row) => [row.branch, row.total, row.placed, row.percentage]),
    [],
    ["Company", "Offers", "Average Package"],
    ...report.companyWise.map((row) => [row.company, row.offers, row.avgPackage]),
  ];

  const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=placement-report.csv");
  res.send(csv);
});

module.exports.buildPlacementReport = buildPlacementReport;
