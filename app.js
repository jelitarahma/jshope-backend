const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect MongoDB
// MongoDB Connection for Serverless (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("MongoDB Connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.get("/", (req, res) => res.send("API Running - JSHope E-Commerce"));

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const midtransRoutes = require("./routes/midtrans");
const dashboardRoutes = require("./routes/dashboard");

app.use("/jshope/auth", authRoutes);
app.use("/jshope/product", productRoutes);
app.use("/jshope/categories", categoryRoutes);
app.use("/jshope/cart", cartRoutes);
app.use("/jshope/orders", orderRoutes);
app.use("/jshope/midtrans", midtransRoutes);
app.use("/jshope/dashboard", dashboardRoutes);

// Start server only if not in Vercel (local development)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel
module.exports = app;


