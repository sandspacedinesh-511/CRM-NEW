const { Document, Student, Activity } = require('../models');
const DigitalOceanStorageService = require('../services/digitalOceanStorage');
const multer = require('multer');

// Initialize storage service
const storageService = new DigitalOceanStorageService();

// Configure multer for memory storage (we'll upload directly to DigitalOcean Spaces)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for DigitalOcean Spaces
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'), false);
    }
  }
});

// Export upload middleware for use in other routes
exports.upload = upload;

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get studentId from route parameter or body
    const studentId = req.params.id || req.body.studentId;
    const { type, description, expiryDate, issueDate, issuingAuthority, documentNumber, countryOfIssue, remarks, priority } = req.body;
    
    // Validate and normalize priority value
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const normalizedPriority = priority && validPriorities.includes(priority.toUpperCase()) 
      ? priority.toUpperCase() 
      : 'MEDIUM';

    // Verify student belongs to counselor
    const student = await Student.findOne({
      where: {
        id: studentId,
        counselorId: req.user.id
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Upload to DigitalOcean Spaces (with graceful local fallback in non-production)
    let uploadResult;

    // Check if Digital Ocean is configured
    const hasDOConfig = process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET && process.env.DO_SPACES_BUCKET;

    const useLocalStorage = async () => {
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file locally
      fs.writeFileSync(filePath, req.file.buffer);

      return {
        url: `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/documents/${uniqueFilename}`,
        key: `documents/${uniqueFilename}`,
        bucket: 'local-storage',
        region: 'local',
        localPath: filePath
      };
    };

    if (!hasDOConfig) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          message: 'File storage not configured. Please contact administrator.',
          error: 'Digital Ocean Spaces configuration missing'
        });
      }

      // Development / non-production: always fall back to local storage
      uploadResult = await useLocalStorage();
    } else {
      // Digital Ocean is configured, proceed with real upload
      const storageServiceInstance = new DigitalOceanStorageService();
      try {
        uploadResult = await storageServiceInstance.uploadFile(req.file, 'documents');
      } catch (storageError) {
        console.error('❌ DigitalOcean Spaces upload failed:', storageError);

        // In non-production, gracefully fall back to local storage if bucket/credentials are misconfigured
        if (process.env.NODE_ENV !== 'production' && (storageError.code === 'NoSuchBucket' || storageError.message?.includes('NoSuchBucket'))) {
          console.warn('⚠️ Falling back to local file storage due to missing DigitalOcean bucket (non-production only).');
          uploadResult = await useLocalStorage();
        } else {
          throw storageError;
        }
      }
    }

    // Validate and normalize document type
    // Map to valid ENUM value or use 'OTHER' as fallback
    const validTypes = [
      'PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE',
      'ENGLISH_TEST_SCORE', 'CV_RESUME', 'FINANCIAL_STATEMENT', 'BIRTH_CERTIFICATE',
      'MEDICAL_CERTIFICATE', 'POLICE_CLEARANCE', 'BANK_STATEMENT', 'SPONSOR_LETTER',
      'ID_CARD', 'ENROLLMENT_LETTER', 'OFFER_LETTER',
      // Country-specific types
      'I_20_FORM', 'SEVIS_FEE_RECEIPT', 'DS_160_CONFIRMATION', 'VISA_APPOINTMENT_CONFIRMATION',
      'BANK_STATEMENTS', 'SPONSOR_AFFIDAVIT', 'INCOME_PROOF', 'TB_TEST_CERTIFICATE',
      'TUITION_FEE_RECEIPT', 'BLOCKED_ACCOUNT_PROOF', 'HEALTH_INSURANCE', 'APS_CERTIFICATE',
      'VISA_APPLICATION', 'BIOMETRICS', 'LOA', 'GIC_CERTIFICATE', 'MEDICAL_EXAM',
      'OSHC', 'ECOE', 'FINANCIAL_PROOF', 'MEDICAL_INSURANCE', 'CAMPUS_FRANCE_REGISTRATION',
      'INTERVIEW_ACKNOWLEDGEMENT', 'OFII_FORM', 'UNIVERSITALY_RECEIPT', 'ACCOMMODATION_PROOF',
      'IPA_LETTER', 'MEDICAL_REPORT', 'STUDENT_VISA_APPROVAL', 'MEDICAL_TEST',
      'EMIRATES_ID_APPLICATION', 'OTHER'
    ];
    
    const normalizedType = type && validTypes.includes(type) ? type : 'OTHER';
    
    // Save document record to database
    const document = await Document.create({
      name: req.file.originalname,
      type: normalizedType,
      description: description || '',
      path: uploadResult.key, // Store the Spaces key instead of local path
      url: uploadResult.url, // Store the full URL
      mimeType: req.file.mimetype,
      size: req.file.size,
      studentId: studentId,
      status: 'PENDING',
      uploadedBy: req.user.id,
      expiryDate: expiryDate || null,
      issueDate: issueDate || null,
      issuingAuthority: issuingAuthority || null,
      documentNumber: documentNumber || null,
      countryOfIssue: countryOfIssue || null,
      remarks: remarks || null,
      priority: normalizedPriority
    });

    // Create activity for document upload
    await Activity.create({
      type: 'DOCUMENT_UPLOAD',
      description: `Document uploaded: ${document.name} (${document.type})`,
      studentId: studentId,
      userId: req.user.id,
      metadata: {
        documentId: document.id,
        documentType: document.type,
        documentName: document.name,
        fileSize: document.size,
        mimeType: document.mimeType
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: document.status,
        createdAt: document.createdAt,
        mimeType: document.mimeType,
        description: document.description,
        expiryDate: document.expiryDate,
        issueDate: document.issueDate,
        issuingAuthority: document.issuingAuthority,
        documentNumber: document.documentNumber,
        countryOfIssue: document.countryOfIssue,
        remarks: document.remarks,
        priority: document.priority
      }
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    console.error('📋 Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      name: error.name
    });
    console.error('📋 Full error object:', error);

    // Provide more specific error messages
    let errorMessage = 'Error uploading document';
    let statusCode = 500;

    if (error.message.includes('DO_SPACES_BUCKET') || error.message.includes('environment variable is not set')) {
      errorMessage = process.env.NODE_ENV === 'production'
        ? 'File storage not configured. Please contact administrator.'
        : 'Digital Ocean Spaces not configured. Missing environment variables.';
      statusCode = 503; // Service unavailable
    } else if (error.message.includes('Digital Ocean Spaces configuration missing')) {
      errorMessage = 'File storage not configured. Please contact administrator.';
      statusCode = 503;
    } else if (error.message.includes('InvalidAccessKeyId')) {
      errorMessage = 'Digital Ocean Spaces configuration error: Invalid access key';
      statusCode = 500;
    } else if (error.message.includes('SignatureDoesNotMatch')) {
      errorMessage = 'Digital Ocean Spaces configuration error: Invalid secret key';
      statusCode = 500;
    } else if (error.message.includes('NoSuchBucket')) {
      errorMessage = 'Digital Ocean Spaces configuration error: Bucket does not exist';
      statusCode = 500;
    } else if (error.message.includes('AccessDenied')) {
      errorMessage = 'Digital Ocean Spaces access denied: Check permissions';
      statusCode = 500;
    } else if (error.message.includes('RequestTimeout')) {
      errorMessage = 'Upload timeout: Please try again';
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error: Cannot connect to Digital Ocean Spaces';
      statusCode = 503;
    }

    res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Preview document
exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }
    // Check if file is stored locally or in DigitalOcean Spaces
    // DigitalOcean Spaces files have URLs that contain the bucket domain
    const isDigitalOceanFile = document.url && (
      document.url.includes('digitaloceanspaces.com') ||
      document.url.includes('counselor-crm-files.') ||
      document.path.startsWith('documents/') && !document.path.includes('/app/uploads/')
    );

    const isLocalFile = !isDigitalOceanFile && (
      document.path.startsWith('/app/uploads/') ||
      document.path.startsWith('uploads/') ||
      document.path.startsWith('documents/') && document.path.includes('/app/uploads/')
    );
    if (isLocalFile) {
      // Handle local files (legacy uploads)
      const fs = require('fs');
      const path = require('path');

      // Try multiple possible local paths
      let filePath = null;
      const possiblePaths = [
        document.path, // Original path
        path.join(__dirname, '..', 'uploads', 'documents', path.basename(document.path)),
        path.join(__dirname, '..', '..', 'uploads', 'documents', path.basename(document.path)),
        path.join(process.cwd(), 'uploads', 'documents', path.basename(document.path)),
        path.join(__dirname, '..', 'uploads', path.basename(document.path)),
        path.join(process.cwd(), 'uploads', path.basename(document.path))
      ];

      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      }

      if (!filePath) {
        return res.json({
          previewable: false,
          message: 'Document file is not available locally. It may have been deleted or moved.',
          document: {
            id: document.id,
            name: document.name,
            type: document.type,
            mimeType: document.mimeType,
            size: document.size,
            status: document.status,
            createdAt: document.createdAt
          },
          errorType: 'FILE_NOT_FOUND_LOCALLY'
        });
      }

      // For local files, serve directly
      const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

      if (previewableTypes.includes(document.mimeType)) {
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${document.name}"`);

        const stats = fs.statSync(filePath);
        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
      } else {
        return res.json({
          previewable: false,
          message: 'This file type cannot be previewed. Please download to view.',
          document: {
            id: document.id,
            name: document.name,
            type: document.type,
            mimeType: document.mimeType,
            size: document.size
          }
        });
      }
    } else {
      // Handle DigitalOcean Spaces files
      const storageService = new DigitalOceanStorageService();

      try {
        const fileExists = await storageService.fileExists(document.path);
        if (!fileExists) {
          return res.json({
            previewable: false,
            message: 'Document file is not available. It may have been deleted or moved.',
            document: {
              id: document.id,
              name: document.name,
              type: document.type,
              mimeType: document.mimeType,
              size: document.size,
              status: document.status,
              createdAt: document.createdAt
            },
            errorType: 'FILE_NOT_FOUND'
          });
        }
      } catch (storageError) {
        console.error('❌ Error checking DigitalOcean Spaces:', storageError);

        // Fallback: Check if file exists locally (e.g. for dev/seed data)
        const fs = require('fs');
        const path = require('path');
        const localPath = path.join(__dirname, '..', 'uploads', 'documents', path.basename(document.path));

        if (fs.existsSync(localPath)) {
          console.log('⚠️ Serving local fallback for:', localPath);
          const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

          if (previewableTypes.includes(document.mimeType)) {
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${document.name}"`);

            const stats = fs.statSync(localPath);
            res.setHeader('Content-Length', stats.size);

            const fileStream = fs.createReadStream(localPath);
            fileStream.pipe(res);
            return;
          }
        }

        return res.json({
          previewable: false,
          message: 'Error accessing cloud storage. Please check your DigitalOcean Spaces configuration.',
          document: {
            id: document.id,
            name: document.name,
            type: document.type,
            mimeType: document.mimeType,
            size: document.size,
            status: document.status,
            createdAt: document.createdAt
          },
          errorType: 'STORAGE_ERROR'
        });
      }
    }

    // Generate signed URL for preview
    const signedUrl = await storageService.getPresignedUrl(document.path, 3600); // 1 hour expiry
    // For previewable files, return signed URL
    const previewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (previewableTypes.includes(document.mimeType)) {
      res.json({
        previewable: true,
        message: 'Document preview available',
        previewUrl: signedUrl,
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          mimeType: document.mimeType,
          size: document.size,
          status: document.status,
          createdAt: document.createdAt
        }
      });
    } else {
      res.json({
        previewable: false,
        message: 'This file type cannot be previewed. Please download to view.',
        downloadUrl: signedUrl,
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          mimeType: document.mimeType,
          size: document.size
        }
      });
    }
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({ message: 'Error previewing document' });
  }
};

// Download document
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    // Check if file exists in cloud storage
    const storageService = new DigitalOceanStorageService();
    const fileExists = await storageService.fileExists(document.path);

    if (!fileExists) {
      return res.status(404).json({
        message: 'Document file is not available. It may have been deleted or moved.',
        errorType: 'FILE_NOT_FOUND'
      });
    }

    // Generate signed URL for download
    const signedUrl = await storageService.getPresignedUrl(document.path, 3600); // 1 hour expiry

    res.redirect(signedUrl);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { id: req.params.id },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: []
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    // Delete from cloud storage
    try {
      const storageService = new DigitalOceanStorageService();
      await storageService.deleteFile(document.path);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await document.destroy();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
};

// Update document status
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const documentId = req.params.id;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find document and verify counselor access
    const document = await Document.findOne({
      where: { id: documentId },
      include: [{
        model: Student,
        as: 'student',
        where: { counselorId: req.user.id },
        attributes: ['id']
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Update document status
    await document.update({ status });

    res.json({
      success: true,
      message: 'Document status updated successfully',
      data: {
        id: document.id,
        name: document.name,
        status: document.status,
        updatedAt: document.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating document status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
