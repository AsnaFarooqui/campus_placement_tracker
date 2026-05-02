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

const INTERVIEW_MANAGERS = ["recruiter", "officer", "admin"];

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
    { path: "rescheduleRequest.requestedBy", select: "name email" },
    { path: "rescheduleRequest.reviewedBy", select: "name email" },
  ]);
}

async function assertNoInterviewConflicts(slot, startAt, endAt) {
  const overlappingSameJob = await Interview.findOne({
    _id: { $ne: slot._id },
    jobId: slot.jobId._id || slot.jobId,
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
  if (!INTERVIEW_MANAGERS.includes(req.user.role)) {
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
  if (!INTERVIEW_MANAGERS.includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can reschedule interviews");
  }

  const slot = await Interview.findById(req.params.id).populate("jobId", "title company createdBy");
  if (!slot) throw new HttpError(404, "Interview slot not found");
  await assertJobOwnership(slot.jobId, req.user);

  const errors = validateInterviewPayload({ ...req.body, jobId: slot.jobId._id }, { partial: true });
  if (errors.length) throw new HttpError(400, "Interview validation failed", errors);

  const durationMinutes = req.body.durationMinutes || Math.round((slot.endAt - slot.startAt) / 60000);
  const { startAt, endAt } = buildInterviewWindow(req.body.startAt || slot.startAt, durationMinutes);

  await assertNoInterviewConflicts(slot, startAt, endAt);

  slot.startAt = startAt;
  slot.endAt = endAt;
  slot.interviewer = req.body.interviewer ?? slot.interviewer;
  slot.location = req.body.location ?? slot.location;
  slot.type = req.body.type ?? slot.type;
  if (slot.rescheduleRequest?.status === "pending") {
    slot.rescheduleRequest.status = "cancelled";
    slot.rescheduleRequest.reviewedBy = req.user.id;
    slot.rescheduleRequest.reviewedAt = new Date();
    slot.rescheduleRequest.responseNote = "Recruiter rescheduled the interview directly.";
  }
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

exports.requestInterviewReschedule = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new HttpError(403, "Only students can request interview rescheduling");
  }

  const slot = await Interview.findById(req.params.id).populate("jobId", "title company createdBy");
  if (!slot) throw new HttpError(404, "Interview slot not found");

  if (slot.status !== "scheduled" || !slot.bookedBy || String(slot.bookedBy) !== req.user.id) {
    throw new HttpError(403, "You can only request changes for your own scheduled interview");
  }

  if (slot.rescheduleRequest?.status === "pending") {
    throw new HttpError(409, "A reschedule request is already pending for this interview");
  }

  const errors = validateInterviewPayload({ ...req.body, jobId: slot.jobId._id }, { partial: true });
  if (errors.length) throw new HttpError(400, "Reschedule request validation failed", errors);

  const durationMinutes = req.body.durationMinutes || Math.round((slot.endAt - slot.startAt) / 60000);
  const { startAt, endAt } = buildInterviewWindow(req.body.startAt, durationMinutes);

  if (!startAt || !endAt) {
    throw new HttpError(400, "A valid requested interview time is required");
  }

  const existingStudentConflict = await Interview.findOne({
    _id: { $ne: slot._id },
    bookedBy: req.user.id,
    status: "scheduled",
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (existingStudentConflict) {
    throw new HttpError(409, "You already have an interview scheduled during the requested time");
  }

  slot.rescheduleRequest = {
    requestedBy: req.user.id,
    startAt,
    endAt,
    durationMinutes,
    reason: req.body.reason,
    status: "pending",
    requestedAt: new Date(),
  };

  await slot.save();
  await notifyInterview(
    slot.createdBy,
    slot,
    "Interview change requested",
    `${req.user.name || "A student"} requested a new time for ${slot.jobId.title} at ${slot.jobId.company}.`
  );

  const populated = await populateSlot(slot);
  res.json(formatInterviewForClient(populated));
});

exports.reviewInterviewRescheduleRequest = asyncHandler(async (req, res) => {
  if (!INTERVIEW_MANAGERS.includes(req.user.role)) {
    throw new HttpError(403, "Only recruiters, officers, or admins can review reschedule requests");
  }

  const decision = String(req.body.decision || "").toLowerCase();
  if (!["approve", "reject"].includes(decision)) {
    throw new HttpError(400, "Decision must be approve or reject");
  }

  const slot = await Interview.findById(req.params.id).populate("jobId", "title company createdBy");
  if (!slot) throw new HttpError(404, "Interview slot not found");
  await assertJobOwnership(slot.jobId, req.user);

  if (!slot.rescheduleRequest || slot.rescheduleRequest.status !== "pending") {
    throw new HttpError(400, "There is no pending reschedule request for this interview");
  }

  if (decision === "approve") {
    await assertNoInterviewConflicts(slot, slot.rescheduleRequest.startAt, slot.rescheduleRequest.endAt);
    slot.startAt = slot.rescheduleRequest.startAt;
    slot.endAt = slot.rescheduleRequest.endAt;
    slot.rescheduleRequest.status = "approved";
  } else {
    slot.rescheduleRequest.status = "rejected";
  }

  slot.rescheduleRequest.reviewedBy = req.user.id;
  slot.rescheduleRequest.reviewedAt = new Date();
  slot.rescheduleRequest.responseNote = req.body.responseNote;

  await slot.save();

  if (slot.bookedBy) {
    await notifyInterview(
      slot.bookedBy,
      slot,
      decision === "approve" ? "Interview change approved" : "Interview change rejected",
      decision === "approve"
        ? `Your interview for ${slot.jobId.title} at ${slot.jobId.company} has been moved to the requested time.`
        : `Your reschedule request for ${slot.jobId.title} at ${slot.jobId.company} was rejected.`
    );
  }

  const populated = await populateSlot(slot);
  res.json(formatInterviewForClient(populated));
});
