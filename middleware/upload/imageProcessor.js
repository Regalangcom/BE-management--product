const sharp = require("sharp");
const uploadFileBlob = require("../../config/blobConfig");

const imageProcessingConfig = {
  width: 800,
  height: 800,
  quality: 60,
};

const processImage = async (file) => {
  try {
    // Compress image
    const processedImageBuffer = await sharp(file.buffer)
      .webp({ 
        quality: imageProcessingConfig.quality,
        effort: 6,
        strip: true,
        lossless: false
      })
      .resize({
        width: imageProcessingConfig.width,
        height: imageProcessingConfig.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    const blobFilename = `${timestamp}-${safeFilename}.webp`;

    // Upload ke blob storage
    let blobUrl;
    try {
      blobUrl = await uploadFileBlob(
        processedImageBuffer,
        blobFilename,
        'image/webp'
      );
    } catch (uploadError) {
      console.error("Failed to upload to blob storage:", uploadError);
      throw new Error(`Blob upload failed: ${uploadError.message}`);
    }

    if (!blobUrl) {
      throw new Error("Blob URL is null after successful upload");
    }

    return {
      ...file,
      buffer: processedImageBuffer,
      blobUrl: blobUrl,
      mimetype: "image/webp",
      size: processedImageBuffer.length,
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw error; // Re-throw untuk penanganan di middleware
  }
};

const processAllImages = async (files) => {
  try {
    if (!files) return files;

    // Process mainImage if exists
    if (files.mainImage && files.mainImage[0]) {
      files.mainImage[0] = await processImage(files.mainImage[0]);
    }

    // Process additionalImages if exists
    if (files.additionalImages) {
      files.additionalImages = await Promise.all(
        files.additionalImages.map(file => processImage(file))
      );
    }

    return files;
  } catch (error) {
    console.error("Image processing failed:", error);
    throw error; // Re-throw untuk penanganan di controller
  }
};

module.exports = {
  processImage,
  processAllImages,
  imageProcessingConfig,
};
