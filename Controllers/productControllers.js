const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const ProductImage = require("../models/productImage");
const slugify = require("slugify");

// Update ringkasan produk
const updateProductSummary = async (productId) => {
  const variants = await ProductVariant.find({
    product_id: productId,
    is_active: true,
  });

  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  const stocks = variants.map((v) => v.stock);

  const price_min = prices.length > 0 ? Math.min(...prices) : 0;
  const price_max = prices.length > 0 ? Math.max(...prices) : price_min;
  const total_stock = stocks.reduce((a, b) => a + b, 0);
  const variant_count = variants.length;

  const primaryImage = await ProductImage.findOne({
    product_id: productId,
    is_primary: true,
  });

  await Product.findByIdAndUpdate(productId, {
    price_min,
    price_max: price_max > price_min ? price_max : null,
    total_stock,
    variant_count,
    thumbnail: primaryImage ? primaryImage.image_url : null,
  });
};

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .select(
        "name slug description short_description thumbnail price_min total_stock variant_count category_id video_url"
      )
      .populate("category_id", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PRODUCT DETAIL
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category_id"
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variants = await ProductVariant.find({
      product_id: product._id,
      is_active: true,
    });
    const images = await ProductImage.find({ product_id: product._id }).sort({
      is_primary: -1,
      sort_order: 1,
    });

    res.json({
      product,
      variants,
      images,
      video_url: product.video_url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    let {
      name,
      description,
      short_description,
      category_id,
      variants: variantsString,
      thumbnail_url, // URL eksternal untuk thumbnail (opsional)
      image_urls, // Array URL eksternal untuk gambar (opsional)
      video_url, // URL eksternal untuk video (opsional)
    } = req.body;

    if (!name || !category_id || !variantsString) {
      throw new Error("Name, category_id, and variants are required");
    }

    // Generate slug
    let slug = slugify(name, { lower: true, strict: true });
    let existing = await Product.findOne({ slug });
    let counter = 1;
    while (existing) {
      slug = slugify(name, { lower: true, strict: true }) + "-" + counter;
      existing = await Product.findOne({ slug });
      counter++;
    }

    const parsedVariants = JSON.parse(variantsString);
    if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
      throw new Error("Variants must be non-empty array");
    }

    // Parse image_urls jika ada (string JSON)
    let parsedImageUrls = [];
    if (image_urls) {
      try {
        parsedImageUrls = JSON.parse(image_urls);
      } catch (e) {
        // Jika bukan JSON, coba split by comma
        parsedImageUrls = image_urls.split(",").map((u) => u.trim());
      }
    }

    // Buat produk
    const product = new Product({
      name,
      slug,
      description,
      short_description,
      category_id,
      status: "active",
      video_url: video_url || null,
    });
    await product.save();

    const createdVariants = [];
    const createdImages = [];

    // Proses variant
    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];

      const variant = new ProductVariant({
        product_id: product._id,
        sku:
          v.sku ||
          `${slug.toUpperCase()}-${(i + 1).toString().padStart(3, "0")}`,
        attributes: v.attributes,
        price: Number(v.price),
        stock: Number(v.stock),
        weight: v.weight ? Number(v.weight) : undefined,
        is_active: true,
      });
      await variant.save();
      createdVariants.push(variant);

      // Cek apakah ada file upload untuk variant ini
      const fileKey = `variant_${i}_images`;
      const variantFiles = req.files
        ? req.files.filter((f) => f.fieldname === fileKey)
        : [];
      if (variantFiles.length > 0) {
        const images = variantFiles.map((file, idx) => ({
          product_id: product._id,
          variant_id: variant._id,
          image_url: `/uploads/${file.filename}`,
          is_primary: idx === 0 && i === 0,
          sort_order: idx,
        }));
        await ProductImage.insertMany(images);
        createdImages.push(...images);
      }
    }

    // Gambar produk utama - cek file upload atau URL
    const productImagesFiles = req.files
      ? req.files.filter((f) => f.fieldname === "product_images")
      : [];

    if (productImagesFiles.length > 0) {
      // Opsi 1: Pakai file upload
      const images = productImagesFiles.map((file, idx) => ({
        product_id: product._id,
        variant_id: null,
        image_url: `/uploads/${file.filename}`,
        is_primary: idx === 0,
        sort_order: idx,
      }));
      await ProductImage.insertMany(images);
      createdImages.push(...images);
    } else if (parsedImageUrls.length > 0) {
      // Opsi 2: Pakai URL eksternal
      const images = parsedImageUrls.map((url, idx) => ({
        product_id: product._id,
        variant_id: null,
        image_url: url,
        is_primary: idx === 0,
        sort_order: idx,
      }));
      await ProductImage.insertMany(images);
      createdImages.push(...images);
    } else if (thumbnail_url) {
      // Opsi 3: Pakai thumbnail URL saja
      const image = {
        product_id: product._id,
        variant_id: null,
        image_url: thumbnail_url,
        is_primary: true,
        sort_order: 0,
      };
      await ProductImage.create(image);
      createdImages.push(image);
    }

    // Video - cek file upload atau URL
    const videoFile = req.files
      ? req.files.find((f) => f.fieldname === "video")
      : null;
    if (videoFile) {
      product.video_url = `/uploads/${videoFile.filename}`;
      await product.save();
    }
    // video_url dari body sudah di-set di atas

    await updateProductSummary(product._id);

    res.status(201).json({
      message: "Product created successfully",
      product,
      variants: createdVariants,
      images: createdImages,
      video_uploaded: !!videoFile,
      used_external_urls: parsedImageUrls.length > 0 || !!thumbnail_url,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let {
      name,
      description,
      short_description,
      category_id,
      variants: variantsString,
      thumbnail_url, // URL eksternal untuk thumbnail (opsional)
      image_urls, // Array URL eksternal untuk gambar (opsional)
      video_url, // URL eksternal untuk video (opsional)
    } = req.body;

    if (name) {
      product.name = name;
      let slug = slugify(name, { lower: true, strict: true });
      let existing = await Product.findOne({ slug, _id: { $ne: product._id } });
      let counter = 1;
      while (existing) {
        slug = slugify(name, { lower: true, strict: true }) + "-" + counter;
        existing = await Product.findOne({ slug, _id: { $ne: product._id } });
        counter++;
      }
      product.slug = slug;
    }
    if (description) product.description = description;
    if (short_description) product.short_description = short_description;
    if (category_id) product.category_id = category_id;

    // Handle video_url dari body
    if (video_url) {
      product.video_url = video_url;
    }

    await product.save();

    if (variantsString) {
      await ProductVariant.deleteMany({ product_id: product._id });
      const parsedVariants = JSON.parse(variantsString);
      for (let i = 0; i < parsedVariants.length; i++) {
        const v = parsedVariants[i];
        const variant = new ProductVariant({
          product_id: product._id,
          sku:
            v.sku ||
            `${product.slug.toUpperCase()}-${(i + 1)
              .toString()
              .padStart(3, "0")}`,
          attributes: v.attributes,
          price: Number(v.price),
          stock: Number(v.stock),
          weight: v.weight ? Number(v.weight) : undefined,
          is_active: true,
        });
        await variant.save();

        const fileKey = `variant_${i}_images`;
        const variantFiles = req.files ? req.files.filter((f) => f.fieldname === fileKey) : [];
        if (variantFiles.length > 0) {
          const images = variantFiles.map((file, idx) => ({
            product_id: product._id,
            variant_id: variant._id,
            image_url: `/uploads/${file.filename}`,
            is_primary: idx === 0 && i === 0,
            sort_order: idx,
          }));
          await ProductImage.insertMany(images);
        }
      }
    }

    // Parse image_urls jika ada (string JSON)
    let parsedImageUrls = [];
    if (image_urls) {
      try {
        parsedImageUrls = JSON.parse(image_urls);
      } catch (e) {
        // Jika bukan JSON, coba split by comma
        parsedImageUrls = image_urls.split(",").map((u) => u.trim());
      }
    }

    // Handle gambar produk
    const productImages = req.files ? req.files.filter(
      (f) => f.fieldname === "product_images"
    ) : [];
    
    // Cek apakah thumbnail_url adalah URL eksternal baru (bukan path /uploads/ lama)
    const isNewExternalUrl = thumbnail_url && !thumbnail_url.startsWith('/uploads/');
    
    if (isNewExternalUrl) {
      // PRIORITAS TERTINGGI: Jika user kirim URL eksternal baru, SELALU update
      // Ini untuk kasus user mau ganti dari uploaded image ke URL eksternal
      const existingPrimary = await ProductImage.findOne({
        product_id: product._id,
        is_primary: true,
      });
      
      if (existingPrimary) {
        // Update existing primary image dengan URL baru
        existingPrimary.image_url = thumbnail_url;
        await existingPrimary.save();
      } else {
        // Create new primary image
        await ProductImage.create({
          product_id: product._id,
          variant_id: null,
          image_url: thumbnail_url,
          is_primary: true,
          sort_order: 0,
        });
      }
    } else if (productImages.length > 0) {
      // Opsi 2: Pakai file upload baru
      const images = productImages.map((file, idx) => ({
        product_id: product._id,
        variant_id: null,
        image_url: `/uploads/${file.filename}`,
        is_primary: idx === 0,
        sort_order: idx,
      }));
      await ProductImage.insertMany(images);
    } else if (parsedImageUrls.length > 0) {
      // Opsi 3: Pakai URL eksternal dari image_urls array
      // Hapus gambar lama dulu jika ada URL baru
      await ProductImage.deleteMany({ product_id: product._id, variant_id: null });
      const images = parsedImageUrls.map((url, idx) => ({
        product_id: product._id,
        variant_id: null,
        image_url: url,
        is_primary: idx === 0,
        sort_order: idx,
      }));
      await ProductImage.insertMany(images);
    }
    // Jika thumbnail_url adalah path /uploads/ lama dan tidak ada perubahan, tidak update apa-apa

    // Handle video - prioritas: file upload > video_url dari body
    const videoFile = req.files ? req.files.find((f) => f.fieldname === "video") : null;
    if (videoFile) {
      product.video_url = `/uploads/${videoFile.filename}`;
      await product.save();
    }

    await updateProductSummary(product._id);

    res.json({ 
      message: "Product updated", 
      product,
      used_external_urls: parsedImageUrls.length > 0 || !!thumbnail_url || !!video_url,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });

  try {
    const productId = req.params.id;

    await Product.findByIdAndDelete(productId);
    await ProductVariant.deleteMany({ product_id: productId });
    await ProductImage.deleteMany({ product_id: productId });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
