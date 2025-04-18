const multer = require('multer');

// Configure storage - using memory storage to handle the file buffer directly
const storage = multer.memoryStorage();

// File filter to accept specific file types
const fileFilter = (req, file, cb) => {
  console.log('Processing file upload:', file);

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];

  // Check if it's an image upload
  if (file.fieldname === 'image' || file.fieldname === 'mapImage') {
    if (allowedImageTypes.includes(file.mimetype)) {
      console.log('Accepted image file:', file.originalname);
      cb(null, true); // Accept file
    } else {
      console.log('Rejected image file:', file.originalname, file.mimetype);
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'), false);
    }
  }
  // Check if it's an audio upload
  else if (file.fieldname === 'audio') {
    if (allowedAudioTypes.includes(file.mimetype)) {
      console.log('Accepted audio file:', file.originalname);
      cb(null, true); // Accept file
    } else {
      console.log('Rejected audio file:', file.originalname, file.mimetype);
      cb(new Error('Invalid file type. Only MP3, WAV, and OGG audio files are allowed.'), false);
    }
  }
  // Default case - accept the file but log a warning
  else {
    console.log('Unknown field type, accepting file:', file.fieldname, file.originalname);
    cb(null, true);
  }
};

// Set file size limit (e.g., 10MB)
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB in bytes
};

// Create the multer instance with the configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload;