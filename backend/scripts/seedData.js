const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Job = require("../src/models/Job");
const User = require("../src/models/User");
const connectDB = require("../config/database");

const jobs = [
  {
    title: "Software Engineer",
    company: "Systems Limited",
    description: "Build scalable enterprise applications for Karachi-based clients.",
    salaryMin: 120000,
    salaryMax: 180000,
    minCGPA: 3.5,
    allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 0,
    deadline: new Date("2026-06-15"),
    postedDate: new Date(),
    location: "Karachi - PECHS",
    employmentType: "full-time",
  },
  {
    title: "Data Analyst Intern",
    company: "10Pearls",
    description: "Analyze product and customer datasets for local technology teams.",
    salaryMin: 40000,
    salaryMax: 60000,
    minCGPA: 3.0,
    allowedBranches: ["Computer Science", "Mathematics", "Statistics"],
    maxBacklogs: 1,
    deadline: new Date("2026-06-20"),
    postedDate: new Date(),
    location: "Karachi - Shahrah-e-Faisal",
    employmentType: "internship",
  },
  {
    title: "Frontend Developer",
    company: "Folio3",
    description: "Build responsive user interfaces for web and commerce platforms.",
    salaryMin: 80000,
    salaryMax: 120000,
    minCGPA: 3.0,
    allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 2,
    deadline: new Date("2026-06-30"),
    postedDate: new Date(),
    location: "Karachi - Korangi Creek",
    employmentType: "full-time",
  },
  {
    title: "Backend Developer",
    company: "Afiniti",
    description: "Develop APIs and microservices for customer intelligence products.",
    salaryMin: 110000,
    salaryMax: 160000,
    minCGPA: 3.3,
    allowedBranches: ["Computer Science"],
    maxBacklogs: 0,
    deadline: new Date("2026-06-25"),
    postedDate: new Date(),
    location: "Karachi - Clifton",
    employmentType: "full-time",
  },
  {
    title: "Machine Learning Engineer",
    company: "Careem",
    description: "Work on machine learning models for mobility and marketplace systems.",
    salaryMin: 150000,
    salaryMax: 220000,
    minCGPA: 3.7,
    allowedBranches: ["Computer Science", "Artificial Intelligence"],
    maxBacklogs: 0,
    deadline: new Date("2026-06-10"),
    postedDate: new Date(),
    location: "Karachi - DHA",
    employmentType: "full-time",
  },
  {
    title: "UI/UX Designer",
    company: "Daraz Pakistan",
    description: "Design intuitive user experiences for marketplace workflows.",
    salaryMin: 70000,
    salaryMax: 100000,
    minCGPA: 2.8,
    allowedBranches: ["Computer Science", "Design"],
    maxBacklogs: 2,
    deadline: new Date("2026-07-01"),
    postedDate: new Date(),
    location: "Karachi - Gulshan-e-Iqbal",
    employmentType: "full-time",
  },
  {
    title: "DevOps Engineer",
    company: "TPS Worldwide",
    description: "Maintain CI/CD pipelines and cloud infrastructure for payment systems.",
    salaryMin: 90000,
    salaryMax: 130000,
    minCGPA: 3.2,
    allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 1,
    deadline: new Date("2026-07-05"),
    postedDate: new Date(),
    location: "Karachi - I.I. Chundrigar Road",
    employmentType: "full-time",
  },
  {
    title: "Cybersecurity Analyst",
    company: "Contour Software",
    description: "Monitor, secure, and harden enterprise software systems.",
    salaryMin: 85000,
    salaryMax: 125000,
    minCGPA: 3.1,
    allowedBranches: ["Computer Science", "Cybersecurity"],
    maxBacklogs: 1,
    deadline: new Date("2026-07-10"),
    postedDate: new Date(),
    location: "Karachi - Bahria Complex",
    employmentType: "full-time",
  },
  {
    title: "Product Manager",
    company: "Habib Bank Limited",
    description: "Lead digital product strategy and execution for banking services.",
    salaryMin: 140000,
    salaryMax: 200000,
    minCGPA: 3.4,
    allowedBranches: ["Computer Science", "Business"],
    maxBacklogs: 0,
    deadline: new Date("2026-06-18"),
    postedDate: new Date(),
    location: "Karachi - HBL Plaza",
    employmentType: "full-time",
  },
  {
    title: "QA Engineer",
    company: "Meezan Bank",
    description: "Test and ensure product quality.",
    salaryMin: 60000,
    salaryMax: 90000,
    minCGPA: 2.9,
    allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 2,
    deadline: new Date("2026-07-12"),
    postedDate: new Date(),
    location: "Karachi - Head Office",
    employmentType: "full-time",
  },
];

async function seed() {
  await connectDB();

  await Job.deleteMany();
  await User.deleteMany();

  const bcrypt = require("bcryptjs");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const recruiter = await User.create({
    name: "Recruiter",
    email: "recruiter@test.com",
    password: hashedPassword,
    role: "recruiter",
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  const jobsWithUser = jobs.map(job => ({
    ...job,
    createdBy: recruiter._id,
  }));

  await Job.insertMany(jobsWithUser);

  console.log("✅ Seed complete");
  process.exit();
}

seed();
