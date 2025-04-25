// productModel.js

const pool = require("../database/connection");

exports.getAllProducts = async () => {
  const [rows] = await pool.query("SELECT * FROM product");
  return rows;
};

exports.searchProduct = async (searchName) => {
  try {
    const query = `
     SELECT 
      p.productId,
      p.name,
      p.slug,
      p.price,
      p.stock,
      p.discount,
      p.subCategoryId,
      sc.name as subcategory_name,
      MIN(pi.imageId) as main_image_id
      FROM product p
      LEFT JOIN sub_categories sc ON p.subCategoryId = sc.subCategoryId
      LEFT JOIN product_images pi ON p.productId = pi.productId
      WHERE LOWER(p.name) LIKE LOWER(?)
      GROUP BY p.productId
      ORDER BY p.name ASC
      LIMIT 12
    `;

    if (!searchName) return null;
    const searchNamePattern = `%${searchName}%`;
    const [row] = await pool.query(query, [searchNamePattern]);

    return row;
  } catch (error) {
    console.error("Error in searchProduct:", error);
    throw error;
  }
};

exports.getProductDetailsById = async (productId) => {
  const query = `
    SELECT 
      p.*,
      c.name AS category_name,
      sc.name AS subcategory_name,
      GROUP_CONCAT(
        JSON_OBJECT(
          'imageId', pi.imageId,
          'imageType', pi.imageType,
          'imageUrl', pi.imageUrl,  
          'sortOrder', COALESCE(pi.sortOrder, 0)
        )
        ORDER BY pi.sortOrder ASC
      ) as product_images
    FROM product p
    LEFT JOIN categories c ON p.categoryId = c.categoryId
    LEFT JOIN sub_categories sc ON p.subCategoryId = sc.subCategoryId
    LEFT JOIN product_images pi ON p.productId = pi.productId
    WHERE p.productId = ?
    GROUP BY p.productId`;

  const [products] = await pool.query(query, [productId]);

  if (!products.length) return null;

  // Parse JSON string dan transform response
  return products.map((prod) => {
    const parsedImages = prod.product_images
      ? JSON.parse(`[${prod.product_images}]`)
      : [];

    return {
      ...prod,
      product_images: parsedImages.map(img => ({
        ...img,
        // Gunakan URL Blob langsung, bukan path API
        imageUrl: img.imageUrl 
      }))
    };
  });
};

