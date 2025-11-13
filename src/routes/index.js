const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/authRoutes");
const userRoutes = require("./user/userRoutes");
const teamRoutes = require("./team/teamRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);

module.exports = router;