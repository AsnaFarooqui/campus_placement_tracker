const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  getNotifications,
  markNotificationRead,
  createAnnouncement,
  createDeadlineReminder,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markNotificationRead);
router.post("/announcements", authMiddleware, createAnnouncement);
router.post("/deadline-reminders", authMiddleware, createDeadlineReminder);

module.exports = router;
