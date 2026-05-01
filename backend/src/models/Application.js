const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Withdrawn'],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Withdrawn'],
      default: 'Applied',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: 'Applied', note: 'Application submitted' }],
    },
    resume: {
      type: String,
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
