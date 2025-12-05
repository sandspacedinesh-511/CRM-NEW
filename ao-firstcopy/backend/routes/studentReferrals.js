const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User } = require('../models');

// Get all referrals (admin only)
router.get('/referrals', auth, checkRole(['admin']), async (req, res) => {
  try {
    const referrals = await cacheUtils.get('student_referrals') || [];
    
    // If no referrals in cache, provide some sample referrals based on real users
    if (referrals.length === 0) {
      const users = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'name', 'email'],
        limit: 1
      });

      const sampleReferrals = [
        {
          id: 1,
          source: 'Social Media',
          contactPerson: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          status: 'active',
          notes: 'Initial contact via Instagram.',
          createdAt: new Date().toISOString(),
          createdBy: users[0]?.id || req.user.id,
          createdByName: users[0]?.name || req.user.name
        },
        {
          id: 2,
          source: 'Website',
          contactPerson: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          status: 'pending',
          notes: 'Submitted inquiry form on website.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: users[0]?.id || req.user.id,
          createdByName: users[0]?.name || req.user.name
        },
        {
          id: 3,
          source: 'Referral',
          contactPerson: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+1122334455',
          status: 'active',
          notes: 'Referred by existing student.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          createdBy: users[0]?.id || req.user.id,
          createdByName: users[0]?.name || req.user.name
        }
      ];
      
      // Store the referrals in cache for future use
      await cacheUtils.set('student_referrals', sampleReferrals, 86400); // 24 hours TTL
      
      res.json({
        success: true,
        referrals: sampleReferrals
      });
    } else {
      res.json({
        success: true,
        referrals: referrals
      });
    }
  } catch (error) {
    logger.error('Error fetching student referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student referrals'
    });
  }
});

// Create new referral (admin only)
router.post('/referrals', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { source, contactPerson, email, phone, status, notes } = req.body;
    
    const referral = {
      id: Date.now().toString(),
      source,
      contactPerson,
      email,
      phone,
      status: status || 'active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      createdByName: req.user.name
    };
    
    // Store referral in cache
    const referrals = await cacheUtils.get('student_referrals') || [];
    referrals.unshift(referral);
    await cacheUtils.set('student_referrals', referrals, 86400); // 24 hours TTL
    
    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      referral: referral
    });
  } catch (error) {
    logger.error('Error creating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create referral'
    });
  }
});

// Update referral (admin only)
router.put('/referrals/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { source, contactPerson, email, phone, status, notes } = req.body;
    
    let referrals = await cacheUtils.get('student_referrals') || [];
    const referralIndex = referrals.findIndex(r => r.id === id);
    
    if (referralIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    
    referrals[referralIndex] = {
      ...referrals[referralIndex],
      source,
      contactPerson,
      email,
      phone,
      status,
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    await cacheUtils.set('student_referrals', referrals, 86400); // 24 hours TTL
    
    res.json({
      success: true,
      message: 'Referral updated successfully',
      referral: referrals[referralIndex]
    });
  } catch (error) {
    logger.error('Error updating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update referral'
    });
  }
});

// Delete referral (admin only)
router.delete('/referrals/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    let referrals = await cacheUtils.get('student_referrals') || [];
    const referralIndex = referrals.findIndex(r => r.id === id);
    
    if (referralIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    
    referrals.splice(referralIndex, 1);
    await cacheUtils.set('student_referrals', referrals, 86400); // 24 hours TTL
    
    res.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting referral:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete referral'
    });
  }
});

module.exports = router;
