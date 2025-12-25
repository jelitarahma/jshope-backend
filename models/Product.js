const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: String,
    short_description: String,
    video: String,
    price_min: { type: Number },
    price_max: { type: Number },
    total_stock: { type: Number, default: 0 },
    variant_count: { type: Number, default: 0 },

    thumbnail: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", slug: "text" });

module.exports = mongoose.model("Product", productSchema);
