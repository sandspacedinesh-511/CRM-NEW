import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const StudentChat = ({ open, onClose, student }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open && student?.id) {
      loadMessages();
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [open, student?.id]);

  const loadMessages = async () => {
    if (!student?.id) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/messages/student/${student.id}`);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!student?.id || !user?.id) return;

    // Use polling for real-time updates (every 3 seconds)
    // This ensures messages appear quickly without complex WebSocket setup
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 3000);
    
    wsRef.current = { close: () => clearInterval(pollInterval) };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !student?.id || sending) return;

    try {
      setSending(true);

      // Determine receiver (marketing owner if student has one)
      const receiverId = student.marketingOwner?.id;
      
      if (!receiverId) {
        alert('Cannot send message: No marketing contact found for this student.');
        setSending(false);
        return;
      }

      const response = await axiosInstance.post('/messages', {
        studentId: student.id,
        receiverId: receiverId,
        message: newMessage.trim()
      });

      if (response.data.success) {
        // Add message to local state immediately for instant feedback
        setMessages(prev => [...prev, response.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isMyMessage = (message) => {
    return message.senderId === user?.id;
  };

  const getOtherParticipant = () => {
    if (!student) return null;
    if (student.marketingOwner) return student.marketingOwner;
    return null;
  };

  const otherParticipant = getOtherParticipant();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChatIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Chat with {otherParticipant?.name || 'Marketing Team'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {student?.firstName} {student?.lastName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.02)
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message);
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      gap: 1
                    }}
                  >
                    {!isMine && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.secondary.main
                        }}
                      >
                        {message.sender?.name?.charAt(0) || 'M'}
                      </Avatar>
                    )}
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        bgcolor: isMine
                          ? theme.palette.primary.main
                          : theme.palette.background.paper,
                        color: isMine ? 'white' : 'text.primary',
                        borderRadius: 2
                      }}
                    >
                      {!isMine && (
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8 }}>
                          {message.sender?.name || 'Unknown'}
                        </Typography>
                      )}
                      <Typography variant="body2">{message.message}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                      >
                        {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                      </Typography>
                    </Paper>
                    {isMine && (
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.primary.main
                        }}
                      >
                        {user?.name?.charAt(0) || 'C'}
                      </Avatar>
                    )}
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || !otherParticipant}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending || !otherParticipant}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentChat;

