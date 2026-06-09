const cloudinary = require("../config/cloudinary");

/**
 * Upload an in-memory file buffer (from multer memoryStorage) to Cloudinary.
 * Replaces the previous AWS S3 upload flow.
 *
 * @param {Buffer} buffer   - file buffer (req.file.buffer / file.buffer)
 * @param {string} folder   - Cloudinary folder, e.g. "profile-pictures"
 * @param {string} [filename] - optional public_id hint
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = (buffer, folder = "uploads", filename) =>
  new Promise((resolve, reject) => {
    const options = { folder, resource_type: "auto" };
    if (filename) options.public_id = `${Date.now()}-${filename}`;

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });

/**
 * Delete a Cloudinary asset by its public_id. Safe to call with a falsy id.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Error deleting Cloudinary asset:", publicId, err.message);
  }
};

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
