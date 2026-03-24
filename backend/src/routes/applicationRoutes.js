const express = require("express");
const router = express.Router();

const Application = require("../models/Application");

router.post("/", async (req, res) => {
  const application = new Application(req.body);
  await application.save();
  res.json(application);
});

router.get("/", async (req, res) => {
  const apps = await Application.find().populate("studentId jobId");
  res.json(apps);
});

module.exports = router;