const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"],
    default: "Applied",
  },
});

module.exports = mongoose.model("Application", applicationSchema);