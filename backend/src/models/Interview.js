const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return this.startAt && value > this.startAt;
        },
        message: "Interview end time must be after start time",
      },
    },
    interviewer: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "Campus placement cell",
    },
    type: {
      type: String,
      enum: ["aptitude", "technical", "hr"],
      default: "technical",
    },
    status: {
      type: String,
      enum: ["available", "scheduled", "completed", "cancelled"],
      default: "available",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

interviewSchema.index({ jobId: 1, startAt: 1, endAt: 1 });
interviewSchema.index({ bookedBy: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
