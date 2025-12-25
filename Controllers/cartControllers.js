// controllers/cartController.js
const Cart = require("../models/Cart");
const ProductVariant = require("../models/ProductVariant");

// GET CART USER (lengkap dengan product & variant info)
exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user_id: req.user.id })
      .populate({
        path: "variant_id",
        populate: {
          path: "product_id",
          select: "name slug thumbnail",
        },
      })
      .sort({ createdAt: -1 });

    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD TO CART (quantity bisa lebih dari 1)
exports.addToCart = async (req, res) => {
  try {
    const { variant_id, quantity = 1 } = req.body;

    if (!variant_id) {
      return res.status(400).json({ error: "variant_id required" });
    }

    const variant = await ProductVariant.findById(variant_id);
    if (!variant || !variant.is_active) {
      return res.status(400).json({ error: "Variant not found or inactive" });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({ error: "Stock not enough" });
    }

    let cartItem = await Cart.findOne({ user_id: req.user.id, variant_id });

    if (cartItem) {
      cartItem.quantity += quantity;
      if (cartItem.quantity > variant.stock) {
        return res.status(400).json({ error: "Stock not enough after add" });
      }
      cartItem.is_checked = true; // auto checked lagi
    } else {
      cartItem = new Cart({
        user_id: req.user.id,
        variant_id,
        quantity,
        is_checked: true,
      });
    }

    await cartItem.save();
    await cartItem.populate({
      path: "variant_id",
      populate: { path: "product_id", select: "name slug thumbnail" },
    });

    res.status(201).json(cartItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// INCREASE QUANTITY (+1)
exports.increaseQuantity = async (req, res) => {
  try {
    const cartItem = await Cart.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!cartItem)
      return res.status(404).json({ error: "Item not found in cart" });

    const variant = await ProductVariant.findById(cartItem.variant_id);
    if (cartItem.quantity + 1 > variant.stock) {
      return res.status(400).json({ error: "Stock not enough" });
    }

    cartItem.quantity += 1;
    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DECREASE QUANTITY (-1)
exports.decreaseQuantity = async (req, res) => {
  try {
    const cartItem = await Cart.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!cartItem)
      return res.status(404).json({ error: "Item not found in cart" });

    if (cartItem.quantity <= 1) {
      // Kalau quantity 1 dan dikurangi → hapus dari cart
      await Cart.findByIdAndDelete(req.params.id);
      return res.json({
        message: "Item removed from cart (quantity reached 0)",
      });
    }

    cartItem.quantity -= 1;
    await cartItem.save();

    res.json(cartItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// TOGGLE CHECKED (true/false untuk checkout)
exports.toggleChecked = async (req, res) => {
  try {
    const cartItem = await Cart.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!cartItem)
      return res.status(404).json({ error: "Cart item not found" });

    // OTOMATIS BALIK (toggle)
    cartItem.is_checked = !cartItem.is_checked;

    await cartItem.save();

    await cartItem.populate({
      path: "variant_id",
      populate: { path: "product_id", select: "name slug thumbnail" },
    });

    res.json({
      message: "Checked status toggled",
      cartItem,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// REMOVE ITEM FROM CART
exports.removeFromCart = async (req, res) => {
  try {
    const result = await Cart.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!result)
      return res.status(404).json({ error: "Item not found in cart" });

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
