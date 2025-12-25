const { snap, coreApi } = require("../config/midtrans");
const crypto = require("crypto");

/**
 * Create Snap transaction
 * @param {Object} order - Order document
 * @param {Array} items - Order items
 * @param {Object} customer - Customer info (name, email, phone)
 */
exports.createSnapTransaction = async (order, items, customer) => {
  const itemDetails = items.map((item) => ({
    id: item.variant_id.toString(),
    price: Math.round(item.price),
    quantity: item.quantity,
    name: item.product_name.substring(0, 50), // Midtrans limit 50 chars
  }));

  // Add shipping cost as item
  if (order.shipping_cost > 0) {
    itemDetails.push({
      id: "SHIPPING",
      price: Math.round(order.shipping_cost),
      quantity: 1,
      name: `Ongkir - ${order.shipping_method}`,
    });
  }

  const parameter = {
    transaction_details: {
      order_id: order.order_number,
      gross_amount: Math.round(order.total_amount),
    },
    item_details: itemDetails,
    customer_details: {
      first_name: customer.name || "Customer",
      email: customer.email || "",
      phone: customer.phone || "",
      shipping_address: {
        first_name: customer.name || "Customer",
        address: order.shipping_address,
      },
    },
    callbacks: {
      finish: `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders`,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    console.error("Midtrans createTransaction error:", error);
    throw error;
  }
};

/**
 * Verify signature from Midtrans notification
 * @param {Object} notification - Notification data from Midtrans
 */
exports.verifySignature = (notification) => {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  const expectedSignature = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  return signature_key === expectedSignature;
};

/**
 * Get transaction status from Midtrans
 * @param {String} orderId - Order number
 */
exports.getTransactionStatus = async (orderId) => {
  try {
    const status = await coreApi.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error("Midtrans getStatus error:", error);
    throw error;
  }
};

/**
 * Cancel transaction
 * @param {String} orderId - Order number
 */
exports.cancelTransaction = async (orderId) => {
  try {
    const response = await coreApi.transaction.cancel(orderId);
    return response;
  } catch (error) {
    console.error("Midtrans cancel error:", error);
    throw error;
  }
};

/**
 * Map Midtrans status to our order status
 * @param {String} transactionStatus - Midtrans transaction status
 * @param {String} fraudStatus - Midtrans fraud status
 */
exports.mapTransactionStatus = (transactionStatus, fraudStatus) => {
  // For credit card with fraud detection
  if (transactionStatus === "capture") {
    if (fraudStatus === "accept") {
      return { status: "processing", payment_status: "paid" };
    } else if (fraudStatus === "challenge") {
      return { status: "pending", payment_status: "unpaid" };
    }
  }

  // Status mapping
  const statusMap = {
    settlement: { status: "processing", payment_status: "paid" },
    pending: { status: "pending", payment_status: "unpaid" },
    deny: { status: "pending", payment_status: "failed" },
    cancel: { status: "cancelled", payment_status: "failed" },
    expire: { status: "cancelled", payment_status: "failed" },
    refund: { status: "cancelled", payment_status: "refunded" },
    partial_refund: { status: "processing", payment_status: "refunded" },
  };

  return statusMap[transactionStatus] || { status: "pending", payment_status: "unpaid" };
};