exports.allOrderByProductId = (productId) => {
  return new Promise((resolve, reject) => {
    const query =
      "SELECT O.orderId, U.fname, U.lname, O.createdDate, PIN.quantity, PIN.totalPrice " +
      "FROM users U INNER JOIN orders O on U.userId  = O.userId " +
      "INNER JOIN productsInOrder PIN on O.orderId = PIN.orderId " +
      "INNER JOIN product P on PIN.productId = P.productId " +
      "WHERE PIN.productId = ?;";

    pool.query(query, [productId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// ``materialId,``
// ``description,``
exports.createProduct = async (productData) => {
  const query = `
    INSERT INTO product (
      name, 
      slug, 
      description, 
      price, 
      discount, 
      stock, 
      diameters,
      packaging ,
      tags, 
      categoryId, 
      subCategoryId,
      status, 
      isActive
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const tagsValue = Array.isArray(productData.tags)
    ? productData.tags.join(",")
    : productData.tags;

  const values = [
    productData.name,
    productData.slug,
    productData.description,
    productData.price,
    productData.discount || 0.0,
    productData.stock || 0,
    productData.diameters,
    productData.packaging,
    tagsValue,
    productData.categoryId,
    productData.subCategoryId || null,
    productData.status || "draft",
    productData.featuredImage || null,
    productData.isActive ? 1 : 0,
  ];

  const [result] = await pool.query(query, values);
  return result;
};

exports.updateProduct = (productId, name, price, description) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "UPDATE product SET name = ?, price = ?, description = ? WHERE productId = ?",
      [name, price, description, productId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.deleteProduct = (productId) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "DELETE FROM product WHERE productId = ?",
      [productId],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

exports.addProductImages = async (productId, imageFile, sortOrder = null) => {
  const query = `
    INSERT INTO product_images 
    (productId, imageType, imageUrl, sortOrder) 
    VALUES (?, ?, ?, ?)
  `;

  let finalSortOrder = sortOrder;
  if (!finalSortOrder) {
    const [rows] = await pool.query(
      "SELECT COALESCE(MAX(sortOrder), 0) + 1 as nextOrder FROM product_images WHERE productId = ?",
      [productId]
    );
    finalSortOrder = rows[0].nextOrder;
  }

  const [result] = await pool.query(query, [
    productId,
    imageFile.mimetype,
    imageFile.blobUrl,
    finalSortOrder,
  ]);

  return result;
};

// Function untuk mendapatkan semua gambar dari suatu produk
exports.getProductImages = async (productId) => {
  const [rows] = await pool.query(
    `SELECT 
      imageId, 
      productId, 
      imageType, 
      imageUrl,
      sortOrder 
     FROM product_images 
     WHERE productId = ? 
     ORDER BY sortOrder ASC`,
    [productId]
  );
  return rows;
};

// Function untuk menghapus gambar produk
exports.deleteProductImage = async (imageId) => {
  const [result] = await pool.query(
    "DELETE FROM product_images WHERE imageId = ?",
    [imageId]
  );
  return result;
};

// Function untuk mengupdate urutan gambar
// exports.updateImageOrder = (imageId, newOrder) => {
//   return new Promise((resolve, reject) => {
//     const query = `
//             UPDATE product_images
//             SET sortOrder = ?
//             WHERE imageId = ?
//         `;

//     pool.query(query, [newOrder, imageId], (err, result) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// };

// Jika ingin filter berdasarkan kategori tertentu
exports.getProductsByCategoryId = async (categoryId) => {
  const query = `
    SELECT 
      p.productId,
      p.name AS product_name,
      p.description,
      p.price,
      p.discount,
      p.stock,
      p.status,
      c.categoryId,
      c.name AS category_name,
      sc.subCategoryId,
      sc.name AS subcategory_name,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          '{"imageId":', pi.imageId,
          ',"imageType":"', pi.imageType,
          '","sortOrder":', pi.sortOrder, '}'
        )
      ) as product_images
    FROM product p
    JOIN categories c ON p.categoryId = c.categoryId
    JOIN sub_categories sc ON p.subCategoryId = sc.subCategoryId
    LEFT JOIN product_images pi ON p.productId = pi.productId
    WHERE c.categoryId = ?
    GROUP BY p.productId
    ORDER BY p.createdDate DESC`;

  const [rows] = await pool.query(query, [categoryId]);

  return rows.map((row) => ({
    ...row,
    product_images: row.product_images
      ? JSON.parse(`[${row.product_images}]`)
      : [],
  }));
};

// Jika ingin filter berdasarkan subkategori
exports.getProductsBySubCategoryId = async (subCategoryId) => {
  const query = `
    SELECT 
      p.productId,
      p.name AS product_name,
      c.categoryId,
      c.name AS category_name,
      sc.subCategoryId,
      sc.name AS subcategory_name,
      GROUP_CONCAT(
        DISTINCT CONCAT(
          '{"imageId":', pi.imageId,
          ',"imageType":"', pi.imageType,
          '","sortOrder":', pi.sortOrder, '}'
        )
      ) as product_images
    FROM product p
    JOIN categories c ON p.categoryId = c.categoryId
    JOIN sub_categories sc ON p.subCategoryId = sc.subCategoryId
    LEFT JOIN product_images pi ON p.productId = pi.productId
    WHERE sc.subCategoryId = ?
    GROUP BY p.productId
    ORDER BY p.createdDate DESC`;

  const [rows] = await pool.query(query, [subCategoryId]);

  return rows.map((row) => ({
    ...row,
    product_images: row.product_images
      ? JSON.parse(`[${row.product_images}]`)
      : [],
  }));
};
