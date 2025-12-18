// File validation utilities for frontend
export const FILE_SIZE_LIMITS = {
  DOCUMENT: 2 * 1024 * 1024, // 2MB for documents (PDF, Word, Excel)
  IMAGE: 500 * 1024, // 500KB for images (JPEG, PNG)
  AVATAR: 250 * 1024, // 250KB for avatars
  DEFAULT: 2 * 1024 * 1024 // 2MB default
};

export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ],
  AVATARS: [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
};

// Get file size limit based on file type
export const getFileSizeLimit = (mimetype, fileType = 'default') => {
  if (fileType === 'avatar') {
    return FILE_SIZE_LIMITS.AVATAR;
  }
  if (ALLOWED_FILE_TYPES.IMAGES.includes(mimetype)) {
    return FILE_SIZE_LIMITS.IMAGE;
  }
  if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(mimetype)) {
    return FILE_SIZE_LIMITS.DOCUMENT;
  }
  return FILE_SIZE_LIMITS.DEFAULT;
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type
export const validateFileType = (file, allowedTypes = 'all') => {
  const fileType = file.type;
  
  switch (allowedTypes) {
    case 'documents':
      return ALLOWED_FILE_TYPES.DOCUMENTS.includes(fileType);
    case 'images':
      return ALLOWED_FILE_TYPES.IMAGES.includes(fileType);
    case 'avatars':
      return ALLOWED_FILE_TYPES.AVATARS.includes(fileType);
    case 'all':
    default:
      return [
        ...ALLOWED_FILE_TYPES.DOCUMENTS,
        ...ALLOWED_FILE_TYPES.IMAGES
      ].includes(fileType);
  }
};

// Validate file size
export const validateFileSize = (file, fileType = 'default') => {
  const maxSize = getFileSizeLimit(file.type, fileType);
  return file.size <= maxSize;
};

// Get file validation error message
export const getFileValidationError = (file, allowedTypes = 'all', fileType = 'default') => {
  if (!validateFileType(file, allowedTypes)) {
    const allowedExtensions = allowedTypes === 'documents' ? 'PDF, Word, Excel' :
                            allowedTypes === 'images' ? 'JPEG, PNG, GIF' :
                            allowedTypes === 'avatars' ? 'JPEG, PNG' :
                            'PDF, Word, Excel, JPEG, PNG, GIF';
    return `Invalid file type. Allowed types: ${allowedExtensions}`;
  }
  
  if (!validateFileSize(file, fileType)) {
    const maxSize = getFileSizeLimit(file.type, fileType);
    const maxSizeFormatted = formatFileSize(maxSize);
    const currentSizeFormatted = formatFileSize(file.size);
    return `File size too large. Current: ${currentSizeFormatted}, Maximum: ${maxSizeFormatted}`;
  }
  
  return null;
};

// Validate multiple files
export const validateMultipleFiles = (files, allowedTypes = 'all', fileType = 'default') => {
  const errors = [];
  const validFiles = [];
  
  Array.from(files).forEach((file, index) => {
    const error = getFileValidationError(file, allowedTypes, fileType);
    if (error) {
      errors.push({
        file: file.name,
        index,
        error
      });
    } else {
      validFiles.push(file);
    }
  });
  
  return {
    validFiles,
    errors,
    isValid: errors.length === 0
  };
};

// Get file type category
export const getFileTypeCategory = (mimetype) => {
  if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(mimetype)) {
    return 'document';
  }
  if (ALLOWED_FILE_TYPES.IMAGES.includes(mimetype)) {
    return 'image';
  }
  return 'unknown';
};

// Get file icon based on type
export const getFileIcon = (mimetype) => {
  if (mimetype === 'application/pdf') return '📄';
  if (mimetype.includes('word')) return '📝';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
  if (mimetype.startsWith('image/')) return '🖼️';
  return '📁';
};

const fileValidationUtils = {
  FILE_SIZE_LIMITS,
  ALLOWED_FILE_TYPES,
  getFileSizeLimit,
  formatFileSize,
  validateFileType,
  validateFileSize,
  getFileValidationError,
  validateMultipleFiles,
  getFileTypeCategory,
  getFileIcon
};

export default fileValidationUtils;
