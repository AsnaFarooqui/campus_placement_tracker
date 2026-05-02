const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  listInterviews,
  createInterviewSlot,
  bookInterviewSlot,
  cancelInterviewSlot,
  rescheduleInterviewSlot,
  requestInterviewReschedule,
  reviewInterviewRescheduleRequest,
} = require("../controllers/interviewController");

router.get("/", authMiddleware, listInterviews);
router.post("/", authMiddleware, createInterviewSlot);
router.patch("/:id/book", authMiddleware, bookInterviewSlot);
router.patch("/:id/cancel", authMiddleware, cancelInterviewSlot);
router.patch("/:id/reschedule", authMiddleware, rescheduleInterviewSlot);
router.patch("/:id/reschedule-request", authMiddleware, requestInterviewReschedule);
router.patch("/:id/reschedule-request/review", authMiddleware, reviewInterviewRescheduleRequest);

module.exports = router;
