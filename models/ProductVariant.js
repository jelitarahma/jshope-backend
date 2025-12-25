const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, unique: true, required: true },
    attributes: { type: Map, of: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
    weight: Number, // gram
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

variantSchema.index({ product_id: 1, is_active: 1 });

module.exports = mongoose.model("ProductVariant", variantSchema);
