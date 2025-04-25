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

            if (req.files) {
                req.files = await processAllImages(req.files);
            }

            next();
        } catch (error) {
            const handledError = handleUploadError(error);
            return res.status(handledError.status).json(handledError);
        }
    });
};

module.exports = handleUpload;
