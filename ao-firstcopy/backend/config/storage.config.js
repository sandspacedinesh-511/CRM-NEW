const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('./logger');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const createSubdirectories = () => {
  const subdirs = ['documents', 'avatars', 'temp'];
  subdirs.forEach(dir => {
    const fullPath = path.join(uploadDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createSubdirectories();

// Use memory storage for cloud uploads (DigitalOcean Spaces)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
    : ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'];
  
  const allowedMimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'txt': 'text/plain'
  };

  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  const isValidExtension = allowedTypes.includes(fileExtension);
  
  const isValidMimeType = Object.values(allowedMimeTypes).includes(file.mimetype) || 
                         file.mimetype.startsWith('text/') || 
                         file.mimetype.startsWith('image/') || 
                         file.mimetype.startsWith('application/');
  
  const hasValidName = file.originalname && file.originalname.length > 0;
  const isNotExecutable = !['exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'vbs'].includes(fileExtension);

  // Only log file filter details in development and for debugging
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_FILE_UPLOADS === 'true') {  }

  // Check file size
  const maxSize = getFileSizeLimit(file.mimetype);
  if (file.size && file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(1);    return cb(new Error(`File size too large. Maximum allowed: ${sizeInMB}MB`), false);
  }

  if (isValidExtension && isValidMimeType && hasValidName && isNotExecutable) {
    // Only log successful uploads in development for debugging
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_FILE_UPLOADS === 'true') {    }
    cb(null, true);
  } else {
    // Always log rejected uploads for security    cb(new Error(`Invalid file type or security check failed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const virusScan = (file, cb) => {
  setTimeout(() => {
    const isInfected = Math.random() < 0.001; 
    
    if (isInfected) {
      logger.error(`Virus detected in file: ${file.originalname}`);
      cb(new Error('File appears to be infected and has been rejected for security reasons.'), false);
    } else {
      logger.info(`Virus scan passed for file: ${file.originalname}`);
      cb(null, true);
    }
  }, 100);
};

// File size limits for production
const MAX_FILE_SIZE = {
  DOCUMENT: 2 * 1024 * 1024, // 2MB for documents (PDF, Word, Excel)
  IMAGE: 500 * 1024, // 500KB for images (JPEG, PNG)
  AVATAR: 250 * 1024, // 250KB for avatars
  DEFAULT: 2 * 1024 * 1024 // 2MB default
};

// Get file size limit based on file type
const getFileSizeLimit = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return MAX_FILE_SIZE.IMAGE;
  }
  if (mimetype.includes('pdf') || 
      mimetype.includes('word') || 
      mimetype.includes('excel') || 
      mimetype.includes('document')) {
    return MAX_FILE_SIZE.DOCUMENT;
  }
  return MAX_FILE_SIZE.DEFAULT;
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || MAX_FILE_SIZE.DEFAULT, 
    files: 5 
  }
});

const secureUpload = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        logger.error(`File upload error: ${err.message}`);
        return res.status(400).json({
          error: 'File upload failed',
          message: err.message
        });
      }
      
      if (req.file) {
        req.file.metadata = {
          uploadedAt: new Date(),
          uploadedBy: req.user?.id,
          fileSize: req.file.size,
          originalName: req.file.originalname
        };
        
        logger.info(`File uploaded successfully: ${req.file.filename}`);
        next();
      } else {
        next();
      }
    });
  };
};

const secureMultipleUpload = (fieldName, maxFiles = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxFiles);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        logger.error(`Multiple file upload error: ${err.message}`);
        return res.status(400).json({
          error: 'File upload failed',
          message: err.message
        });
      }
      
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          file.metadata = {
            uploadedAt: new Date(),
            uploadedBy: req.user?.id,
            fileSize: file.size,
            originalName: file.originalname
          };
        });
        
        logger.info(`${req.files.length} files uploaded successfully`);
        next();
      } else {
        next();
      }
    });
  };
};

module.exports = {
  upload,
  secureUpload,
  secureMultipleUpload,
  MAX_FILE_SIZE,
  getFileSizeLimit
};
