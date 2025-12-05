const { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const crypto = require('crypto');

// Configure AWS S3 Client (v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// S3 bucket configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'counselor-crm-uploads';
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// File size limits for production
const MAX_FILE_SIZE = {
  DOCUMENT: parseInt(process.env.MAX_FILE_SIZE_DOCUMENT) || 2 * 1024 * 1024, // 2MB for documents (PDF, Word, Excel)
  IMAGE: parseInt(process.env.MAX_FILE_SIZE_IMAGE) || 500 * 1024, // 500KB for images (JPEG, PNG)
  AVATAR: parseInt(process.env.MAX_FILE_SIZE_AVATAR) || 250 * 1024, // 250KB for avatars
  DEFAULT: parseInt(process.env.MAX_FILE_SIZE_DEFAULT) || 2 * 1024 * 1024 // 2MB default
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

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, extension);
  
  return `${timestamp}-${randomString}-${nameWithoutExt}${extension}`;
};

// File filter function with size validation
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
  }
  
  // Check file size
  const maxSize = getFileSizeLimit(file.mimetype);
  if (file.size && file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(1);
    return cb(new Error(`File size too large. Maximum allowed: ${sizeInMB}MB`), false);
  }
  
  cb(null, true);
};

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: 'private', // Private access - files are not publicly accessible
    key: (req, file, cb) => {
      // Organize files by type and date
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const folder = `${year}/${month}/${day}`;
      const filename = generateUniqueFilename(file.originalname);
      
      cb(null, `uploads/${folder}/${filename}`);
    },
    metadata: (req, file, cb) => {
      cb(null, {
        originalName: file.originalname,
        uploadedBy: req.user?.id || 'anonymous',
        uploadedAt: new Date().toISOString(),
        fileType: file.mimetype,
        fileSize: file.size
      });
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE.DEFAULT, // Default limit, actual validation in fileFilter
    files: 5 // Maximum 5 files per request
  }
});

// Function to generate presigned URL for secure file access
const generatePresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  return await getSignedUrl(s3, command, { expiresIn });
};

// Function to delete file from S3
const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Function to copy file within S3
const copyFile = async (sourceKey, destinationKey) => {
  const { CopyObjectCommand } = require('@aws-sdk/client-s3');
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey
  });
  
  try {
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Error copying file in S3:', error);
    return false;
  }
};

// Function to check if file exists
const fileExists = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  try {
    await s3.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

// Function to get file metadata
const getFileMetadata = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });
  
  try {
    const result = await s3.send(command);
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      metadata: result.Metadata
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
};

// Function to list files in a directory
const listFiles = async (prefix = 'uploads/', maxKeys = 100) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys
  });
  
  try {
    const result = await s3.send(command);
    return result.Contents || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

module.exports = {
  s3,
  upload,
  generatePresignedUrl,
  deleteFile,
  copyFile,
  fileExists,
  getFileMetadata,
  listFiles,
  BUCKET_NAME,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  getFileSizeLimit
};
