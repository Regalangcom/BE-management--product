const productModel = require("../models/productModel");

exports.getAllProducts = async (req, res) => {
  try {
    const responsesAllData = await productModel.getAllProducts();
    res.status(200).json({ data: responsesAllData, message: "oke" });
  } catch (error) {
    console.log(error);
  }
};

exports.getProductDetailsById = async (req, res) => {
  try {
    const productId = req.params.productId;
    const result = await productModel.getProductDetailsById(productId);

    if (!result) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching product details" });
  }
};

exports.createProduct = async (req, res) => {
  const {
    name,
    slug,
    description,
    price,
    discount,
    stock,
    diameters,
    packaging,
    tags,
    categoryId,
    subCategoryId,
    status,
    isActive,
  } = req.body;

  try {
    const result = await productModel.createProduct({
      name,
      slug,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount || 0),
      stock: parseInt(stock || 0),
      diameters,
      packaging,
      tags,
      categoryId: parseInt(categoryId),
      subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
      status: status || "draft",
      isActive: isActive ?? true,
    });

    const productId = result.insertId;

    if (req.files) {
      if (req.files.mainImage) {
        const mainImageFile = req.files.mainImage[0];
        await productModel.addProductImages(productId, mainImageFile);
      }

      // Handle additional images if any
      if (req.files.additionalImages) {
        for (const imageFile of req.files.additionalImages) {
          await productModel.addProductImages(productId, imageFile);
        }
      }
    }

    res.status(201).json({
      message: "Product and images created successfully",
      productId: productId,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({
      error: "Error creating product",
      details: err.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const {
      name,
      slug,
      description,
      price,
      discount,
      stock,
      diameters,
      packaging,
      tags,
      categoryId,
      subCategoryId,
      status,
      isActive,
      updateImages, // Flag eksplisit untuk mengontrol update gambar
    } = req.body;

    // Validasi data
    if (!name || !slug || !price) {
      return res.status(400).json({
        error: "Name, slug, and price are required",
      });
    }

    // Update product data
    await productModel.updateProduct(productId, {
      name,
      slug,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount || 0),
      stock: parseInt(stock || 0),
      diameters,
      packaging,
      tags,
      categoryId: parseInt(categoryId),
      subCategoryId: subCategoryId ? parseInt(subCategoryId) : null,
      status: status || "draft",
      isActive: isActive ?? true,
      updatedBy: req.user?.userId || null,
    });

    // Debugging: Log req.files dan updateImages flag
    console.log("Update images flag:", updateImages);
    console.log(
      "Files received:",
      req.files ? Object.keys(req.files).length : 0
    );

    // HANYA proses gambar jika flag updateImages = "true" (string)
    // Dan req.files tidak kosong (sudah difilter di middleware)
    if (
      updateImages === "true" &&
      req.files &&
      Object.keys(req.files).length > 0
    ) {
      console.log("Processing images because updateImages flag is true");

      // Proses gambar utama jika ada
      if (req.files.mainImage && req.files.mainImage.length > 0) {
        const mainImageFile = req.files.mainImage[0];
        console.log("Processing main image:", mainImageFile.originalname);

        // Cek apakah sudah ada gambar utama (sortOrder = 1)
        const existingMainImage = await productModel.getMainProductImage(
          productId
        );

        if (existingMainImage) {
          console.log(
            "Updating existing main image:",
            existingMainImage.imageId
          );
          // Update gambar utama yang sudah ada
          await productModel.updateProductImage(
            existingMainImage.imageId,
            mainImageFile.mimetype,
            mainImageFile.blobUrl
          );
        } else {
          console.log("Adding new main image");
          // Tambahkan gambar utama baru
          await productModel.addProductImages(productId, mainImageFile, 1);
        }
      }

      // Proses gambar tambahan jika ada
      if (req.files.additionalImages && req.files.additionalImages.length > 0) {
        console.log("Processing additional images");
        // Dapatkan sortOrder tertinggi yang ada
        const maxOrder = await productModel.getMaxImageSortOrder(productId);
        let startOrder = maxOrder + 1;

        for (const imageFile of req.files.additionalImages) {
          console.log(
            `Adding additional image: ${imageFile.originalname} with order ${startOrder}`
          );
          await productModel.addProductImages(productId, imageFile, startOrder);
          startOrder++;
        }
      }
    } else {
      console.log(
        "Skipping image processing because updateImages flag is not 'true' or no files"
      );
    }

    // Ambil data produk yang sudah diupdate
    const updatedProduct = await productModel.getProductDetailsById(productId);

    res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: "Error updating product",
      details: error.message,
    });
  }
};

exports.searchProduct = async (req, res) => {
  try {
    const { q } = req.query;
    const product = await productModel.searchProduct(q);
    res.status(200).json({ data: product, message: "oke" });
  } catch (error) {
    throw new Error("failed to search product");
  }
};

exports.deleteProduct = (req, res) => {
  const productId = req.params.id;
  productModel
    .deleteProduct(productId)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).send("Error deleting product.");
    });
};

// Tambahkan controller baru untuk mengelola gambar
exports.getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await productModel.getProductImages(productId);

    if (!images || images.length === 0) {
      return res.json([]);
    }
    return res.status(200).json({ data: images, message: "ok" });
  } catch (error) {
    console.error("Error fetching product images:", error);
    res.status(500).json({ error: "Failed to fetch product images" });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    await productModel.deleteProductImage(imageId);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting product image:", error);
    res.status(500).json({ error: "Failed to delete product image" });
  }
};

exports.getProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const [images] = await pool.query(
      "SELECT imageType, imageData FROM product_images WHERE imageId = ?",
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = images[0];
    res.setHeader("Content-Type", image.imageType);
    res.send(image.imageData);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
};

exports.getAllProductsWithDetails = async (req, res) => {
  try {
    const products = await productModel.getProductWithCategoryAndImages();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await productModel.getProductsByCategoryId(categoryId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.getProductsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const products = await productModel.getProductsBySubCategoryId(
      subCategoryId
    );
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};
