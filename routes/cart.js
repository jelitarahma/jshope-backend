const express = require("express");
const router = express.Router();
const cartController = require("../Controllers/cartControllers");
const auth = require("../Middleware/auth");

router.get("/", auth, cartController.getCart);
router.post("/add", auth, cartController.addToCart);
router.patch("/:id/increase", auth, cartController.increaseQuantity);
router.patch("/:id/decrease", auth, cartController.decreaseQuantity);
router.patch("/:id/toggle-checked", auth, cartController.toggleChecked);
router.delete("/:id", auth, cartController.removeFromCart);

module.exports = router;
