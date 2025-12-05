const { Message, Student, User } = require('../models');
const { Op } = require('sequelize');
const { performanceLogger, errorLogger } = require('../utils/logger');

// Send a message from marketing to counselor or vice versa
exports.sendMessage = async (req, res) => {
  const timer = performanceLogger.startTimer('send_message');
  
  try {
    const { studentId, receiverId, message } = req.body;
    const senderId = req.user.id;

    // Validate required fields
    if (!studentId || !receiverId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, receiver ID, and message are required'
      });
    }

    // Verify the student exists and belongs to the sender or receiver
    const student = await Student.findOne({
      where: { id: studentId },
      include: [
        { model: User, as: 'counselor', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'marketingOwner', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify sender has access to this student
    const hasAccess = 
      student.counselorId === senderId || 
      student.marketingOwnerId === senderId ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student'
      });
    }

    // Verify receiver exists and is either the counselor or marketing owner
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Determine the receiver based on student's counselor and marketing owner
    let actualReceiverId = receiverId;
    
    // If sender is marketing/B2B marketing, receiver should be counselor
    if (student.marketingOwnerId === senderId) {
      if (student.counselorId) {
        actualReceiverId = student.counselorId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message: No counselor assigned to this student yet.'
        });
      }
    }
    // If sender is counselor, receiver should be marketing owner
    else if (student.counselorId === senderId) {
      if (student.marketingOwnerId) {
        actualReceiverId = student.marketingOwnerId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message: No marketing contact found for this student.'
        });
      }
    }
    // If sender is admin or other role, use the provided receiverId
    else {
      // Verify the receiver is either the counselor or marketing owner
      if (receiverId !== student.counselorId && receiverId !== student.marketingOwnerId) {
        return res.status(403).json({
          success: false,
          message: 'Invalid receiver for this student'
        });
      }
    }

    // Create the message
    let newMessage;
    try {
      newMessage = await Message.create({
        studentId,
        senderId,
        receiverId: actualReceiverId,
        message: message.trim(),
        messageType: 'text'
      });
    } catch (createError) {
      console.error('Error creating message:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      // If table doesn't exist, provide helpful error message
      if (createError.name === 'SequelizeDatabaseError') {
        if (createError.message.includes('doesn\'t exist') || createError.message.includes('Table')) {
          return res.status(500).json({
            success: false,
            message: 'Messages table does not exist. Please run: node backend/scripts/syncMessageTable.js',
            error: process.env.NODE_ENV === 'development' ? createError.message : undefined
          });
        }
      }
      // Re-throw to be caught by outer catch with full error details
      throw createError;
    }

    // Fetch the message with associations
    const messageWithDetails = await Message.findByPk(newMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/messages', duration, 200, req.user.id);

    // Emit WebSocket event for real-time updates
    try {
      const websocketService = require('../services/websocketService');
      if (websocketService.io) {
        websocketService.io.to(`user_${actualReceiverId}`).emit('new_message', {
          message: messageWithDetails,
          studentId,
          senderId
        });
      }
    } catch (wsError) {
      console.log('WebSocket not available, message saved but not broadcasted');
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: messageWithDetails
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('POST', '/api/messages', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'send_message',
      userId: req.user.id
    });
    console.error('Error sending message:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to send message';
    let errorDetails = error.message;
    
    if (error.name === 'SequelizeDatabaseError') {
      if (error.message.includes('doesn\'t exist') || error.message.includes('Table')) {
        errorMessage = 'Messages table does not exist. Please run: node backend/scripts/syncMessageTable.js';
      } else if (error.message.includes('foreign key constraint')) {
        errorMessage = 'Invalid student or user reference';
        errorDetails = error.message;
      } else {
        errorMessage = 'Database error occurred';
        errorDetails = error.message;
      }
    } else if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Validation error: ' + error.errors.map(e => e.message).join(', ');
      errorDetails = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = 'Invalid reference: Student or user does not exist';
      errorDetails = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      errorType: error.name
    });
  }
};

// Get messages for a specific student
exports.getStudentMessages = async (req, res) => {
  const timer = performanceLogger.startTimer('get_student_messages');
  const { studentId } = req.params;
  const userId = req.user.id;
  
  try {

    // Verify the student exists and user has access
    const student = await Student.findOne({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify user has access
    const hasAccess = 
      student.counselorId === userId || 
      student.marketingOwnerId === userId ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student'
      });
    }

    // Get all messages for this student where user is either sender or receiver
    const messages = await Message.findAll({
      where: {
        studentId,
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Mark messages as read if they are received by current user
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          studentId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/messages/student/${studentId}`, duration, 200, req.user.id);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', `/api/messages/student/${studentId || 'unknown'}`, duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'get_student_messages',
      userId: req.user.id,
      studentId: studentId || req.params?.studentId || 'unknown'
    });
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get unread message count for current user
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

// Get recent messages for marketing user (all their leads)
exports.getRecentMessages = async (req, res) => {
  const timer = performanceLogger.startTimer('get_recent_messages');
  const userId = req.user.id;
  
  try {
    // Get all students owned by this marketing user
    const students = await Student.findAll({
      where: {
        marketingOwnerId: userId
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get the latest message for each student
    const recentMessages = await Message.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group messages by student and get the latest one for each
    const latestMessagesByStudent = {};
    recentMessages.forEach(msg => {
      const studentId = msg.studentId;
      if (!latestMessagesByStudent[studentId] || 
          new Date(msg.createdAt) > new Date(latestMessagesByStudent[studentId].createdAt)) {
        latestMessagesByStudent[studentId] = msg;
      }
    });

    // Convert to array and sort by most recent
    const result = Object.values(latestMessagesByStudent)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/messages/recent', duration, 200, req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/messages/recent', duration, 500, req.user.id);
    errorLogger.logError(error, {
      scope: 'get_recent_messages',
      userId: req.user.id
    });
    console.error('Error fetching recent messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          studentId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

