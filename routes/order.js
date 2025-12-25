const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/orderControllers");
const auth = require("../Middleware/auth");

// Customer routes
router.get("/", auth, orderController.getOrders);
router.get("/review", auth, orderController.getCheckoutReview);
router.get("/:id", auth, orderController.getOrderById);
router.post("/checkout", auth, orderController.checkout);
router.patch("/:id/pay", auth, orderController.payOrder);
router.patch("/:id/cancel", auth, orderController.cancelOrder);

// Admin routes
router.get("/admin/all", auth, orderController.getAllOrdersAdmin);
router.get("/admin/:id", auth, orderController.getOrderByIdAdmin);
router.patch("/admin/:id/status", auth, orderController.updateOrderStatus);

module.exports = router;

