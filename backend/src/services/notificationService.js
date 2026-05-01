const Notification = require("../models/Notification");

async function createNotification(data) {
  if (!data.userId) return null;
  return Notification.create(data);
}

async function notifyStatusChange(application, job, status) {
  return createNotification({
    userId: application.studentId,
    type: "status",
    title: "Application status updated",
    message: `${job?.company || "A recruiter"} moved ${job?.title || "your application"} to ${status}.`,
    relatedJob: application.jobId,
    relatedApplication: application._id,
  });
}

async function notifyInterview(userId, slot, title, message) {
  return createNotification({
    userId,
    type: "interview",
    title,
    message,
    relatedJob: slot.jobId,
    relatedApplication: slot.applicationId,
    relatedInterview: slot._id,
  });
}

module.exports = {
  createNotification,
  notifyInterview,
  notifyStatusChange,
};
