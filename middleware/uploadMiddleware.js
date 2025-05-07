const uploadFields = require('./upload/multerConfig');
const { processAllImages } = require('./upload/imageProcessor');
const handleUploadError = require('./upload/errorHandler');

const handleUpload = async (req, res, next) => {
    uploadFields(req, res, async function(err) {
        try {
            if (err) {
                const error = handleUploadError(err);
                return res.status(error.status).json(error);
            }

            // Periksa flag updateImages dari body request
            const shouldUpdateImages = req.body && req.body.updateImages === "true";
            
            // Hanya proses file jika flag updateImages true DAN ada file yang diupload
            if (shouldUpdateImages && req.files && Object.keys(req.files).length > 0) {
                // Periksa apakah ada file yang benar-benar diupload
                let hasRealFiles = false;
                
                if (req.files.mainImage && req.files.mainImage.length > 0 && req.files.mainImage[0].size > 0) {
                    hasRealFiles = true;
                }
                
                if (req.files.additionalImages) {
                    for (const file of req.files.additionalImages) {
                        if (file.size > 0) {
                            hasRealFiles = true;
                            break;
                        }
                    }
                }
                
                // Hanya proses jika ada file yang benar-benar diupload
                if (hasRealFiles) {
                    console.log("Processing uploaded files");
                    req.files = await processAllImages(req.files);
                } else {
                    console.log("No real files to process, clearing req.files");
                    req.files = {}; // Kosongkan req.files jika tidak ada file yang benar-benar diupload
                }
            } else {
                console.log("Skipping image processing: updateImages flag is false or no files uploaded");
                // Kosongkan req.files jika flag updateImages false
                req.files = {};
            }

            next();
        } catch (error) {
            const handledError = handleUploadError(error);
            return res.status(handledError.status).json(handledError);
        }
    });
};

module.exports = handleUpload;
