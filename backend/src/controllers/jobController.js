const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/httpErrors');
const { getEligibilityResult } = require('../services/eligibilityService');

const buildJobFilters = (query, currentUser) => {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.company) {
    filters.company = new RegExp(query.company, 'i');
  }

  if (query.search) {
    filters.$or = [
      { title: new RegExp(query.search, 'i') },
      { company: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
    ];
  }

  if (currentUser.role === 'recruiter') {
    filters.createdBy = currentUser.id;
  }

  return filters;
};

exports.createJob = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    createdBy: req.user.id,
  };

  const job = await Job.create(payload);
  res.status(201).json(job);
});

exports.getJobs = asyncHandler(async (req, res) => {
  const filters = buildJobFilters(req.query, req.user || { role: 'student' });
  const jobs = await Job.find(filters)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  if (req.user && req.user.role === 'student') {
    const student = await User.findById(req.user.id);

    const result = jobs.map((job) => {
      const eligibility = getEligibilityResult(student, job);
      return {
        ...job.toObject(),
        eligibility,
      };
    });

    return res.json(result);
  }

  res.json(jobs);
});

exports.getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('createdBy', 'name email');
  if (!job) {
    throw new HttpError(404, 'Job not found');
  }

  if (req.user?.role === 'student') {
    const student = await User.findById(req.user.id);
    return res.json({ ...job.toObject(), eligibility: getEligibilityResult(student, job) });
  }

  res.json(job);
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new HttpError(404, 'Job not found');
  }

  if (req.user.role === 'recruiter' && String(job.createdBy) !== req.user.id) {
    throw new HttpError(403, 'You can only edit your own jobs');
  }

  Object.assign(job, req.body);
  if (req.body.status === 'closed' && !job.closedAt) {
    job.closedAt = new Date();
  }
  if (req.body.status === 'open') {
    job.closedAt = null;
  }

  await job.save();
  res.json(job);
});

exports.closeJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new HttpError(404, 'Job not found');
  }

  if (req.user.role === 'recruiter' && String(job.createdBy) !== req.user.id) {
    throw new HttpError(403, 'You can only close your own jobs');
  }

  if (job.status === 'closed') {
    throw new HttpError(400, 'Job is already closed');
  }

  job.status = 'closed';
  job.closedAt = new Date();
  await job.save();

  res.json(job);
});

exports.applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new HttpError(404, 'Job not found');
  }

  if (job.status !== 'open') {
    throw new HttpError(400, 'This job is not open for applications');
  }

  if (new Date(job.deadline) < new Date()) {
    throw new HttpError(400, 'Application deadline has passed');
  }

  const student = await User.findById(req.user.id);
  const eligibility = getEligibilityResult(student, job);

  if (!eligibility.eligible) {
    throw new HttpError(400, 'You are not eligible for this job', eligibility.reasons);
  }

  const existingApplication = await Application.findOne({ studentId: req.user.id, jobId: job._id });
  if (existingApplication) {
    throw new HttpError(409, 'You have already applied to this job');
  }

  const application = await Application.create({
    studentId: req.user.id,
    jobId: job._id,
  });

  res.status(201).json(application);
});

exports.getRecruiterDashboard = asyncHandler(async (req, res) => {
  const jobFilter = req.user.role === 'recruiter' ? { createdBy: req.user.id } : {};
  const jobs = await Job.find(jobFilter);
  const jobIds = jobs.map((job) => job._id);

  const applications = await Application.find({ jobId: { $in: jobIds } }).populate('jobId', 'company title');

  const stats = {
    totalJobs: jobs.length,
    openJobs: jobs.filter((job) => job.status === 'open').length,
    closedJobs: jobs.filter((job) => job.status === 'closed').length,
    totalApplications: applications.length,
    shortlisted: applications.filter((app) => app.status === 'Shortlisted').length,
    selected: applications.filter((app) => app.status === 'selected').length,
    rejected: applications.filter((app) => app.status === 'Rejected').length,
  };

  const companyBreakdownMap = new Map();
  for (const application of applications) {
    const company = application.jobId?.company || 'Unknown';
    const entry = companyBreakdownMap.get(company) || { company, applications: 0, selected: 0 };
    entry.applications += 1;
    if (application.status === 'selected') entry.selected += 1;
    companyBreakdownMap.set(company, entry);
  }

  const recentJobs = jobs.slice(0, 5).map((job) => ({
    id: job._id,
    title: job.title,
    company: job.company,
    status: job.status,
    deadline: job.deadline,
    createdAt: job.createdAt,
  }));

  res.json({
    stats,
    companyBreakdown: Array.from(companyBreakdownMap.values()),
    recentJobs,
  });
});
