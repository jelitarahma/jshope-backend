const Category = require("../models/Category");
const slugify = require("slugify");

// GET ALL CATEGORIES (untuk select di frontend)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET CATEGORY BY ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    let { name, description } = req.body;
    if (!name) throw new Error("Name required");

    const slug = slugify(name, { lower: true, strict: true });
    const category = new Category({ name, slug, description });
    await category.save();

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    let { name, description } = req.body;
    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true, strict: true });
    }
    if (description) category.description = description;

    await category.save();

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
