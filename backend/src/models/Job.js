const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'On Campus',
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'internship'],
      default: 'full-time',
    },
    salaryMin: {
      type: Number,
      required: true,
      min: 0,
    },
    salaryMax: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return value >= this.salaryMin;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary',
      },
    },
    minCGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 4,
    },
    allowedBranches: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one allowed branch is required',
      },
    },
    maxBacklogs: {
      type: Number,
      required: true,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          if (this.status === 'closed') return true;
          return value && value.getTime() > Date.now();
        },
        message: 'Application deadline must be in the future',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
