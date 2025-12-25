const express = require("express");
const router = express.Router();
const midtransController = require("../Controllers/midtransController");
const auth = require("../Middleware/auth");

// Webhook endpoint - dipanggil oleh Midtrans (tanpa auth)
router.post("/notification", midtransController.handleNotification);

// Get client key untuk frontend
router.get("/client-key", midtransController.getClientKey);

// Check transaction status (perlu auth)
router.get("/status/:orderNumber", auth, midtransController.getTransactionStatus);

// Cancel transaction (admin only)
router.post("/cancel/:orderNumber", auth, midtransController.cancelTransaction);

module.exports = router;
