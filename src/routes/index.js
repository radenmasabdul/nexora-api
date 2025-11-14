const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/authRoutes");
const userRoutes = require("./user/userRoutes");
const teamRoutes = require("./team/teamRoutes");
const memberRoutes = require("./member/memberRoutes");
const projectRoutes = require("./projects/projectsRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/members", memberRoutes);
router.use("/projects", projectRoutes);

module.exports = router;