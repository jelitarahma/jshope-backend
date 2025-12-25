const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    is_checked: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cartSchema.index({ user_id: 1, variant_id: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
