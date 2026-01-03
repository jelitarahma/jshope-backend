const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const User = require("../models/User");
const Category = require("../models/Category");

// Helper: Get date ranges
const getDateRanges = () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return { now, startOfThisMonth, startOfLastMonth, endOfLastMonth };
};

// Helper: Calculate percentage change
const calcPercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

// GET DASHBOARD DATA
exports.getDashboard = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { now, startOfThisMonth, startOfLastMonth, endOfLastMonth } = getDateRanges();

    // ========== SUMMARY STATS ==========
    
    // Total Sales (paid orders only)
    const salesThisMonth = await Order.aggregate([
      { $match: { payment_status: "paid", createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: "$total_amount" } } }
    ]);
    const salesLastMonth = await Order.aggregate([
      { $match: { payment_status: "paid", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$total_amount" } } }
    ]);
    const currentSales = salesThisMonth[0]?.total || 0;
    const previousSales = salesLastMonth[0]?.total || 0;

    // Total Orders
    const ordersThisMonth = await Order.countDocuments({ createdAt: { $gte: startOfThisMonth } });
    const ordersLastMonth = await Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } });

    // Total Products Sold (from OrderItems with paid orders)
    const paidOrderIds = await Order.find({ payment_status: "paid", createdAt: { $gte: startOfThisMonth } }).select("_id");
    const paidOrderIdsLast = await Order.find({ payment_status: "paid", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).select("_id");
    
    const productsSoldThisMonth = await OrderItem.aggregate([
      { $match: { order_id: { $in: paidOrderIds.map(o => o._id) } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const productsSoldLastMonth = await OrderItem.aggregate([
      { $match: { order_id: { $in: paidOrderIdsLast.map(o => o._id) } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);
    const currentProductsSold = productsSoldThisMonth[0]?.total || 0;
    const previousProductsSold = productsSoldLastMonth[0]?.total || 0;

    // Total Customers
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const newCustomersThisMonth = await User.countDocuments({ 
      role: "customer", 
      createdAt: { $gte: startOfThisMonth } 
    });

    // ========== PRODUCTS BY CATEGORY ==========
    const categories = await Category.find();
    const productsByCategory = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category_id: cat._id, status: "active" });
        
        // Get sales for this category
        const productsInCat = await Product.find({ category_id: cat._id }).select("_id");
        const productIds = productsInCat.map(p => p._id);
        
        // Find order items that match products in this category (via variant)
        const salesData = await OrderItem.aggregate([
          { $lookup: { from: "productvariants", localField: "variant_id", foreignField: "_id", as: "variant" } },
          { $unwind: "$variant" },
          { $match: { "variant.product_id": { $in: productIds } } },
          { $lookup: { from: "orders", localField: "order_id", foreignField: "_id", as: "order" } },
          { $unwind: "$order" },
          { $match: { "order.payment_status": "paid" } },
          { $group: { _id: null, total: { $sum: "$subtotal" } } }
        ]);
        
        return {
          name: cat.name,
          count,
          sales: salesData[0]?.total || 0
        };
      })
    );

    const totalProducts = productsByCategory.reduce((sum, cat) => sum + cat.count, 0);
    const productsByCategoryWithPercentage = productsByCategory.map(cat => ({
      ...cat,
      percentage: totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100 * 10) / 10 : 0
    }));

    // ========== MONTHLY SALES (Last 12 months) ==========
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const sales = await Order.aggregate([
        { $match: { payment_status: "paid", createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total_amount" } } }
      ]);
      
      const orders = await Order.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      
      monthlySales.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        sales: sales[0]?.total || 0,
        orders
      });
    }

    // ========== RECENT ORDERS ==========
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user_id", "full_name username")
      .lean();

    const formattedRecentOrders = recentOrders.map(order => ({
      order_number: order.order_number,
      customer: order.user_id?.full_name || order.user_id?.username || "Unknown",
      total: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      date: order.createdAt
    }));

    // ========== RESPONSE ==========
    res.json({
      summary: {
        totalSales: {
          current: currentSales,
          previous: previousSales,
          percentageChange: calcPercentageChange(currentSales, previousSales)
        },
        totalOrders: {
          current: ordersThisMonth,
          previous: ordersLastMonth,
          percentageChange: calcPercentageChange(ordersThisMonth, ordersLastMonth)
        },
        totalProductsSold: {
          current: currentProductsSold,
          previous: previousProductsSold,
          percentageChange: calcPercentageChange(currentProductsSold, previousProductsSold)
        },
        totalCustomers,
        newCustomersThisMonth
      },
      productsByCategory: productsByCategoryWithPercentage,
      monthlySales,
      recentOrders: formattedRecentOrders
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};
