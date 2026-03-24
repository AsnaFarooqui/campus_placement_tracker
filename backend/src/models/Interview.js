const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
  },
  timeSlot: Date,
  interviewer: String,
  status: {
    type: String,
    default: "Scheduled",
  },
});

module.exports = mongoose.model("Interview", interviewSchema);