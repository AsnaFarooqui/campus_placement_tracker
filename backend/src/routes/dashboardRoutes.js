const express = require("express");
const router = express.Router();

const { getOfficerDashboard, exportOfficerReport } = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/officer", authMiddleware, getOfficerDashboard);
router.get("/officer/export", authMiddleware, exportOfficerReport);

module.exports = router;
