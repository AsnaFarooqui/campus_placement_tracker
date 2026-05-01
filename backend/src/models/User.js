const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "A valid email address is required"],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "recruiter", "officer", "admin"],
      required: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 4,
    },
    branch: {
      type: String,
      trim: true,
    },
    backlogs: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator(value) {
          return Number.isInteger(value);
        },
        message: "Backlogs must be a whole number",
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
