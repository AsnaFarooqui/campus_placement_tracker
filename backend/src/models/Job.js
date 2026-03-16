const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  salary: Number,
  minCGPA: Number,
  allowedBranches: [String],
  maxBacklogs: Number,
  deadline: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Job", jobSchema);