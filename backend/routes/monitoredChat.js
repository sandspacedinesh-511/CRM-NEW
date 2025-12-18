const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User } = require('../models');

// Get all conversations for monitoring (admin only)
router.get('/conversations', auth, checkRole(['admin']), async (req, res) => {
  try {
    const conversations = await cacheUtils.get('monitored_conversations') || [];
    
    // If no conversations in cache, provide some sample conversations based on real users
    if (conversations.length === 0) {
      const users = await User.findAll({
        where: { role: ['admin', 'counselor'] },
        attributes: ['id', 'name', 'email', 'role'],
        limit: 6
      });

      const sampleConversations = [
        {
          id: 'conv1',
          participants: [
            { id: users[0]?.id || 'u1', name: users[0]?.name || 'Counselor Alice', role: 'counselor' },
            { id: 'student1', name: 'Student Bob', role: 'student' }
          ],
          lastMessage: 'Hi Bob, how can I help you today?',
          lastMessageTime: new Date(Date.now() - 60000).toISOString(),
          status: 'active',
          unreadMessages: 2,
          messageCount: 15,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'conv2',
          participants: [
            { id: users[1]?.id || 'u2', name: users[1]?.name || 'Counselor Carol', role: 'counselor' },
            { id: 'student2', name: 'Student David', role: 'student' }
          ],
          lastMessage: 'Please upload your documents.',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          status: 'resolved',
          unreadMessages: 0,
          messageCount: 8,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'conv3',
          participants: [
            { id: users[2]?.id || 'u3', name: users[2]?.name || 'Counselor Eve', role: 'counselor' },
            { id: 'student3', name: 'Student Frank', role: 'student' }
          ],
          lastMessage: 'I have a question about my application.',
          lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
          status: 'active',
          unreadMessages: 0,
          messageCount: 12,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Store the conversations in cache for future use
      await cacheUtils.set('monitored_conversations', sampleConversations, 86400); // 24 hours TTL
      
      res.json({
        success: true,
        conversations: sampleConversations
      });
    } else {
      res.json({
        success: true,
        conversations: conversations
      });
    }
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Get conversation details (admin only)
router.get('/conversations/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversations = await cacheUtils.get('monitored_conversations') || [];
    const conversation = conversations.find(c => c.id === id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Mock conversation messages
    const messages = [
      {
        id: 1,
        senderId: conversation.participants[1].id,
        senderName: conversation.participants[1].name,
        message: 'Hello, I need help with my application.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'text'
      },
      {
        id: 2,
        senderId: conversation.participants[0].id,
        senderName: conversation.participants[0].name,
        message: 'Hi! I\'d be happy to help you. What specific questions do you have?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
        type: 'text'
      },
      {
        id: 3,
        senderId: conversation.participants[1].id,
        senderName: conversation.participants[1].name,
        message: conversation.lastMessage,
        timestamp: conversation.lastMessageTime,
        type: 'text'
      }
    ];
    
    res.json({
      success: true,
      conversation: {
        ...conversation,
        messages: messages
      }
    });
  } catch (error) {
    logger.error('Error fetching conversation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation details'
    });
  }
});

// Resolve a conversation (admin only)
router.post('/conversations/:id/resolve', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    let conversations = await cacheUtils.get('monitored_conversations') || [];
    const conversationIndex = conversations.findIndex(c => c.id === id);
    
    if (conversationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    conversations[conversationIndex].status = 'resolved';
    conversations[conversationIndex].resolvedAt = new Date().toISOString();
    conversations[conversationIndex].resolvedBy = req.user.id;
    
    await cacheUtils.set('monitored_conversations', conversations, 86400); // 24 hours TTL
    
    res.json({
      success: true,
      message: 'Conversation resolved successfully'
    });
  } catch (error) {
    logger.error('Error resolving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve conversation'
    });
  }
});

module.exports = router;
