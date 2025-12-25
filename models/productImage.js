const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },
    image_url: { type: String, required: true },
    alt_text: String,
    is_primary: { type: Boolean, default: false }, // gambar cover produk
    sort_order: { type: Number, default: 0 }, // urutan tampil
  },
  { timestamps: true }
);

imageSchema.index({ product_id: 1, is_primary: -1 });

module.exports = mongoose.model("ProductImage", imageSchema);
