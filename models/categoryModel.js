const pool = require('../database/connection');

exports.getAllCategories = async () => {
  const query = `
    SELECT 
      categoryId,
      name,
      slug,
      description,
      isActive,
      createdDate,
      updatedDate
    FROM categories
    ORDER BY name ASC`;

  const [rows] = await pool.query(query);
  return rows;
};

// Jika ingin mendapatkan categories dengan statistik (total products & subcategories)
exports.getAllCategoriesWithStats = async () => {
  const query = `
    SELECT 
      c.categoryId,
      c.name,
      c.slug,
      c.description,
      c.isActive,
      COUNT(DISTINCT p.productId) as total_products,
      COUNT(DISTINCT sc.subCategoryId) as total_subcategories
    FROM categories c
    LEFT JOIN product p ON c.categoryId = p.categoryId
    LEFT JOIN sub_categories sc ON c.categoryId = sc.categoryId
    GROUP BY c.categoryId
    ORDER BY c.name ASC`;

  const [rows] = await pool.query(query);
  return rows;
};

exports.getAllSubCategories = async () => {
  const query = `
   SELECT 
      categoryId,
      name,
      slug,
      isActive,
      createdDate,
      updatedDate
    FROM sub_categories    
    ORDER BY name ASC`;    /* Sekarang syntax-nya benar */

  const [rows] = await pool.query(query);
  return rows;
};

exports.getSubCategoriesByCategory = async (categoryId) => {
  const query = `
    SELECT 
      sc.subCategoryId,
      sc.name,
      sc.slug,
      sc.isActive,
      COUNT(p.productId) as total_products
    FROM sub_categories sc
    LEFT JOIN product p ON sc.subCategoryId = p.subCategoryId
    WHERE sc.categoryId = ? AND sc.isActive = true
    GROUP BY sc.subCategoryId
    ORDER BY sc.name ASC`;

  const [rows] = await pool.query(query, [categoryId]);
  return rows;
};


exports.createSubCategories = async ( categoryId,  name, slug , isActive = true) => {
   const query = `
   INSERT INTO sub_categories (categoryId , name, slug , isActive) VALUES ( ?, ?, ?, ?)
   `;

   const isActiveBool = isActive ? 1 : 0;
   const [result] = await pool.query(query, [ categoryId  , name, slug , isActiveBool]);
   console.log("category created model" , result);
   return result;
}
