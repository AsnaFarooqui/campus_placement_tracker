const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");

// 🔹 Apply to job (ONLY STUDENTS)
exports.applyToJob = async (req, res) => {
  try {
    // ✅ Role check
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can apply" });
    }

    const studentId = req.user.id;
    const { jobId } = req.body;

    // ❗ Duplicate check
    const existing = await Application.findOne({ studentId, jobId });
    if (existing) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const student = await User.findById(studentId);
    const job = await Job.findById(jobId);

    if (!student || !job) {
      return res.status(404).json({ message: "Student or Job not found" });
    }

    // ❗ Eligibility validation
    if (
      student.cgpa < job.minCGPA ||
      !job.allowedBranches.includes(student.branch) ||
      student.backlogs > job.maxBacklogs
    ) {
      return res.status(400).json({ message: "Not eligible for this job" });
    }

    const application = new Application({ studentId, jobId });
    await application.save();

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
    }).populate("jobId");

    res.json(applications);

  } catch (error) {
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
      .populate("studentId");

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
    const { status } = req.body;

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
    await application.save();

    res.json(application);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};