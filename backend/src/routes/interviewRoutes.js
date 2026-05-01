const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  listInterviews,
  createInterviewSlot,
  bookInterviewSlot,
  cancelInterviewSlot,
  rescheduleInterviewSlot,
} = require("../controllers/interviewController");

router.get("/", authMiddleware, listInterviews);
router.post("/", authMiddleware, createInterviewSlot);
router.patch("/:id/book", authMiddleware, bookInterviewSlot);
router.patch("/:id/cancel", authMiddleware, cancelInterviewSlot);
router.patch("/:id/reschedule", authMiddleware, rescheduleInterviewSlot);

module.exports = router;
