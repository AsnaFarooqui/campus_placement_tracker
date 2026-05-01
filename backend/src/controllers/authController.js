const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpErrors");
const { validateStudentProfile, VALID_ROLES } = require("../services/validationService");

function sanitizeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    cgpa: user.cgpa,
    branch: user.branch,
    backlogs: user.backlogs,
    emailVerified: user.emailVerified,
  };
}

function shouldRequireEmailVerification() {
  return process.env.REQUIRE_EMAIL_VERIFICATION === "true";
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, cgpa, branch, backlogs, companyName } = req.body;

  if (!VALID_ROLES.includes(role)) {
    throw new HttpError(400, "A valid role is required");
  }

  if (!password || password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  const numericCgpa = cgpa === undefined || cgpa === "" ? undefined : Number(cgpa);
  const numericBacklogs = backlogs === undefined || backlogs === "" ? 0 : Number(backlogs);
  const profileErrors = validateStudentProfile({
    name,
    email,
    role,
    cgpa: numericCgpa,
    branch,
    backlogs: numericBacklogs,
  });

  if (profileErrors.length) {
    throw new HttpError(400, "Profile validation failed", profileErrors);
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) {
    throw new HttpError(400, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(24).toString("hex");

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    companyName,
    cgpa: role === "student" ? numericCgpa : undefined,
    branch: role === "student" ? branch : undefined,
    backlogs: role === "student" ? numericBacklogs : undefined,
    emailVerified: !shouldRequireEmailVerification(),
    emailVerificationToken: verificationToken,
    emailVerifiedAt: shouldRequireEmailVerification() ? null : new Date(),
  });

  res.status(201).json({
    message: shouldRequireEmailVerification()
      ? "User registered. Verify your email before signing in."
      : "User registered successfully",
    user: sanitizeUser(user),
    verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken,
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const token = req.params.token || req.body.token;
  if (!token) {
    throw new HttpError(400, "Verification token is required");
  }

  const user = await User.findOne({ emailVerificationToken: token }).select("+emailVerificationToken");
  if (!user) {
    throw new HttpError(400, "Invalid verification token");
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({ message: "Email verified successfully", user: sanitizeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user) throw new HttpError(404, "User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new HttpError(401, "Invalid password");

  if (shouldRequireEmailVerification() && !user.emailVerified) {
    throw new HttpError(403, "Please verify your email before signing in");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(404, "User not found");
  res.json(sanitizeUser(user));
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, cgpa, branch, backlogs, companyName } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(404, "User not found");

  const numericCgpa = cgpa === undefined || cgpa === "" ? user.cgpa : Number(cgpa);
  const numericBacklogs = backlogs === undefined || backlogs === "" ? user.backlogs : Number(backlogs);
  const profileErrors = validateStudentProfile({
    name: name ?? user.name,
    email: user.email,
    role: user.role,
    cgpa: numericCgpa,
    branch: branch ?? user.branch,
    backlogs: numericBacklogs,
  });

  if (profileErrors.length) {
    throw new HttpError(400, "Profile validation failed", profileErrors);
  }

  user.name = name ?? user.name;
  user.companyName = companyName ?? user.companyName;
  if (user.role === "student") {
    user.cgpa = numericCgpa;
    user.branch = branch ?? user.branch;
    user.backlogs = numericBacklogs;
  }

  await user.save();
  res.json(sanitizeUser(user));
});
