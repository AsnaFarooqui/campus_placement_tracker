const express = require("express");
const router = express.Router();

const Interview = require("../models/Interview");

router.post("/", async (req, res) => {
  const interview = new Interview(req.body);
  await interview.save();
  res.json(interview);
});

router.get("/", async (req, res) => {
  const interviews = await Interview.find().populate("applicationId");
  res.json(interviews);
});

module.exports = router;