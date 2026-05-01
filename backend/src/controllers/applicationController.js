const mongoose = require("mongoose");

const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpErrors");
const { getEligibilityResult } = require("../services/eligibilityService");
const { validateStatusTransition } = require("../services/statusWorkflowService");
const { notifyStatusChange } = require("../services/notificationService");

async function assertJobOwnership(job, user) {
  if (!job) throw new HttpError(404, "Job not found");
  if (user.role === "recruiter" && String(job.createdBy) !== user.id) {
    throw new HttpError(403, "You can only manage applicants for your own jobs");
  }
}

function formatApplication(app) {
  const job = app.jobId || {};
  const student = app.studentId || {};
  return {
    _id: app._id,
    id: app._id,
    jobId: job._id || app.jobId,
    jobTitle: job.title || "Unknown Job",
    company: job.company || "Unknown Company",
    deadline: job.deadline,
    studentId: student._id || app.studentId,
    studentName: student.name,
    studentEmail: student.email,
    studentCgpa: student.cgpa,
    studentBranch: student.branch,
    status: app.status,
    statusHistory: app.statusHistory,
    appliedDate: app.appliedAt,
    lastUpdated: app.updatedAt,
    resume: app.resume,
    coverLetter: app.coverLetter,
    withdrawnAt: app.withdrawnAt,
  };
}

exports.applyToJob = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new HttpError(403, "Only students can apply");
  }

  const { jobId, resume, coverLetter } = req.body;
  const studentId = req.user.id;

  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    throw new HttpError(400, "A valid jobId is required");
  }

  const job = await Job.findById(jobId);
  if (!job) throw new HttpError(404, "Job not found");

  if (job.status !== "open") {
    throw new HttpError(400, "This job is not open for applications");
  }

  if (new Date(job.deadline) < new Date()) {
    throw new HttpError(400, "Application deadline has passed");
  }

  const existing = await Application.findOne({ studentId, jobId });
  if (existing) {
    throw new HttpError(409, "You have already applied to this job");
  }

  const student = await User.findById(studentId);
  const eligibility = getEligibilityResult(student, job);
  if (!eligibility.eligible) {
    throw new HttpError(400, "You are not eligible for this job", eligibility.reasons);
  }

  const application = await Application.create({
    jobId,
    studentId,
    resume,
    coverLetter,
    status: "Applied",
    statusHistory: [{ status: "Applied", changedBy: studentId, note: "Application submitted" }],
  });

  res.status(201).json(application);
});

exports.getApplications = asyncHandler(async (req, res) => {
  let filters = {};

  if (req.user.role === "student") {
    filters.studentId = req.user.id;
  } else if (req.user.role === "recruiter") {
    const jobs = await Job.find({ createdBy: req.user.id }).select("_id");
    filters.jobId = { $in: jobs.map((job) => job._id) };
  }

  const applications = await Application.find(filters)
    .populate("jobId", "title company deadline createdBy")
    .populate("studentId", "name email cgpa branch backlogs")
    .sort({ createdAt: -1 });

  res.json(applications.map(formatApplication));
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new HttpError(403, "Only students can access this application list");
  }

  const applications = await Application.find({ studentId: req.user.id })
    .populate("jobId", "title company deadline")
    .sort({ createdAt: -1 });

  res.json(applications.map(formatApplication));
});

exports.getJobApplications = asyncHandler(async (req, res) => {
  if (!["recruiter", "officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can view applicants");
  }

  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  await assertJobOwnership(job, req.user);

  const applications = await Application.find({ jobId })
    .populate("studentId", "name email cgpa branch backlogs")
    .populate("jobId", "title company deadline")
    .sort({ createdAt: -1 });

  res.json(applications.map(formatApplication));
});

exports.updateStatus = asyncHandler(async (req, res) => {
  if (!["recruiter", "officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can update status");
  }

  const { id } = req.params;
  const { status, note } = req.body;

  const application = await Application.findById(id).populate("jobId", "title company createdBy");
  if (!application) throw new HttpError(404, "Application not found");

  await assertJobOwnership(application.jobId, req.user);

  const transition = validateStatusTransition(application.status, status);
  if (!transition.valid) {
    throw new HttpError(400, transition.message);
  }

  if (application.status !== status) {
    application.status = status;
    application.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: note || "",
    });

    await application.save();
    await notifyStatusChange(application, application.jobId, status);
  }

  res.json(application);
});

exports.withdrawApplication = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new HttpError(403, "Only students can withdraw applications");
  }

  const application = await Application.findById(req.params.id).populate("jobId", "deadline title company");
  if (!application) throw new HttpError(404, "Application not found");

  if (String(application.studentId) !== req.user.id) {
    throw new HttpError(403, "You can only withdraw your own applications");
  }

  if (new Date(application.jobId.deadline) < new Date()) {
    throw new HttpError(400, "Applications can only be withdrawn before the deadline");
  }

  const transition = validateStatusTransition(application.status, "Withdrawn");
  if (!transition.valid) {
    throw new HttpError(400, transition.message);
  }

  application.status = "Withdrawn";
  application.withdrawnAt = new Date();
  application.statusHistory.push({
    status: "Withdrawn",
    changedBy: req.user.id,
    note: "Application withdrawn by student",
  });

  await application.save();
  res.json(application);
});
