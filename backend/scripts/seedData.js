const mongoose = require("mongoose");
require("dotenv").config();

const Job = require("../src/models/Job");
const User = require("../src/models/User");
const connectDB = require("../config/database");

const jobs = [
  {
    title: "Software Engineer",
    company: "Google",
    description: "Build scalable distributed systems.",
    salaryMin: 120000,
    salaryMax: 180000,
    minCGPA: 3.5,
    allowedBranches: ["Computer Science", "Information Technology"],
    maxBacklogs: 0,
    deadline: new Date("2026-04-15"),
    postedDate: new Date(),
    location: "Bangalore",
    employmentType: "full-time",
  },
  {
    title: "Data Analyst Intern",
    company: "Microsoft",
    description: "Analyze large datasets to drive decisions.",
    salaryMin: 40000,
    salaryMax: 60000,
    minCGPA: 3.0,
    allowedBranches: ["Computer Science", "Mathematics", "Statistics"],
    maxBacklogs: 1,
    deadline: new Date("2026-04-20"),
    postedDate: new Date(),
    location: "Hyderabad",
    employmentType: "internship",
  },
  {
    title: "Frontend Developer",
    company: "Flipkart",
    description: "Build responsive UI for e-commerce.",
    salaryMin: 80000,
    salaryMax: 120000,
    minCGPA: 3.0,
    allowedBranches: ["Computer Science", "IT"],
    maxBacklogs: 2,
    deadline: new Date("2026-04-30"),
    postedDate: new Date(),
    location: "Bangalore",
    employmentType: "full-time",
  },
  {
    title: "Backend Developer",
    company: "Amazon",
    description: "Develop APIs and microservices.",
    salaryMin: 110000,
    salaryMax: 160000,
    minCGPA: 3.3,
    allowedBranches: ["Computer Science"],
    maxBacklogs: 0,
    deadline: new Date("2026-04-25"),
    postedDate: new Date(),
    location: "Mumbai",
    employmentType: "full-time",
  },
  {
    title: "Machine Learning Engineer",
    company: "Tesla",
    description: "Work on AI models for autonomous driving.",
    salaryMin: 150000,
    salaryMax: 220000,
    minCGPA: 3.7,
    allowedBranches: ["Computer Science", "AI"],
    maxBacklogs: 0,
    deadline: new Date("2026-04-10"),
    postedDate: new Date(),
    location: "Remote",
    employmentType: "full-time",
  },
  {
    title: "UI/UX Designer",
    company: "Adobe",
    description: "Design intuitive user experiences.",
    salaryMin: 70000,
    salaryMax: 100000,
    minCGPA: 2.8,
    allowedBranches: ["Computer Science", "Design"],
    maxBacklogs: 2,
    deadline: new Date("2026-05-01"),
    postedDate: new Date(),
    location: "Delhi",
    employmentType: "full-time",
  },
  {
    title: "DevOps Engineer",
    company: "Infosys",
    description: "Maintain CI/CD pipelines and cloud infra.",
    salaryMin: 90000,
    salaryMax: 130000,
    minCGPA: 3.2,
    allowedBranches: ["Computer Science", "IT"],
    maxBacklogs: 1,
    deadline: new Date("2026-05-05"),
    postedDate: new Date(),
    location: "Pune",
    employmentType: "full-time",
  },
  {
    title: "Cybersecurity Analyst",
    company: "IBM",
    description: "Monitor and secure systems.",
    salaryMin: 85000,
    salaryMax: 125000,
    minCGPA: 3.1,
    allowedBranches: ["Computer Science", "Cybersecurity"],
    maxBacklogs: 1,
    deadline: new Date("2026-05-10"),
    postedDate: new Date(),
    location: "Bangalore",
    employmentType: "full-time",
  },
  {
    title: "Product Manager",
    company: "Amazon",
    description: "Lead product strategy and execution.",
    salaryMin: 140000,
    salaryMax: 200000,
    minCGPA: 3.4,
    allowedBranches: ["Computer Science", "Business"],
    maxBacklogs: 0,
    deadline: new Date("2026-04-18"),
    postedDate: new Date(),
    location: "Mumbai",
    employmentType: "full-time",
  },
  {
    title: "QA Engineer",
    company: "TCS",
    description: "Test and ensure product quality.",
    salaryMin: 60000,
    salaryMax: 90000,
    minCGPA: 2.9,
    allowedBranches: ["Computer Science", "IT"],
    maxBacklogs: 2,
    deadline: new Date("2026-05-12"),
    postedDate: new Date(),
    location: "Chennai",
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