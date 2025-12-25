const express = require("express");
const router = express.Router();
const categoryController = require("../Controllers/categoryControllers");
const auth = require("../Middleware/auth");

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
router.post("/", auth, categoryController.createCategory);
router.put("/:id", auth, categoryController.updateCategory);
router.delete("/:id", auth, categoryController.deleteCategory);

module.exports = router;
