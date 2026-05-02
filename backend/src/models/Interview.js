const mongoose = require("mongoose");

const rescheduleRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
        message: "Requested interview end time must be after start time",
      },
    },
    durationMinutes: {
      type: Number,
      min: 15,
      max: 240,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

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
      trim: true,
      maxlength: 50,
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
    rescheduleRequest: {
      type: rescheduleRequestSchema,
      default: null,
    },
  },
  { timestamps: true }
);

interviewSchema.index({ jobId: 1, startAt: 1, endAt: 1 });
interviewSchema.index({ bookedBy: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
