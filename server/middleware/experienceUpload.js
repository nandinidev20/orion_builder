import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create directory if it doesn't exist
const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage for experiences
const experienceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create different subdirectories based on file type
    let subDir = 'experiences/';
    const fileExt = path.extname(file.originalname).toLowerCase();

    // Check by extension first (more reliable)
    if (['.txt', '.pdf', '.docx', '.doc'].includes(fileExt)) {
      subDir += 'documents/';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir += 'audio/';
    } else if (file.mimetype.startsWith('video/')) {
      subDir += 'video/';
    } else if (file.mimetype.startsWith('image/')) {
      subDir += 'images/';
    } else if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf' ||
               file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               file.mimetype.includes('text') || file.mimetype.includes('word')) {
      subDir += 'documents/';
    } else {
      subDir += 'other/';
    }

    const fullDir = `uploads/${subDir}`;
    createDirectory(fullDir);
    console.log(`[UPLOAD] File: ${file.originalname}, Ext: ${fileExt}, MIME: ${file.mimetype}, Destination: ${fullDir}`);
    cb(null, fullDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename using timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'experience-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow images, audio, video, and document files
const experienceFileFilter = (req, file, cb) => {
  // Accept images, audio, video, and document files
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg',
    // Video
    'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime',
    // Documents
    'text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Also accept by file extension as fallback for .docx files
  const allowedExtensions = ['.txt', '.pdf', '.docx'];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image, audio, video, and document files (txt, pdf, docx) are allowed.'), false);
  }
};

// Initialize multer with storage and file filter for experiences
const experienceUpload = multer({
  storage: experienceStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit for large video files
  },
  fileFilter: experienceFileFilter
});

// Middleware to handle multer errors with better messages
export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size exceeds maximum limit of 2GB. Please upload a smaller file.',
        error: 'FILE_TOO_LARGE'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded at once',
        error: 'TOO_MANY_FILES'
      });
    } else if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in multipart request',
        error: 'TOO_MANY_PARTS'
      });
    }
  } else if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  // Pass other errors to next middleware
  if (err) {
    next(err);
  } else {
    next();
  }
};

export default experienceUpload;
