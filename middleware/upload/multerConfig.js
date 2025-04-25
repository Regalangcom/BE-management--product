const multer = require("multer");

// Konfigurasi storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Error: Images Only! (jpeg, jpg, png, gif, webp)"), false);
  }
};

// Konfigurasi multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Upload fields configuration
const uploadFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "additionalImages", maxCount: 5 },
]);

module.exports = uploadFields;
