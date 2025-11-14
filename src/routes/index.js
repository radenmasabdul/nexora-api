const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/authRoutes");
const userRoutes = require("./user/userRoutes");
const teamRoutes = require("./team/teamRoutes");
const memberRoutes = require("./member/memberRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/members", memberRoutes);

module.exports = router;