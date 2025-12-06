import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  School as ApplicationIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import axiosInstance from '../../utils/axios';

const typeIconMap = {
  application: <ApplicationIcon />,
  document: <DocumentIcon />,
  task: <TaskIcon />,
  system: <InfoIcon />,
  lead_assignment: <TaskIcon />,
  info: <InfoIcon />,
  reminder: <ScheduleIcon />,
  application_update: <ApplicationIcon />,
  application_progress: <ApplicationIcon />
};

function MarketingNotifications() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
    
    // Set up real-time polling for notifications (every 10 seconds)
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notif =>
          axiosInstance.patch(`/notifications/${notif.id}/read`)
        )
      );
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
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

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.leadId) {
      // Navigate to lead details if available
      // This would depend on your routing structure
    }
  };

  const filteredNotifications = () => {
    switch (tabValue) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(n => !n.isRead);
      case 2: // Read
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Notifications
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Stay updated with all your marketing activities and updates
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
            >
              Mark All Read
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab
              label={
                <Badge badgeContent={notifications.length} color="primary">
                  All
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Unread
                </Badge>
              }
            />
            <Tab label="Read" />
          </Tabs>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {filteredNotifications().length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notifications found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 1
                  ? 'You have no unread notifications.'
                  : 'You have no notifications yet.'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ px: 0 }}>
              {filteredNotifications().map((notification, index) => {
                const isUnread = !notification.isRead;
                const notificationDate = notification.createdAt
                  ? new Date(notification.createdAt)
                  : null;
                // Check if this is a reminder notification
                const isReminder = notification.type === 'reminder' && notification.scheduledTime;
                const scheduledDate = isReminder && notification.scheduledTime 
                  ? new Date(notification.scheduledTime)
                  : null;

                return (
                  <Box key={notification.id}>
                    <ListItem
                      sx={{
                        alignItems: 'flex-start',
                        px: 2,
                        py: 2,
                        cursor: 'pointer',
                        backgroundColor: isUnread
                          ? alpha(theme.palette.primary.main, 0.05)
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08)
                        }
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: isUnread
                              ? theme.palette.primary.main
                              : alpha(theme.palette.primary.main, 0.2),
                            color: isUnread ? 'white' : theme.palette.primary.main
                          }}
                        >
                          {typeIconMap[notification.type] || <InfoIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: isUnread ? 700 : 600, flex: 1 }}
                            >
                              {notification.title || 'Notification'}
                            </Typography>
                            {isUnread && (
                              <Chip
                                label="New"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {isReminder && (
                              <Chip 
                                label="Reminder" 
                                size="small" 
                                color="warning" 
                                icon={<ScheduleIcon />}
                                sx={{ height: 20, fontSize: '0.7rem' }} 
                              />
                            )}
                            <Chip
                              label={notification.priority || 'medium'}
                              size="small"
                              color={
                                notification.priority === 'high'
                                  ? 'error'
                                  : notification.priority === 'medium'
                                    ? 'warning'
                                    : 'default'
                              }
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Stack>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                              {notification.message}
                            </Typography>
                            {isReminder && scheduledDate && (
                              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', fontWeight: 600, mt: 0.5 }}>
                                Scheduled: {format(scheduledDate, 'PPpp')}
                              </Typography>
                            )}
                            {notificationDate && (
                              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                                {format(notificationDate, 'PPp')} (
                                {formatDistanceToNow(notificationDate, { addSuffix: true })})
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <Stack direction="row" spacing={0.5}>
                        {isUnread && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.success.main, 0.2)
                                }
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
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
    </Container>
  );
}

export default MarketingNotifications;

