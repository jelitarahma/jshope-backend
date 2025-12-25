const mongoose = require("mongoose");

const paymentLogSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    order_number: { type: String, required: true },
    transaction_id: String,
    transaction_status: String,
    transaction_time: Date,
    payment_type: String,
    gross_amount: Number,
    status_code: String,
    signature_key: String,
    fraud_status: String,
    va_numbers: [
      {
        bank: String,
        va_number: String,
      },
    ],
    raw_notification: Object, // Full notification data for debugging
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster lookup
paymentLogSchema.index({ order_number: 1 });
paymentLogSchema.index({ transaction_id: 1 });

module.exports = mongoose.model("PaymentLog", paymentLogSchema);
