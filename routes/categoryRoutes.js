const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');

// Get all categories
// done
router.get('/', categoryController.getAllCategories);

// create category
router.post('/create/sub-categories/:categoryId', categoryController.createSubCategories);

// Get all sub-categories
// done
router.get('/sub-categories', categoryController.getAllSubCategories);

// Get sub-categories by category ID
router.get('/:categoryId/sub-categories', categoryController.getSubCategoriesByCategory);

// done
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/subcategory/:subCategoryId', productController.getProductsBySubCategory);

module.exports = router;