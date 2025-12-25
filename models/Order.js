const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_number: { type: String, unique: true },
    total_amount: { type: Number, required: true },
    subtotal_products: { type: Number, required: true },
    shipping_cost: { type: Number, required: true },
    shipping_address: { type: String, required: true },
    shipping_method: { type: String, required: true },
    payment_method: { type: String, required: true },
    note: String,
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },
    // Midtrans fields
    snap_token: String,
    snap_redirect_url: String,
    midtrans_transaction_id: String,
    midtrans_transaction_status: String,
    payment_type: String, // bank_transfer, gopay, qris, credit_card, etc.
    va_numbers: [
      {
        bank: String,
        va_number: String,
      },
    ],
    paid_at: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

