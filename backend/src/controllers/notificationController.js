const Notification = require("../models/Notification");
const Announcement = require("../models/Announcement");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpErrors");
const { createNotification } = require("../services/notificationService");

function audienceForRole(role) {
  if (role === "student") return ["all", "students"];
  if (role === "recruiter") return ["all", "recruiters"];
  return ["all", "officers"];
}

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30);

  const announcements = await Announcement.find({
    audience: { $in: audienceForRole(req.user.role) },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    notifications,
    announcements,
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
  if (!notification) throw new HttpError(404, "Notification not found");
  notification.readAt = new Date();
  await notification.save();
  res.json(notification);
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
  if (!["officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only officers or admins can publish announcements");
  }

  const { title, message, audience, expiresAt } = req.body;
  if (!title || !message) {
    throw new HttpError(400, "Announcement title and message are required");
  }

  const announcement = await Announcement.create({
    title,
    message,
    audience: audience || "all",
    expiresAt: expiresAt || null,
    createdBy: req.user.id,
  });

  res.status(201).json(announcement);
});

exports.createDeadlineReminder = asyncHandler(async (req, res) => {
  if (!["officer", "admin"].includes(req.user.role)) {
    throw new HttpError(403, "Only officers or admins can create deadline reminders");
  }

  const { userId, jobId, title, message } = req.body;
  const notification = await createNotification({
    userId,
    relatedJob: jobId,
    type: "deadline",
    title: title || "Application deadline reminder",
    message: message || "A placement application deadline is approaching.",
  });

  res.status(201).json(notification);
});
