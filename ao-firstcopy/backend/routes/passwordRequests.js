const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const webSocketService = require('../services/websocketService');

// Get all password requests (admin only)
router.get('/requests', auth, checkRole(['admin']), async (req, res) => {
  try {
    const requests = await cacheUtils.get('password_requests') || [];
    
    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    logger.error('Error fetching password requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password requests'
    });
  }
});

// Submit password change request (counselor)
router.post('/request', auth, async (req, res) => {
  try {
    const { reason, requestedBy, requestedByName, requestedByEmail } = req.body;
    const counselorId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const passwordRequest = {
      id: Date.now().toString(),
      counselorId,
      counselorName: req.user.name,
      counselorEmail: req.user.email,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      adminNotes: null,
      processedAt: null,
      processedBy: null
    };
    
    // Store request in cache
    await cacheUtils.set(`password_request:${passwordRequest.id}`, passwordRequest, 86400 * 7); // 7 days
    
    // Add to requests list
    const requestsList = await cacheUtils.get('password_requests') || [];
    requestsList.unshift(passwordRequest);
    await cacheUtils.set('password_requests', requestsList, 86400 * 7);
    
    // Send real-time notification to admins
    await webSocketService.broadcastToRoom('role:admin', 'password_request', passwordRequest);
    
    res.json({
      success: true,
      message: 'Password change request submitted successfully',
      request: passwordRequest
    });
  } catch (error) {
    logger.error('Error submitting password request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password request'
    });
  }
});

// Update password request status (admin only)
router.put('/requests/:id/status', auth, checkRole(['admin']), async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, adminNotes } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    let requestsList = await cacheUtils.get('password_requests') || [];
    const requestIndex = requestsList.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Password request not found'
      });
    }
    
    requestsList[requestIndex].status = status;
    requestsList[requestIndex].adminNotes = adminNotes;
    requestsList[requestIndex].processedAt = new Date().toISOString();
    requestsList[requestIndex].processedBy = req.user.name;
    
    await cacheUtils.set('password_requests', requestsList, 86400 * 7);
    await cacheUtils.set(`password_request:${requestId}`, requestsList[requestIndex], 86400 * 7);
    
    // Send real-time notification to counselor
    await webSocketService.broadcastToUser(requestsList[requestIndex].counselorId, 'password_request_update', requestsList[requestIndex]);
    
    res.json({
      success: true,
      message: 'Password request status updated successfully',
      request: requestsList[requestIndex]
    });
  } catch (error) {
    logger.error('Error updating password request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password request status'
    });
  }
});

// Get counselor's own requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const counselorId = req.user.id;
    const requestsList = await cacheUtils.get('password_requests') || [];
    const counselorRequests = requestsList.filter(req => req.counselorId === counselorId);
    
    res.json({
      success: true,
      requests: counselorRequests
    });
  } catch (error) {
    logger.error('Error fetching counselor requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password requests'
    });
  }
});

module.exports = router;
