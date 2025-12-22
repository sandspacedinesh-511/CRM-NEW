import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Badge,
  CircularProgress
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  School as ApplicationIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

import axiosInstance from '../../utils/axios';

const typeIconMap = {
  application: <ApplicationIcon />,
  document: <DocumentIcon />,
  task: <TaskIcon />,
  system: <InfoIcon />,
  lead_assignment: <TaskIcon />
};

function CounselorNotifications() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptedNotification, setAcceptedNotification] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0: Unread, 1: Read, 2: All

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleAcceptAssignment = async (notification) => {
    try {
      if (!notification.id) return;

      // If it's a shared lead with a sharedLeadId, use the new endpoint
      if (notification.sharedLeadId) {
        await axiosInstance.post(`/shared-leads/${notification.sharedLeadId}/accept`);
      } else if (notification.leadId) {
        // Fallback for old notifications or direct assignments
        await axiosInstance.post(`/counselor/leads/${notification.leadId}/accept-assignment`);
      }

      // Mark notification as read
      await axiosInstance.patch(`/notifications/${notification.id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      setAcceptedNotification(notification);
      setAcceptDialogOpen(true);
      loadNotifications(); // Refresh to ensure state is consistent
    } catch (err) {
      console.error('Error accepting assignment:', err);
      // alert('Failed to accept assignment');
    }
  };

  const handleRejectAssignment = async (notification) => {
    try {
      if (!notification.id || !notification.sharedLeadId) return;

      await axiosInstance.post(`/shared-leads/${notification.sharedLeadId}/reject`);

      // Mark notification as read
      await axiosInstance.patch(`/notifications/${notification.id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      loadNotifications();
    } catch (err) {
      console.error('Error rejecting assignment:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axiosInstance.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const filteredNotifications = () => {
    switch (tabValue) {
      case 0: // Unread
        return notifications.filter(n => !n.isRead);
      case 1: // Read
        return notifications.filter(n => n.isRead);
      case 2: // All
        return notifications;
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.filter(n => n.isRead).length;

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '70vh',
          gap: 3
        }}
      >
        <CircularProgress size={64} thickness={4} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Loading notifications...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            Notifications
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Stay updated with all your marketing activities and updates.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            bgcolor: '#03A9F4',
            color: 'white',
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            '&:hover': {
              bgcolor: '#0288D1'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs Section */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
                px: 3
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${theme.palette.primary.main}`
              }
            }}
          >
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="primary" sx={{ '& .MuiBadge-badge': { top: -8, right: -20 } }}>
                  Unread
                </Badge>
              }
            />
            <Tab label="Read" />
            <Tab label="All" />
          </Tabs>
        </Box>
      </Card>

      {/* Notifications List */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {filteredNotifications().length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0
                  ? 'You have no unread notifications.'
                  : tabValue === 1
                  ? 'You have no read notifications.'
                  : 'You have no notifications yet.'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ px: 0 }}>
              {filteredNotifications().map((n, index) => {
                const isUnread = !n.isRead;
                const notificationDate = n.timestamp
                  ? new Date(n.timestamp)
                  : n.createdAt
                    ? new Date(n.createdAt)
                    : null;

                return (
                  <Box key={n.id || n._id || `${n.type}-${n.time}`}>
                    <ListItem
                      sx={{
                        alignItems: 'flex-start',
                        px: 2,
                        py: 2.5,
                        backgroundColor: isUnread
                          ? alpha(theme.palette.primary.main, 0.05)
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: '#4CAF50',
                            color: 'white',
                            width: 48,
                            height: 48
                          }}
                        >
                          {typeIconMap[n.type] || <ApplicationIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: isUnread ? 700 : 600,
                              mb: 0.5,
                              color: 'text.primary'
                            }}
                          >
                            {n.title || 'Notification'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              component="span" 
                              sx={{ display: 'block', mb: 1 }}
                            >
                              {n.message}
                            </Typography>
                            {notificationDate && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                component="span" 
                                sx={{ display: 'block' }}
                              >
                                {format(notificationDate, 'MMM d, yyyy, h:mm a')} (
                                {formatDistanceToNow(notificationDate, { addSuffix: true })})
                              </Typography>
                            )}
                            {n.type === 'lead_assignment' && !n.isRead && (
                              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  sx={{ textTransform: 'none', borderRadius: 2 }}
                                  onClick={() => handleAcceptAssignment(n)}
                                >
                                  Accept Lead
                                </Button>
                                {n.sharedLeadId && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ textTransform: 'none', borderRadius: 2 }}
                                    onClick={() => handleRejectAssignment(n)}
                                  >
                                    Reject
                                  </Button>
                                )}
                              </Stack>
                            )}
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        sx={{ flex: 1 }}
                      />
                      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ ml: 2 }}>
                        {n.priority && (
                          <Chip
                            label={n.priority}
                            size="small"
                            sx={{
                              bgcolor: n.priority === 'high'
                                ? theme.palette.error.main
                                : n.priority === 'medium'
                                  ? '#FFC107'
                                  : theme.palette.grey[400],
                              color: n.priority === 'high' || n.priority === 'medium' ? 'white' : 'text.primary',
                              fontWeight: 600,
                              height: 24,
                              fontSize: '0.75rem',
                              borderRadius: '12px'
                            }}
                          />
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(n.id || n._id)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              color: theme.palette.error.main,
                              width: 32,
                              height: 32,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2)
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItem>
                    {index !== filteredNotifications().length - 1 && (
                      <Divider component="li" sx={{ mx: 2 }} />
                    )}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Lead Accepted</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {acceptedNotification?.message ||
              'The lead has been accepted and linked to your counselor profile.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can manage this lead from your students list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setAcceptDialogOpen(false);
              navigate('/counselor/students');
            }}
          >
            Go to Students
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default CounselorNotifications;
