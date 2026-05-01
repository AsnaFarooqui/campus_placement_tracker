const Interview = require("../models/Interview");
const Job = require("../models/Job");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpErrors");
const { validateInterviewPayload } = require("../services/validationService");
const {
  buildInterviewWindow,
  formatInterviewForClient,
} = require("../services/schedulingService");
const { validateStatusTransition } = require("../services/statusWorkflowService");
const { notifyInterview } = require("../services/notificationService");

async function assertJobOwnership(job, user) {
  if (!job) throw new HttpError(404, "Job not found");
  if (user.role === "recruiter" && String(job.createdBy) !== user.id) {
    throw new HttpError(403, "You can only manage interviews for your own jobs");
  }
}

async function populateSlot(slot) {
  return slot.populate([
    { path: "jobId", select: "title company createdBy" },
    { path: "bookedBy", select: "name email" },
  ]);
}

exports.listInterviews = asyncHandler(async (req, res) => {
  let filters = {};

  if (req.user.role === "student") {
    filters = {
      $or: [
        { status: "available" },
        { bookedBy: req.user.id },
      ],
    };
  } else if (req.user.role === "recruiter") {
    filters.createdBy = req.user.id;
  }

  const interviews = await Interview.find(filters)
    .populate("jobId", "title company createdBy")
    .populate("bookedBy", "name email")
    .sort({ startAt: 1 });

  res.json(interviews.map(formatInterviewForClient));
});

exports.createInterviewSlot = asyncHandler(async (req, res) => {
  if (!["recruiter", "officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can create interview slots");
  }

  const errors = validateInterviewPayload(req.body);
  if (errors.length) throw new HttpError(400, "Interview validation failed", errors);

  const job = await Job.findById(req.body.jobId);
  await assertJobOwnership(job, req.user);

  const durationMinutes = req.body.durationMinutes || 60;
  const { startAt, endAt } = buildInterviewWindow(req.body.startAt, durationMinutes);

  const overlapping = await Interview.findOne({
    jobId: job._id,
    status: { $ne: "cancelled" },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (overlapping) {
    throw new HttpError(409, "Another interview slot already overlaps this time for the same job");
  }

  const slot = await Interview.create({
    jobId: job._id,
    createdBy: req.user.id,
    startAt,
    endAt,
    interviewer: req.body.interviewer,
    location: req.body.location,
    type: req.body.type || "technical",
    notes: req.body.notes,
    status: "available",
  });

  const populated = await populateSlot(slot);
  res.status(201).json(formatInterviewForClient(populated));
});

exports.bookInterviewSlot = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new HttpError(403, "Only students can book interview slots");
  }

  const slot = await Interview.findById(req.params.id).populate("jobId", "title company");
  if (!slot) throw new HttpError(404, "Interview slot not found");
  if (slot.status !== "available" || slot.bookedBy) {
    throw new HttpError(409, "This interview slot is already booked or unavailable");
  }

  const application = await Application.findOne({
    studentId: req.user.id,
    jobId: slot.jobId._id,
  });

  if (!application) {
    throw new HttpError(400, "You must apply for this job before booking an interview");
  }

  if (!["Shortlisted", "Interview Scheduled"].includes(application.status)) {
    throw new HttpError(400, "Only shortlisted applicants can book interview slots");
  }

  const conflict = await Interview.findOne({
    _id: { $ne: slot._id },
    bookedBy: req.user.id,
    status: "scheduled",
    startAt: { $lt: slot.endAt },
    endAt: { $gt: slot.startAt },
  });

  if (conflict) {
    throw new HttpError(409, "You already have an interview scheduled during this time");
  }

  slot.bookedBy = req.user.id;
  slot.applicationId = application._id;
  slot.status = "scheduled";

  const transition = validateStatusTransition(application.status, "Interview Scheduled");
  if (transition.valid && application.status !== "Interview Scheduled") {
    application.status = "Interview Scheduled";
    application.statusHistory.push({
      status: "Interview Scheduled",
      changedBy: req.user.id,
      note: "Interview slot booked",
    });
    await application.save();
  }

  await slot.save();
  await notifyInterview(
    req.user.id,
    slot,
    "Interview booked",
    `Your interview for ${slot.jobId.title} at ${slot.jobId.company} is scheduled.`
  );

  const populated = await populateSlot(slot);
  res.json(formatInterviewForClient(populated));
});

exports.cancelInterviewSlot = asyncHandler(async (req, res) => {
  const slot = await Interview.findById(req.params.id).populate("jobId", "title company createdBy");
  if (!slot) throw new HttpError(404, "Interview slot not found");

  if (req.user.role === "student") {
    if (!slot.bookedBy || String(slot.bookedBy) !== req.user.id) {
      throw new HttpError(403, "You can only cancel your own interview booking");
    }
    slot.bookedBy = null;
    slot.applicationId = null;
    slot.status = "available";
    await slot.save();
  } else if (["recruiter", "officer", "admin"].includes(req.user.role)) {
    await assertJobOwnership(slot.jobId, req.user);
    slot.status = "cancelled";
    await slot.save();
    if (slot.bookedBy) {
      await notifyInterview(
        slot.bookedBy,
        slot,
        "Interview cancelled",
        `The interview for ${slot.jobId.title} at ${slot.jobId.company} was cancelled.`
      );
    }
  } else {
    throw new HttpError(403, "You are not allowed to cancel this interview");
  }

  const populated = await populateSlot(slot);
  res.json(formatInterviewForClient(populated));
});

exports.rescheduleInterviewSlot = asyncHandler(async (req, res) => {
  if (!["recruiter", "officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can reschedule interviews");
  }

  const slot = await Interview.findById(req.params.id).populate("jobId", "title company createdBy");
  if (!slot) throw new HttpError(404, "Interview slot not found");
  await assertJobOwnership(slot.jobId, req.user);

  const errors = validateInterviewPayload({ ...req.body, jobId: slot.jobId._id }, { partial: true });
  if (errors.length) throw new HttpError(400, "Interview validation failed", errors);

  const durationMinutes = req.body.durationMinutes || Math.round((slot.endAt - slot.startAt) / 60000);
  const { startAt, endAt } = buildInterviewWindow(req.body.startAt || slot.startAt, durationMinutes);

  const overlappingSameJob = await Interview.findOne({
    _id: { $ne: slot._id },
    jobId: slot.jobId._id,
    status: { $ne: "cancelled" },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (overlappingSameJob) {
    throw new HttpError(409, "Another interview slot already overlaps this time for the same job");
  }

  if (slot.bookedBy) {
    const studentConflict = await Interview.findOne({
      _id: { $ne: slot._id },
      bookedBy: slot.bookedBy,
      status: "scheduled",
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });

    if (studentConflict) {
      throw new HttpError(409, "The booked student already has an interview during this time");
    }
  }

  slot.startAt = startAt;
  slot.endAt = endAt;
  slot.interviewer = req.body.interviewer ?? slot.interviewer;
  slot.location = req.body.location ?? slot.location;
  slot.type = req.body.type ?? slot.type;
  await slot.save();

  if (slot.bookedBy) {
    await notifyInterview(
      slot.bookedBy,
      slot,
      "Interview rescheduled",
      `The interview for ${slot.jobId.title} at ${slot.jobId.company} has a new time.`
    );
  }

  const populated = await populateSlot(slot);
  res.json(formatInterviewForClient(populated));
});
