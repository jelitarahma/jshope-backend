const express = require("express");
const router = express.Router();
const productController = require("../Controllers/productControllers");
const auth = require("../Middleware/auth");
const multer = require("multer");
const path = require("path");

// Setup multer - terima semua file (gambar & video)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpe?g|png|gif|webp|mp4|mov|avi|mkv|webm/i;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed! Only images and videos"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB untuk video
  fileFilter,
});

// Routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.post("/", auth, upload.any(), productController.createProduct); // any() = req.files jadi array
router.put("/:id", auth, upload.any(), productController.updateProduct);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
