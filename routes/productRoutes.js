// productRoutes.js

const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const handleUpload = require("../middleware/uploadMiddleware");

// Route untuk product details dengan images
// done
router.get("/details/:productId", productController.getProductDetailsById);

// Route khusus untuk mengambil images 
// done
router.get("/images/:productId", productController.getProductImages);

// Route lainnya

// done
router.get("/", productController.getAllProducts);
// search prooduct
router.get("/search", productController.searchProduct);
// router.get("/allOrderByProductId/:id", productController.allOrderByProductId);
// done
router.post("/create", handleUpload, productController.createProduct);
// router.post("/update", productController.updateProduct);
router.delete("/delete/:id", productController.deleteProduct);
// router.delete('/images/:imageId', productController.deleteProductImage);
// router.put('/images/:imageId/order', productController.updateImageOrder);

// router.get('/all-with-details', productController.getAllProductsWithDetails);


module.exports = router;
