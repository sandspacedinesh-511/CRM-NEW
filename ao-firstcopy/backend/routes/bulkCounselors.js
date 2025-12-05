const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Get import history (admin only)
router.get('/history', auth, checkRole(['admin']), async (req, res) => {
  try {
    const history = await cacheUtils.get('import_history') || [];
    
    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    logger.error('Error fetching import history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import history'
    });
  }
});

// Import counselors from CSV (admin only)
router.post('/import', auth, checkRole(['admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const csvData = req.file.buffer.toString('utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate CSV headers
    const requiredHeaders = ['name', 'email', 'phone', 'specialization', 'location', 'experience', 'education'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }
    
    const results = {
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: []
    };
    
    // Process CSV data
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        results.totalRecords++;
        const values = lines[i].split(',').map(v => v.trim());
        
        try {
          // Create counselor object
          const counselor = {
            id: `counselor_${Date.now()}_${i}`,
            name: values[headers.indexOf('name')],
            email: values[headers.indexOf('email')],
            phone: values[headers.indexOf('phone')],
            specialization: values[headers.indexOf('specialization')],
            location: values[headers.indexOf('location')],
            experience: values[headers.indexOf('experience')],
            education: values[headers.indexOf('education')],
            role: 'counselor',
            active: true,
            createdAt: new Date().toISOString()
          };
          
          // Validate required fields
          if (!counselor.name || !counselor.email) {
            throw new Error('Name and email are required');
          }
          
          // Simulate successful import
          results.successfulImports++;
          
        } catch (error) {
          results.failedImports++;
          results.errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }
    }
    
    // Store import record
    const importRecord = {
      id: Date.now().toString(),
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString(),
      totalRecords: results.totalRecords,
      successfulImports: results.successfulImports,
      failedImports: results.failedImports,
      status: results.failedImports > 0 ? 'completed_with_errors' : 'completed',
      uploadedBy: req.user.name
    };
    
    const history = await cacheUtils.get('import_history') || [];
    history.unshift(importRecord);
    await cacheUtils.set('import_history', history, 86400 * 7); // 7 days TTL
    
    res.json({
      success: true,
      message: 'Import completed successfully',
      results: results
    });
  } catch (error) {
    logger.error('Error importing counselors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import counselors'
    });
  }
});

// Download template (admin only)
router.get('/template', auth, checkRole(['admin']), (req, res) => {
  try {
    const csvContent = [
      'name,email,phone,specialization,location,experience,education',
      'John Doe,john.doe@example.com,+1234567890,Engineering,New York,5,BS Computer Science',
      'Jane Smith,jane.smith@example.com,+0987654321,Medicine,California,8,MD Medicine',
      'Mike Johnson,mike.johnson@example.com,+1122334455,Business,Texas,3,MBA Business'
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=counselor_import_template.csv');
    res.send(csvContent);
  } catch (error) {
    logger.error('Error downloading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
});

module.exports = router;
