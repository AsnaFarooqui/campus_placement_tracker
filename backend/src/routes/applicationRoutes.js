const express = require("express");
const router = express.Router();

const {
  applyToJob,
  getApplications,
  getMyApplications,
  getJobApplications,
  updateStatus,
  withdrawApplication,
} = require("../controllers/applicationController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, applyToJob);
router.get("/", authMiddleware, getApplications);
router.get("/me", authMiddleware, getMyApplications);
router.get("/job/:jobId", authMiddleware, getJobApplications);
router.patch("/:id", authMiddleware, updateStatus);
router.patch("/:id/withdraw", authMiddleware, withdrawApplication);

module.exports = router;
