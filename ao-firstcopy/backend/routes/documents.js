const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { Document } = require('../models');
const { upload, generatePresignedUrl, deleteFile, getFileMetadata } = require('../config/s3.config');
const { body, validationResult } = require('express-validator');



// Get document with secure presigned URL
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check if user has permission to access this document
    if (req.user.role !== 'admin' && document.uploadedBy !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Generate presigned URL for secure access
    const presignedUrl = generatePresignedUrl(document.filename, 3600); // 1 hour expiry

    res.json({
      success: true,
      data: {
        id: document.id,
        originalName: document.originalName,
        type: document.type,
        size: document.size,
        status: document.status,
        uploadedAt: document.createdAt,
        downloadUrl: presignedUrl, // Secure temporary URL
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      }
    });

  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving document' 
    });
  }
});

// List documents for a student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { studentId: req.params.studentId },
      order: [['createdAt', 'DESC']]
    });

    // Generate presigned URLs for each document
    const documentsWithUrls = documents.map(doc => ({
      id: doc.id,
      originalName: doc.originalName,
      type: doc.type,
      size: doc.size,
      status: doc.status,
      uploadedAt: doc.createdAt,
      downloadUrl: generatePresignedUrl(doc.filename, 3600)
    }));

    res.json({
      success: true,
      data: documentsWithUrls
    });

  } catch (error) {
    console.error('Document list error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving documents' 
    });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.uploadedBy !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Delete from S3
    const s3Deleted = await deleteFile(document.filename);
    
    if (!s3Deleted) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error deleting file from storage' 
      });
    }

    // Delete from database
    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting document' 
    });
  }
});

// Update document status
router.patch('/:id/status', auth, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }

    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Only admins can update document status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    document.status = req.body.status;
    await document.save();

    res.json({
      success: true,
      message: 'Document status updated successfully',
      data: {
        id: document.id,
        status: document.status,
        updatedAt: document.updatedAt
      }
    });

  } catch (error) {
    console.error('Document status update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating document status' 
    });
  }
});

// Get document metadata
router.get('/:id/metadata', auth, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Get metadata from S3
    const metadata = await getFileMetadata(document.filename);

    res.json({
      success: true,
      data: {
        id: document.id,
        originalName: document.originalName,
        type: document.type,
        size: document.size,
        status: document.status,
        uploadedAt: document.createdAt,
        s3Metadata: metadata
      }
    });

  } catch (error) {
    console.error('Document metadata error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving document metadata' 
    });
  }
});

module.exports = router; 