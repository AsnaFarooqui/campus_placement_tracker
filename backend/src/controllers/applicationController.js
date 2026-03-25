const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");

// 🔹 Apply to job (ONLY STUDENTS)
exports.applyToJob = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can apply" });
    }

    const { jobId } = req.body;
    const studentId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid jobId" });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // ❗ Duplicate check
    const existing = await Application.findOne({ studentId, jobId });
    if (existing) {
      return res.status(400).json({ message: "Already applied" });
    }

    const student = await User.findById(studentId);

    // ❗ Eligibility check
    if (
      student.cgpa < job.minCGPA ||
      !job.allowedBranches.includes(student.branch) ||
      student.backlogs > job.maxBacklogs
    ) {
      return res.status(400).json({ message: "Not eligible for this job" });
    }

    const application = await Application.create({
      jobId,
      studentId,
      status: "Applied",
      statusHistory: [
        { status: "Applied", note: "Application submitted" }
      ],
    });

    // update applicant count
    job.applicants += 1;
    await job.save();

    res.status(201).json(application);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// 🔹 Get MY applications (ONLY STUDENTS)
exports.getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const applications = await Application.find({
      studentId: req.user.id
    })
      .populate("jobId", "title company")
      .sort({ createdAt: -1 });

    const formatted = applications.map(app => ({
      _id: app._id,
      jobId: app.jobId?._id,
      jobTitle: app.jobId?.title || "Unknown Job",
      company: app.jobId?.company || "Unknown Company",
      status: app.status,
      appliedDate: app.appliedAt,
      lastUpdated: app.updatedAt,
    }));

    res.json(formatted);

  } catch (error) {
    console.error("GET MY APPLICATIONS ERROR:", error); // 👈 ADD THIS
    res.status(500).json({ error: error.message });
  }
};


// 🔹 Get applications for a job (ONLY RECRUITERS)
exports.getJobApplications = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can view applicants" });
    }

    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate("studentId", "name email cgpa branch");

    res.json(applications);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// 🔹 Update application status (ONLY RECRUITERS)
exports.updateStatus = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Only recruiters can update status" });
    }

    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
      "Applied",
      "Shortlisted",
      "Interview Scheduled",
      "Selected",
      "Rejected"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;

    // 🔥 update history
    application.statusHistory.push({
      status,
      note: note || ""
    });

    await application.save();

    res.json(application);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};