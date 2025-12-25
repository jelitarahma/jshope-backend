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
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

// Routes
app.get("/", (req, res) => res.send("API Running - JSHope E-Commerce"));

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const midtransRoutes = require("./routes/midtrans");

app.use("/jshope/auth", authRoutes);
app.use("/jshope/product", productRoutes);
app.use("/jshope/categories", categoryRoutes);
app.use("/jshope/cart", cartRoutes);
app.use("/jshope/orders", orderRoutes);
app.use("/jshope/midtrans", midtransRoutes);

// Start server only if not in Vercel (local development)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel
module.exports = app;


