const categoryModel = require("../models/categoryModel");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await categoryModel.getAllSubCategories();
    res.json(subCategories);
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    res.status(500).json({ error: "Failed to fetch sub-categories" });
  }
};

exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subCategories = await categoryModel.getSubCategoriesByCategory(
      categoryId
    );
    return res.status(200).json({ data: subCategories,  message: "Success fetching sub-categories" });
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    res.status(500).json({ error: "Failed to fetch sub-categories" });
  }
};

exports.createSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, slug, isActive } = req.body;
    const results = await categoryModel.createSubCategories(
      categoryId,
      name,
      slug,
      isActive
    );
    console.log(results);

    res.status(200).json({
      data: {
        subCategoryid: results.insertId,
        categoryId: categoryId,
        name,
        slug,
        isActive: isActive ?? true,
      },
      message: "oke",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};
