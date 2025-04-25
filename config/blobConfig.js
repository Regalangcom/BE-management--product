const { put } = require("@vercel/blob");
const dotenv = require("dotenv");
dotenv.config();

const uploadFileBlob = async (buffer, filename, contentType) => {
  try {

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: contentType,
      token: process.env.BLOB_READ_WRITE,
    });

    if (!blob || !blob.url) {
      throw new Error("Failed to get URL from blob storage");
    }

    return blob.url;
  } catch (error) {
    console.error("Blob upload error:", error);
    throw error; // Re-throw error agar bisa ditangkap di imageProcessor
  }
};

module.exports = uploadFileBlob;
