const express = require("express");
const router = express.Router();

const authRoutes = require("./auth/authRoutes");
const userRoutes = require("./user/userRoutes");
const teamRoutes = require("./team/teamRoutes");
const memberRoutes = require("./member/memberRoutes");
const projectsRoutes = require("./projects/projectsRoutes");
const taskRoutes = require("./task/taskRoutes");
const commentRoutes = require("./comments/commentRoutes");
const activityRoutes = require("./activity/activityRoutes");
const notificationRoutes = require("./notification/notificationRoutes");
const taskDashboardRoutes = require("./task/taskDashboardRoutes");
const projectsDashboardRoutes = require("./projects/projectsDashboardRoutes");
const activityDashboardRoutes = require("./activity/activityDashboardRoutes");
const teamDashboardRoutes = require("./team/teamDashboardRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/members", memberRoutes);
router.use("/projects", projectsRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/activities", activityRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard/tasks", taskDashboardRoutes);
router.use("/dashboard/projects", projectsDashboardRoutes);
router.use("/dashboard/activities", activityDashboardRoutes);
router.use("/dashboard/teams", teamDashboardRoutes);

module.exports = router;