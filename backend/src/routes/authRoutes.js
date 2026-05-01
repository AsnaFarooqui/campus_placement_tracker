const express = require("express");
const router = express.Router();

const { register, login, verifyEmail, getProfile, updateProfile } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.get("/verify-email/:token", verifyEmail);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
