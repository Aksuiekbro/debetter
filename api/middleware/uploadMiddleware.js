const multer = require('multer');

// Configure storage - using memory storage to handle the file buffer directly
const storage = multer.memoryStorage();

// File filter to accept only specific image types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false); // Reject file
  }
};

// Set file size limit (e.g., 5MB)
const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB in bytes
};

// Create the multer instance with the configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload;