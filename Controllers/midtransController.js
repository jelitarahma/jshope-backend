const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const PaymentLog = require("../models/PaymentLog");
const ProductVariant = require("../models/ProductVariant");
const midtransService = require("../services/midtransService");

/**
 * Handle notification from Midtrans (Webhook)
 * This endpoint is called by Midtrans server when payment status changes
 */
exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    console.log("Midtrans Notification received:", JSON.stringify(notification, null, 2));

    // Verify signature
    const isValid = midtransService.verifySignature(notification);
    if (!isValid) {
      console.error("Invalid signature for notification:", notification.order_id);
      return res.status(403).json({ error: "Invalid signature" });
    }

    const {
      order_id,
      transaction_id,
      transaction_status,
      transaction_time,
      payment_type,
      gross_amount,
      status_code,
      signature_key,
      fraud_status,
      va_numbers,
    } = notification;

    // Find order by order_number
    const order = await Order.findOne({ order_number: order_id });
    if (!order) {
      console.error("Order not found:", order_id);
      return res.status(404).json({ error: "Order not found" });
    }

    // Log the notification
    const paymentLog = new PaymentLog({
      order_id: order._id,
      order_number: order_id,
      transaction_id,
      transaction_status,
      transaction_time: transaction_time ? new Date(transaction_time) : new Date(),
      payment_type,
      gross_amount: parseFloat(gross_amount),
      status_code,
      signature_key,
      fraud_status,
      va_numbers: va_numbers || [],
      raw_notification: notification,
      is_verified: true,
    });
    await paymentLog.save();

    // Map Midtrans status to our order status
    const { status, payment_status } = midtransService.mapTransactionStatus(
      transaction_status,
      fraud_status
    );

    // Handle stock return if cancelled/expired
    if (
      (transaction_status === "cancel" || transaction_status === "expire") &&
      order.status !== "cancelled"
    ) {
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        await ProductVariant.findByIdAndUpdate(item.variant_id, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Update order
    order.status = status;
    order.payment_status = payment_status;
    order.midtrans_transaction_id = transaction_id;
    order.midtrans_transaction_status = transaction_status;
    order.payment_type = payment_type;
    if (va_numbers && va_numbers.length > 0) {
      order.va_numbers = va_numbers;
    }
    if (payment_status === "paid") {
      order.paid_at = new Date();
    }
    await order.save();

    console.log(`Order ${order_id} updated: status=${status}, payment_status=${payment_status}`);

    // Always respond with 200 to Midtrans
    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("Midtrans notification error:", err);
    // Still respond 200 to prevent Midtrans from retrying
    res.status(200).json({ message: "Error logged", error: err.message });
  }
};

/**
 * Get transaction status from Midtrans (Manual check)
 */
exports.getTransactionStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Find order first
    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (order.user_id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get status from Midtrans
    const status = await midtransService.getTransactionStatus(orderNumber);

    res.json({
      order_number: orderNumber,
      midtrans_status: status,
      order_status: order.status,
      payment_status: order.payment_status,
    });
  } catch (err) {
    // Midtrans returns 404 if transaction not found
    if (err.httpStatusCode === 404) {
      return res.status(404).json({ error: "Transaction not found in Midtrans" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel transaction (Admin only)
 */
exports.cancelTransaction = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ order_number: orderNumber });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Cancel in Midtrans
    const result = await midtransService.cancelTransaction(orderNumber);

    // Update order
    order.status = "cancelled";
    order.payment_status = "failed";
    order.midtrans_transaction_status = "cancel";
    await order.save();

    // Return stock
    const items = await OrderItem.find({ order_id: order._id });
    for (const item of items) {
      await ProductVariant.findByIdAndUpdate(item.variant_id, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({
      message: "Transaction cancelled",
      midtrans_response: result,
      order,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Midtrans Client Key (for frontend)
 */
exports.getClientKey = async (req, res) => {
  res.json({
    client_key: process.env.MIDTRANS_CLIENT_KEY,
    is_production: process.env.MIDTRANS_IS_PRODUCTION === "true",
  });
};
