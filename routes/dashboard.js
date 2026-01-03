const express = require("express");
const router = express.Router();
const dashboardController = require("../Controllers/dashboardControllers");
const auth = require("../Middleware/auth");

// Dashboard route - admin only
router.get("/", auth, dashboardController.getDashboard);

module.exports = router;
