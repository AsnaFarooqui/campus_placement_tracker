const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  role: {
    type: String,
    enum: ["student", "recruiter", "officer"],
  },
  cgpa: Number,
  branch: String,
  backlogs: Number,
});

module.exports = mongoose.model("User", userSchema);