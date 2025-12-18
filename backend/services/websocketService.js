const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger, performanceLogger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.userRooms = new Map(); // userId -> rooms
    this.roomUsers = new Map(); // room -> Set of userIds
  }

  initialize(server) {
    const allowedOrigins = [
      process.env.WEBSOCKET_CORS_ORIGIN,
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ].filter(Boolean);

    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6 // 1MB
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('WebSocket service initialized');
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const { userId, userRole, userEmail } = socket;

      performanceLogger.logWebSocketEvent('connection', userId, { userRole, userEmail });

      // Store connected user
      this.connectedUsers.set(userId, socket);

      // Join user-specific room
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      this.userRooms.set(userId, new Set([userRoom]));

      // Join role-based room
      const roleRoom = `role:${userRole}`;
      socket.join(roleRoom);
      this.userRooms.get(userId).add(roleRoom);

      // Join counselor-specific room if applicable
      if (userRole === 'counselor') {
        const counselorRoom = `counselor:${userId}`;
        socket.join(counselorRoom);
        this.userRooms.get(userId).add(counselorRoom);
      }

      // Join admin room if applicable
      if (userRole === 'admin') {
        socket.join('admin:all');
        this.userRooms.get(userId).add('admin:all');
      }

      logger.info(`User ${userId} (${userEmail}) connected to WebSocket`);

      // Handle user activity
      socket.on('user_activity', (data) => {
        this.handleUserActivity(socket, data);
      });

      // Handle application status updates
      socket.on('application_update', (data) => {
        this.handleApplicationUpdate(socket, data);
      });

      // Handle document upload notifications
      socket.on('document_uploaded', (data) => {
        this.handleDocumentUpload(socket, data);
      });

      // Handle real-time chat
      socket.on('chat_message', (data) => {
        this.handleChatMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingIndicator(socket, data, true);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingIndicator(socket, data, false);
      });

      // Handle room joins
      socket.on('join_room', (room) => {
        this.handleJoinRoom(socket, room);
      });

      // Handle room leaves
      socket.on('leave_room', (room) => {
        this.handleLeaveRoom(socket, room);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      // Send initial connection data
      this.sendInitialData(socket);
    });
  }

  handleUserActivity(socket, data) {
    const { userId } = socket;
    const { action, details } = data;

    performanceLogger.logWebSocketEvent('user_activity', userId, { action, details });

    // Broadcast to relevant rooms
    const rooms = this.userRooms.get(userId) || [];
    rooms.forEach(room => {
      socket.to(room).emit('user_activity_update', {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    });
  }

  handleApplicationUpdate(socket, data) {
    const { userId } = socket;
    const { applicationId, status, changes } = data;

    performanceLogger.logWebSocketEvent('application_update', userId, { applicationId, status });

    // Notify relevant users about application status change
    this.broadcastToRoom(`application:${applicationId}`, 'application_status_changed', {
      applicationId,
      status,
      changes,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Notify counselors and admins
    this.broadcastToRoom('role:counselor', 'application_update', {
      applicationId,
      status,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    if (socket.userRole === 'admin') {
      this.broadcastToRoom('admin:all', 'application_update', {
        applicationId,
        status,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleDocumentUpload(socket, data) {
    const { userId } = socket;
    const { documentId, studentId, fileName, fileSize } = data;

    performanceLogger.logWebSocketEvent('document_upload', userId, { documentId, studentId });

    // Notify student's counselor
    this.broadcastToRoom(`counselor:${userId}`, 'document_uploaded', {
      documentId,
      studentId,
      fileName,
      fileSize,
      uploadedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  handleChatMessage(socket, data) {
    const { userId } = socket;
    const { room, message, type = 'text' } = data;

    performanceLogger.logWebSocketEvent('chat_message', userId, { room, type });

    // Broadcast message to room
    this.broadcastToRoom(room, 'chat_message', {
      userId,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    // Store message in cache for persistence
    this.storeChatMessage(room, {
      userId,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingIndicator(socket, data, isTyping) {
    const { userId } = socket;
    const { room } = data;

    // Broadcast typing indicator to room
    socket.to(room).emit('typing_indicator', {
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  handleJoinRoom(socket, room) {
    const { userId } = socket;

    socket.join(room);
    this.userRooms.get(userId).add(room);

    // Track room users
    if (!this.roomUsers.has(room)) {
      this.roomUsers.set(room, new Set());
    }
    this.roomUsers.get(room).add(userId);

    logger.info(`User ${userId} joined room: ${room}`);
  }

  handleLeaveRoom(socket, room) {
    const { userId } = socket;

    socket.leave(room);
    this.userRooms.get(userId)?.delete(room);

    // Remove from room tracking
    this.roomUsers.get(room)?.delete(userId);
    if (this.roomUsers.get(room)?.size === 0) {
      this.roomUsers.delete(room);
    }

    logger.info(`User ${userId} left room: ${room}`);
  }

  handleDisconnect(socket, reason) {
    const { userId } = socket;

    // Clean up user tracking
    this.connectedUsers.delete(userId);
    this.userRooms.delete(userId);

    // Remove from all room tracking
    this.roomUsers.forEach((users, room) => {
      users.delete(userId);
      if (users.size === 0) {
        this.roomUsers.delete(room);
      }
    });

    performanceLogger.logWebSocketEvent('disconnect', userId, { reason });
    logger.info(`User ${userId} disconnected: ${reason}`);
  }

  async sendInitialData(socket) {
    const { userId, userRole } = socket;

    try {
      // Send user's pending notifications
      const notifications = await this.getUserNotifications(userId);
      socket.emit('initial_notifications', notifications);

      // Send user's active applications if counselor
      if (userRole === 'counselor') {
        const applications = await this.getCounselorApplications(userId);
        socket.emit('initial_applications', applications);
      }

      // Send system status if admin
      if (userRole === 'admin') {
        const systemStatus = await this.getSystemStatus();
        socket.emit('system_status', systemStatus);
      }

    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  // Public methods for broadcasting
  broadcastToUser(userId, event, data) {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
      performanceLogger.logWebSocketEvent(event, userId, data);
    }
  }

  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
    performanceLogger.logWebSocketEvent(event, null, { room, dataSize: JSON.stringify(data).length });
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
    performanceLogger.logWebSocketEvent(event, null, { dataSize: JSON.stringify(data).length });
  }

  // Notification methods
  async sendNotification(userId, notification) {
    this.broadcastToUser(userId, 'notification', notification);

    // Store notification in cache
    await this.storeNotification(userId, notification);
  }

  async sendApplicationAlert(applicationId, alert) {
    // Send to application room
    this.broadcastToRoom(`application:${applicationId}`, 'application_alert', alert);

    // Send to counselors
    this.broadcastToRoom('role:counselor', 'application_alert', alert);
  }

  async sendSystemAlert(alert) {
    this.broadcastToRoom('admin:all', 'system_alert', alert);
  }

  // Send lead status update (when lead is assigned/accepted)
  async sendLeadStatusUpdate(userId, leadStatusData) {
    this.broadcastToUser(userId, 'lead_status_update', leadStatusData);
    performanceLogger.logWebSocketEvent('lead_status_update', userId, {
      dataSize: JSON.stringify(leadStatusData).length
    });
  }

  // Cache methods
  async storeNotification(userId, notification) {
    const key = `notifications:${userId}`;
    const notifications = await cacheUtils.get(key) || [];
    notifications.unshift(notification);

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }

    await cacheUtils.set(key, notifications, 3600); // 1 hour TTL
  }

  async getUserNotifications(userId) {
    const key = `notifications:${userId}`;
    return await cacheUtils.get(key) || [];
  }

  async storeChatMessage(room, message) {
    const key = `chat:${room}`;
    const messages = await cacheUtils.get(key) || [];
    messages.push(message);

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }

    await cacheUtils.set(key, messages, 86400); // 24 hours TTL
  }

  async getChatMessages(room) {
    const key = `chat:${room}`;
    return await cacheUtils.get(key) || [];
  }

  // Data retrieval methods (to be implemented based on your models)
  async getCounselorApplications(counselorId) {
    // Implementation depends on your application model
    return [];
  }

  async getSystemStatus() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.roomUsers.size,
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  getActiveRooms() {
    return Array.from(this.roomUsers.keys());
  }

  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send admin alert to specific audience
  async sendAdminAlert(alert) {
    try {
      if (alert.targetAudience === 'all') {
        this.broadcastToRoom('all', 'admin_alert', alert);
      } else if (alert.targetAudience === 'counselor' || alert.targetAudience === 'counselors') {
        this.broadcastToRoom('role:counselor', 'admin_alert', alert);
      } else if (alert.targetAudience === 'admin') {
        this.broadcastToRoom('role:admin', 'admin_alert', alert);
      } else if (alert.targetUsers && alert.targetUsers.length > 0) {
        alert.targetUsers.forEach(userId => {
          this.broadcastToUser(userId, 'admin_alert', alert);
        });
      }

      logger.info('Admin alert sent successfully:', alert.title);
    } catch (error) {
      logger.error('Error sending admin alert:', error);
    }
  }

  // Send student phase update notification
  async sendStudentPhaseUpdate(studentId, counselorId, phaseData) {
    try {
      const { currentPhase, previousPhase, country, countryProfile } = phaseData;

      // Create phase update event data
      const phaseUpdate = {
        studentId,
        currentPhase,
        previousPhase,
        country: country || null,
        countryProfile: countryProfile || null,
        updatedAt: new Date().toISOString()
      };

      // Notify the student's counselor
      if (counselorId) {
        this.broadcastToRoom(`counselor:${counselorId}`, 'student_phase_updated', phaseUpdate);
      }

      // Also broadcast to student-specific room (for future use if students can view their own progress)
      this.broadcastToRoom(`student:${studentId}`, 'student_phase_updated', phaseUpdate);

      // Broadcast to all counselors (for dashboard updates)
      this.broadcastToRoom('role:counselor', 'student_phase_updated', phaseUpdate);

      logger.info(`Phase update broadcast sent for student ${studentId}, phase: ${currentPhase}, country: ${country || 'global'}`);
    } catch (error) {
      logger.error('Error sending student phase update:', error);
    }
  }
}

module.exports = new WebSocketService();
