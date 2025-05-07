const { put } = require("@vercel/blob");
const dotenv = require("dotenv");
dotenv.config();

const uploadFileBlob = async (buffer, filename, contentType) => {
  try {
    // Coba upload tanpa overwrite terlebih dahulu
    try {
      const blob = await put(filename, buffer, {
        access: "public",
        contentType: contentType,
        token: process.env.BLOB_READ_WRITE,
        addRandomSuffix: false, // Penting: Jangan tambahkan suffix acak untuk memungkinkan deduplication
      });
      
      return blob.url;
    } catch (error) {
      // Jika error karena file sudah ada, coba dapatkan URL-nya
      if (error.message && error.message.includes("already exists")) {
        console.log(`File ${filename} already exists in Blob storage, reusing URL`);
        
        // Karena kita tidak bisa mendapatkan URL langsung dari error,
        // kita bisa menggunakan pola URL yang konsisten dari Vercel Blob
        // Format: https://{project-name}.vercel.app/{filename}
        
        // Alternatif: Gunakan list API untuk mendapatkan URL
        // Atau gunakan pattern URL yang konsisten jika Anda tahu formatnya
        
        // Untuk sementara, kita bisa menggunakan pattern URL yang umum
        const blobBaseUrl = process.env.BLOB_BASE_URL || "https://your-project.vercel.app";
        return `${blobBaseUrl}/${filename}`;
      }
      
      // Jika error lain, throw error
      throw error;
    }
  } catch (error) {
    console.error("Blob upload error:", error);
    throw error; // Re-throw error agar bisa ditangkap di imageProcessor
  }
};

module.exports = uploadFileBlob;
