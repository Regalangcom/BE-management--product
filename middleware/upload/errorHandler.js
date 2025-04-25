const multer = require('multer');

const handleUploadError = (err) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return {
                status: 400,
                error: 'File too large. Maximum size is 10MB'
            };
        }
        return {
            status: 400,
            error: err.message
        };
    }
    
    if (err.message.includes('Image processing failed')) {
        return {
            status: 500,
            error: 'Image processing failed',
            details: err.message
        };
    }

    return {
        status: 500,
        error: 'Unknown error occurred during upload',
        details: err.message
    };
};

module.exports = handleUploadError;