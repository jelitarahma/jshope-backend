const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Cart = require("../models/Cart");
const ProductVariant = require("../models/ProductVariant");
const Product = require("../models/Product");
const User = require("../models/User");
const midtransService = require("../services/midtransService");

// GET MY ORDERS (list)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "order_number total_amount status payment_status createdAt shipping_method payment_type snap_token"
      );

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ORDER DETAIL LENGKAP
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const items = await OrderItem.find({ order_id: order._id }).populate({
      path: "variant_id",
      populate: { path: "product_id", select: "name slug thumbnail" },
    });

    res.json({
      order,
      items,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHECKOUT (dari review) - dengan integrasi Midtrans
exports.checkout = async (req, res) => {
  try {
    const {
      shipping_address,
      shipping_method,
      shipping_cost,
      payment_method,
      note,
    } = req.body;

    if (
      !shipping_address ||
      !shipping_method ||
      !shipping_cost ||
      !payment_method
    ) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Get user data for Midtrans
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItems = await Cart.find({
      user_id: req.user.id,
      is_checked: true,
    }).populate("variant_id");

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const variant = item.variant_id;
      const product = await Product.findById(variant.product_id);

      if (variant.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Stock not enough for ${variant.sku}` });
      }

      const subtotalItem = variant.price * item.quantity;
      subtotal += subtotalItem;

      orderItemsData.push({
        variant_id: variant._id,
        product_name: product.name,
        product_slug: product.slug,
        thumbnail: product.thumbnail,
        variant_attributes: variant.attributes,
        quantity: item.quantity,
        price: variant.price,
        subtotal: subtotalItem,
      });

      // Kurangi stok
      await ProductVariant.findByIdAndUpdate(variant._id, {
        $inc: { stock: -item.quantity },
      });
    }

    const total_amount = subtotal + shipping_cost;

    // Generate order number
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await Order.countDocuments({});
    const order_number = `ORD-${date}-${String(count + 1).padStart(4, "0")}`;

    const order = new Order({
      user_id: req.user.id,
      order_number,
      subtotal_products: subtotal,
      shipping_cost,
      total_amount,
      shipping_address,
      shipping_method,
      payment_method,
      note,
    });

    // Jika bukan COD, generate Midtrans Snap token
    let snapResponse = null;
    if (payment_method !== "cod") {
      try {
        snapResponse = await midtransService.createSnapTransaction(
          order,
          orderItemsData,
          {
            name: user.full_name || user.username,
            email: user.email,
            phone: user.phone_number || "",
          }
        );
        order.snap_token = snapResponse.token;
        order.snap_redirect_url = snapResponse.redirect_url;
      } catch (midtransError) {
        // Rollback stock jika Midtrans gagal
        for (const item of cartItems) {
          await ProductVariant.findByIdAndUpdate(item.variant_id._id, {
            $inc: { stock: item.quantity },
          });
        }
        console.error("Midtrans error:", midtransError);
        return res.status(500).json({
          error: "Failed to create payment",
          details: midtransError.message,
        });
      }
    }

    await order.save();

    // Buat OrderItem
    for (const data of orderItemsData) {
      const orderItem = new OrderItem({
        order_id: order._id,
        ...data,
      });
      await orderItem.save();
    }

    // Kosongkan cart
    await Cart.deleteMany({ user_id: req.user.id, is_checked: true });

    // Response
    const response = {
      message: "Order created",
      order,
    };

    if (snapResponse) {
      response.snap_token = snapResponse.token;
      response.snap_redirect_url = snapResponse.redirect_url;
    }

    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// BAYAR PESANAN (customer atau admin)
exports.payOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id, // atau admin bisa semua
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.payment_status !== "unpaid") {
      return res.status(400).json({ error: "Order already paid or cancelled" });
    }

    order.payment_status = "paid";
    order.status = "processing"; // otomatis ke processing kalau sudah bayar
    await order.save();

    res.json({ message: "Payment successful", order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// BATALKAN PESANAN (customer, hanya kalau unpaid & pending)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user_id: req.user.id,
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status !== "pending" || order.payment_status !== "unpaid") {
      return res
        .status(400)
        .json({ error: "Cannot cancel paid or processed order" });
    }

    order.status = "cancelled";
    await order.save();

    // Kembalikan stok
    const items = await OrderItem.find({ order_id: order._id });
    for (const item of items) {
      await ProductVariant.findByIdAndUpdate(item.variant_id, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({ message: "Order cancelled, stock returned", order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET REVIEW CHECKOUT (untuk halaman review sebelum checkout)
exports.getCheckoutReview = async (req, res) => {
  try {
    // Ambil cart yang checked
    const cartItems = await Cart.find({
      user_id: req.user.id,
      is_checked: true,
    }).populate({
      path: "variant_id",
      populate: { path: "product_id", select: "name slug thumbnail" },
    });

    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ error: "Tidak ada item yang dipilih untuk checkout" });
    }

    let subtotal = 0;
    const items = [];

    for (const item of cartItems) {
      const variant = item.variant_id;
      const product = variant.product_id;

      const subtotalItem = variant.price * item.quantity;
      subtotal += subtotalItem;

      items.push({
        cart_item_id: item._id,
        variant_id: variant._id,
        product_name: product.name,
        product_slug: product.slug,
        thumbnail: product.thumbnail,
        variant_attributes: variant.attributes,
        quantity: item.quantity,
        price: variant.price,
        subtotal: subtotalItem,
        weight: variant.weight || 0,
      });
    }

    const total_weight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    );

    // Opsi ongkir (hardcode dulu, nanti bisa dari RajaOngkir)
    const shipping_options = [
      { method: "JNE Reguler", cost: 15000, estimated: "3-5 hari" },
      { method: "JNE YES", cost: 30000, estimated: "1-2 hari" },
      { method: "J&T Express", cost: 18000, estimated: "2-4 hari" },
      { method: "SiCepat REG", cost: 16000, estimated: "3-5 hari" },
      { method: "Gosend Instant", cost: 25000, estimated: "1-2 jam" },
    ];

    const payment_methods = [
      { code: "transfer_bank", name: "Transfer Bank (Manual Verifikasi)" },
      { code: "ewallet", name: "E-Wallet (GoPay, OVO, Dana, ShopeePay)" },
      { code: "virtual_account", name: "Virtual Account (BCA, BNI, Mandiri)" },
      { code: "cod", name: "Bayar di Tempat (COD)" },
    ];

    res.json({
      items,
      subtotal,
      total_weight,
      shipping_options,
      payment_methods,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== ADMIN FUNCTIONS ====================

// GET ALL ORDERS (Admin Only) - dengan filter dan pagination
exports.getAllOrdersAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const {
      status,
      payment_status,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (payment_status) filter.payment_status = payment_status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate("user_id", "username email full_name phone_number")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          total_revenue: { $sum: "$total_amount" },
          pending_count: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          processing_count: {
            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
          },
          shipped_count: {
            $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] },
          },
          delivered_count: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelled_count: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          unpaid_count: {
            $sum: { $cond: [{ $eq: ["$payment_status", "unpaid"] }, 1, 0] },
          },
          paid_count: {
            $sum: { $cond: [{ $eq: ["$payment_status", "paid"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
      },
      statistics: stats[0] || {
        total_orders: 0,
        total_revenue: 0,
        pending_count: 0,
        processing_count: 0,
        shipped_count: 0,
        delivered_count: 0,
        cancelled_count: 0,
        unpaid_count: 0,
        paid_count: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ORDER DETAIL BY ID (Admin Only) - bisa lihat order siapapun
exports.getOrderByIdAdmin = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const order = await Order.findById(req.params.id).populate(
      "user_id",
      "username email full_name phone_number address"
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const items = await OrderItem.find({ order_id: order._id }).populate({
      path: "variant_id",
      populate: { path: "product_id", select: "name slug thumbnail" },
    });

    res.json({
      order,
      items,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ORDER STATUS (Admin Only)
exports.updateOrderStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { status, payment_status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Validate status transitions
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const validPaymentStatuses = ["unpaid", "paid", "failed", "refunded"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        error: `Invalid payment_status. Must be one of: ${validPaymentStatuses.join(
          ", "
        )}`,
      });
    }

    // Handle status change to cancelled - return stock
    if (status === "cancelled" && order.status !== "cancelled") {
      const items = await OrderItem.find({ order_id: order._id });
      for (const item of items) {
        await ProductVariant.findByIdAndUpdate(item.variant_id, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Update fields
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;

    await order.save();

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
