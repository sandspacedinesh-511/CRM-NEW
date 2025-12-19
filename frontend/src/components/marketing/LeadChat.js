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
import useWebSocket from '../../hooks/useWebSocket';

const LeadChat = ({ open, onClose, lead }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, onEvent } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when dialog opens
  useEffect(() => {
    if (open && lead?.id) {
      loadMessages();
    }
  }, [open, lead?.id]);

  // WebSocket listener for real-time messages
  useEffect(() => {
    if (!isConnected || !open || !lead?.id) return;

    const cleanup = onEvent('new_message', (data) => {
      if (data.message && data.studentId === lead.id) {
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => {
            if (data.message.id && msg.id === data.message.id) return true;
            if (!data.message.id && msg.message === data.message.message && 
                Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt)) < 1000) {
              return true;
            }
            return false;
          });
          if (exists) {
            return prev;
          }
          // Add new message and sort by createdAt
          const updated = [...prev, data.message];
          return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    });

    return cleanup;
  }, [isConnected, open, lead?.id, onEvent]);

  const loadMessages = async () => {
    if (!lead?.id) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/messages/student/${lead.id}`);
      if (response.data.success) {
        const loadedMessages = response.data.data || [];
        setMessages(loadedMessages);
        
        // Find receiver (counselor) from lead or existing messages
        let foundReceiverId = lead.counselor?.id;
        
        // If no counselor, try to find from previous messages
        if (!foundReceiverId && loadedMessages.length > 0) {
          // Find the first message where the sender/receiver is a counselor
          const counselorMessage = loadedMessages.find(msg => 
            msg.receiver?.role === 'counselor' || 
            msg.sender?.role === 'counselor'
          );
          
          if (counselorMessage) {
            foundReceiverId = counselorMessage.sender?.role === 'counselor'
              ? counselorMessage.sender.id
              : counselorMessage.receiver?.role === 'counselor'
              ? counselorMessage.receiver.id
              : null;
          }
        }
        
        setReceiverId(foundReceiverId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !lead?.id || sending) return;

    try {
      setSending(true);

      // Determine receiver: use counselor from lead, or receiverId from messages
      let targetReceiverId = lead.counselor?.id || receiverId;
      
      // If still no receiver, try to find from existing messages
      if (!targetReceiverId && messages.length > 0) {
        const counselorMessage = messages.find(msg => 
          msg.receiver?.role === 'counselor' || 
          msg.sender?.role === 'counselor'
        );
        
        if (counselorMessage) {
          targetReceiverId = counselorMessage.sender?.role === 'counselor'
            ? counselorMessage.sender.id
            : counselorMessage.receiver?.role === 'counselor'
            ? counselorMessage.receiver.id
            : null;
        }
      }
      
      // Send message - backend will automatically determine the receiver if targetReceiverId is not provided
      const requestBody = {
        studentId: lead.id,
        message: newMessage.trim()
      };
      
      // Only include receiverId if we have a valid one
      // Backend will auto-find a counselor if not provided
      if (targetReceiverId) {
        requestBody.receiverId = targetReceiverId;
      }
      
      const response = await axiosInstance.post('/messages', requestBody);

      if (response.data.success) {
        // Add message to local state immediately for instant feedback
        setMessages(prev => {
          const updated = [...prev, response.data.data];
          return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        setNewMessage('');
        // Update receiverId for future messages
        if (!receiverId && targetReceiverId) {
          setReceiverId(targetReceiverId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      alert(errorMessage);
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
    if (!lead) return null;
    if (lead.counselor) return lead.counselor;
    
    // Try to find from messages
    if (messages.length > 0) {
      const counselorMessage = messages.find(msg => 
        msg.receiver?.role === 'counselor' || 
        msg.sender?.role === 'counselor'
      );
      
      if (counselorMessage) {
        return counselorMessage.sender?.role === 'counselor'
          ? counselorMessage.sender
          : counselorMessage.receiver?.role === 'counselor'
          ? counselorMessage.receiver
          : null;
      }
    }
    
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
                {lead?.firstName} {lead?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {otherParticipant ? `Chat with ${otherParticipant.name} (Counselor)` : 'Chat with Counselor'}
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
                    key={message.id || `${message.createdAt}-${message.message}`}
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
                        {message.sender?.name?.charAt(0) || 'C'}
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
                        {user?.name?.charAt(0) || 'M'}
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
          disabled={sending}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadChat;

