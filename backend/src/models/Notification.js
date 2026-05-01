const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["status", "deadline", "interview", "announcement"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    relatedInterview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
