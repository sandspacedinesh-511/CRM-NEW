import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const useWebSocket = () => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!user || !token) {
      console.log('No user or token available for WebSocket connection');
      return;
    }

    try {
      // Create socket connection with explicit WebSocket URL
      const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_BACKEND_URL || 'https://aoadmissionhub.com';
      console.log('Connecting to WebSocket:', websocketUrl);
      
      socketRef.current = io(websocketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectDelay * (reconnectAttempts + 1));
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
        setConnectionError(error.message);
      });

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError(error.message);
    }
  }, [user, token, reconnectAttempts]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
    }
  }, []);

  // Send message to WebSocket
  const sendMessage = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }, [isConnected]);

  // Listen to WebSocket events
  const onEvent = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      
      // Return cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    }
  }, []);

  // Join room
  const joinRoom = useCallback((room) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_room', room);
      return true;
    }
    return false;
  }, [isConnected]);

  // Leave room
  const leaveRoom = useCallback((room) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_room', room);
      return true;
    }
    return false;
  }, [isConnected]);

  // Send user activity
  const sendUserActivity = useCallback((action, details = {}) => {
    return sendMessage('user_activity', { action, details });
  }, [sendMessage]);

  // Send application update
  const sendApplicationUpdate = useCallback((applicationId, status, changes = {}) => {
    return sendMessage('application_update', { applicationId, status, changes });
  }, [sendMessage]);

  // Send document upload notification
  const sendDocumentUpload = useCallback((documentId, studentId, fileName, fileSize) => {
    return sendMessage('document_uploaded', { documentId, studentId, fileName, fileSize });
  }, [sendMessage]);

  // Send chat message
  const sendChatMessage = useCallback((room, message, type = 'text') => {
    return sendMessage('chat_message', { room, message, type });
  }, [sendMessage]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((room, isTyping) => {
    const event = isTyping ? 'typing_start' : 'typing_stop';
    return sendMessage(event, { room });
  }, [sendMessage]);

  // Initialize connection when user changes
  useEffect(() => {
    if (user && token) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user, token, connect, disconnect]);

  // Auto-reconnect on token refresh
  useEffect(() => {
    if (token && !isConnected && reconnectAttempts < maxReconnectAttempts) {
      const timer = setTimeout(() => {
        connect();
      }, reconnectDelay);

      return () => clearTimeout(timer);
    }
  }, [token, isConnected, reconnectAttempts, connect]);

  return {
    // Connection state
    isConnected,
    connectionError,
    reconnectAttempts,
    
    // Connection methods
    connect,
    disconnect,
    
    // Message methods
    sendMessage,
    onEvent,
    
    // Room methods
    joinRoom,
    leaveRoom,
    
    // Specific message methods
    sendUserActivity,
    sendApplicationUpdate,
    sendDocumentUpload,
    sendChatMessage,
    sendTypingIndicator,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current
  };
};

export default useWebSocket;
