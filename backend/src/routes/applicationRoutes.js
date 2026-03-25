const express = require("express");
const router = express.Router();

const {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateStatus,
} = require("../controllers/applicationController");

const authMiddleware = require("../middlewares/authMiddleware");

// 🔐 All routes protected
router.post("/", authMiddleware, applyToJob);
router.get("/me", authMiddleware, getMyApplications);
router.get("/job/:jobId", authMiddleware, getJobApplications);
router.patch("/:id", authMiddleware, updateStatus);

module.exports = router;