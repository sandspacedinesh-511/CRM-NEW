import { useCallback, useEffect, useState } from 'react';
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
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  Badge,
  Snackbar
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';

import { fetchTelecallerDashboard, updateImportedTelecallerTask } from '../../services/telecallerService';
import axiosInstance from '../../utils/axios';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import { logTelecallerCallInitiated } from '../../services/telecallerService';

function TelecallerNotifications() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, joinRoom, onEvent } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [notifications, setNotifications] = useState([]);

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const [dashboardResponse, notificationsResponse] = await Promise.all([
        fetchTelecallerDashboard(),
        axiosInstance.get('/notifications?limit=50').catch(() => ({ data: { notifications: [] } }))
      ]);

      setDashboardData(dashboardResponse?.data ?? dashboardResponse);
      const notifData = notificationsResponse?.data?.notifications || notificationsResponse?.data || [];
      setNotifications(Array.isArray(notifData) ? notifData : []);
    } catch (apiError) {
      console.error('Failed to load notifications:', apiError);
      setError('Unable to load notifications. Please try again later.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (isConnected && user?.role === 'telecaller') {
      joinRoom(`telecaller:${user.id}`);
    }
  }, [isConnected, joinRoom, user]);

  useEffect(() => {
    if (!isConnected) return undefined;
    const cleanupTask = onEvent('telecaller_task_updated', () => loadData(false));
    const cleanupNotification = onEvent('notification', () => loadData(false));
    return () => {
      cleanupTask?.();
      cleanupNotification?.();
    };
  }, [isConnected, onEvent, loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleCall = (phoneNumber, meta = {}) => {
    if (!phoneNumber) {
      return;
    }

    logTelecallerCallInitiated({
      phone: phoneNumber,
      ...meta
    }).catch((error) => {
      console.error('Failed to log call initiation:', error);
    });

    try {
      window.location.href = `tel:${phoneNumber}`;
    } catch (err) {
      console.error('Failed to initiate call:', err);
    }
  };

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDeleteCallback = async (item) => {
    if (!item?.id) return;
    setActionLoading(true);
    try {
      await updateImportedTelecallerTask(item.id, { callbackDateTime: null });
      showToast('Callback deleted successfully.');
      await loadData(false);
    } catch (apiError) {
      console.error('Failed to delete callback:', apiError);
      showToast(
        apiError.response?.data?.message || 'Failed to delete callback. Please try again.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const callbacks = dashboardData?.callbacks ?? [];
  const recentNotifications = (notifications || []).filter(
    (n) => n.type === 'application_progress' || n.type === 'callback_reminder' || n.type === 'reminder'
  );

  // Sort callbacks: overdue first, then today, then future
  const sortedCallbacks = [...callbacks].sort((a, b) => {
    if (!a.callbackDateTime || !b.callbackDateTime) return 0;
    const dateA = new Date(a.callbackDateTime);
    const dateB = new Date(b.callbackDateTime);
    // const now = new Date(); // Unused

    const aIsOverdue = isPast(dateA) && !isToday(dateA);
    const bIsOverdue = isPast(dateB) && !isToday(dateB);
    const aIsToday = isToday(dateA);
    const bIsToday = isToday(dateB);

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    if (aIsToday && !bIsToday && !aIsOverdue) return -1;
    if (!aIsToday && bIsToday && !bIsOverdue) return 1;

    return dateA - dateB;
  });

  const overdueCallbacks = sortedCallbacks.filter(cb => {
    if (!cb.callbackDateTime) return false;
    const date = new Date(cb.callbackDateTime);
    return isPast(date) && !isToday(date);
  });

  const todayCallbacks = sortedCallbacks.filter(cb => {
    if (!cb.callbackDateTime) return false;
    return isToday(new Date(cb.callbackDateTime));
  });

  const upcomingCallbacks = sortedCallbacks.filter(cb => {
    if (!cb.callbackDateTime) return false;
    const date = new Date(cb.callbackDateTime);
    return !isPast(date) && !isToday(date);
  });

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
          Loading callback notifications...
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Callback Notifications
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            View and manage your scheduled callbacks
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={`${overdueCallbacks.length} Overdue`}
            color="error"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${todayCallbacks.length} Today`}
            color="warning"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${upcomingCallbacks.length} Upcoming`}
            color="info"
            size="small"
            variant="outlined"
          />
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
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

      {/* Recent Notifications (Callbacks & Progress) */}
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
          mb: 3
        }}
      >
        <CardHeader
          avatar={
            <Badge badgeContent={recentNotifications.length} color="info">
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <NotificationsIcon />
              </Avatar>
            </Badge>
          }
          title={
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              Recent Notifications
            </Typography>
          }
          subheader={
            recentNotifications.length > 0
              ? `${recentNotifications.length} new notification${recentNotifications.length === 1 ? '' : 's'}`
              : 'No new notifications'
          }
        />
        <CardContent>
          {recentNotifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No new notifications yet.
            </Typography>
          ) : (
            <List sx={{ px: 0 }}>
              {recentNotifications.map((n, index) => {
                const isCallback = n.type === 'callback_reminder';
                const isReminder = n.type === 'reminder';
                const isProgress = n.type === 'application_progress';

                let icon = <NotificationsIcon />;
                let color = theme.palette.info.main;
                let bgColor = alpha(theme.palette.info.main, 0.05);

                if (isCallback) {
                  icon = <PhoneIcon />;
                  color = theme.palette.warning.main;
                  bgColor = alpha(theme.palette.warning.main, 0.05);
                } else if (isProgress) {
                  icon = <CheckCircleIcon />;
                  color = theme.palette.success.main;
                  bgColor = alpha(theme.palette.success.main, 0.05);
                }

                return (
                  <Box key={n.id || index}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: bgColor
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alpha(color, 0.15),
                            color: color
                          }}
                        >
                          {icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {n.title || (isCallback ? 'Callback Reminder' : 'Notification')}
                            </Typography>
                            {n.metadata?.country && (
                              <Chip
                                label={n.metadata.country}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {isCallback && (
                              <Chip
                                label="Call Now"
                                size="small"
                                color="warning"
                                variant="outlined"
                                onClick={() => n.metadata?.contactNumber && handleCall(n.metadata.contactNumber)}
                                sx={{ cursor: 'pointer' }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {n.message || n.description || 'New update'}
                            </Typography>
                            {n.metadata?.previousPhase && n.metadata?.newPhase && (
                              <Typography variant="body2" color="text.secondary">
                                {`Phase: ${n.metadata.previousPhase.replace(/_/g, ' ')} → ${n.metadata.newPhase.replace(/_/g, ' ')}`}
                              </Typography>
                            )}
                            {n.metadata?.remarks && (
                              <Typography variant="body2" color="text.secondary">
                                Remarks: {n.metadata.remarks}
                              </Typography>
                            )}
                            {isCallback && n.metadata?.scheduledTime && (
                              <Typography variant="caption" color="text.secondary">
                                Scheduled: {format(new Date(n.metadata.scheduledTime), 'PPpp')}
                              </Typography>
                            )}
                            {n.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < recentNotifications.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                )
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {sortedCallbacks.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            boxShadow: '0 10px 30px rgba(15,23,42,0.04)'
          }}
        >
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: alpha(theme.palette.info.main, 0.12),
                color: theme.palette.info.main
              }}
            >
              <ScheduleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              No Callbacks Scheduled
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any scheduled callbacks yet. Set callbacks when editing contact details.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3, textTransform: 'none' }}
              onClick={() => navigate('/telecaller/tasks')}
            >
              Go to Tasks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Overdue Callbacks */}
          {overdueCallbacks.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                boxShadow: '0 10px 30px rgba(15,23,42,0.04)'
              }}
            >
              <CardHeader
                avatar={
                  <Badge badgeContent={overdueCallbacks.length} color="error">
                    <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                      <ScheduleIcon />
                    </Avatar>
                  </Badge>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    Overdue Callbacks
                  </Typography>
                }
                subheader={`${overdueCallbacks.length} callback${overdueCallbacks.length === 1 ? '' : 's'} past due`}
              />
              <CardContent>
                <List sx={{ px: 0 }}>
                  {overdueCallbacks.map((callback, index) => {
                    const callbackDate = callback.callbackDateTime ? new Date(callback.callbackDateTime) : null;
                    return (
                      <Box key={callback.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            bgcolor: alpha(theme.palette.error.main, 0.05),
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <IconButton
                              onClick={() =>
                                handleCall(callback.contactNumber, {
                                  importedTaskId: callback.id,
                                  name: callback.name,
                                  source: 'CALLBACK_NOTIFICATION'
                                })
                              }
                              disabled={!callback.contactNumber}
                              sx={{ p: 0 }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.error.main, 0.12),
                                  color: theme.palette.error.main
                                }}
                              >
                                <PhoneIcon />
                              </Avatar>
                            </IconButton>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {callback.name || 'Contact'}
                                </Typography>
                                <Chip
                                  label="Overdue"
                                  size="small"
                                  color="error"
                                  variant="filled"
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {callbackDate && (
                                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                                    Scheduled: {format(callbackDate, 'PPpp')} ({formatDistanceToNow(callbackDate)} ago)
                                  </Typography>
                                )}
                                {callback.contactNumber && (
                                  <Typography variant="body2" color="text.secondary">
                                    Contact: {callback.contactNumber}
                                  </Typography>
                                )}
                                {callback.emailId && (
                                  <Typography variant="body2" color="text.secondary">
                                    Email: {callback.emailId}
                                  </Typography>
                                )}
                                {callback.comments && (
                                  <Typography variant="body2" color="text.secondary">
                                    Notes: {callback.comments}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteCallback(callback)}
                              disabled={actionLoading}
                              sx={{ textTransform: 'none' }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </ListItem>
                        {index < overdueCallbacks.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Today's Callbacks */}
          {todayCallbacks.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                boxShadow: '0 10px 30px rgba(15,23,42,0.04)'
              }}
            >
              <CardHeader
                avatar={
                  <Badge badgeContent={todayCallbacks.length} color="warning">
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <ScheduleIcon />
                    </Avatar>
                  </Badge>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    Today's Callbacks
                  </Typography>
                }
                subheader={`${todayCallbacks.length} callback${todayCallbacks.length === 1 ? '' : 's'} scheduled for today`}
              />
              <CardContent>
                <List sx={{ px: 0 }}>
                  {todayCallbacks.map((callback, index) => {
                    const callbackDate = callback.callbackDateTime ? new Date(callback.callbackDateTime) : null;
                    return (
                      <Box key={callback.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.warning.main, 0.1)
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <IconButton
                              onClick={() =>
                                handleCall(callback.contactNumber, {
                                  importedTaskId: callback.id,
                                  name: callback.name,
                                  source: 'CALLBACK_NOTIFICATION'
                                })
                              }
                              disabled={!callback.contactNumber}
                              sx={{ p: 0 }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                                  color: theme.palette.warning.main
                                }}
                              >
                                <PhoneIcon />
                              </Avatar>
                            </IconButton>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {callback.name || 'Contact'}
                                </Typography>
                                <Chip
                                  label="Today"
                                  size="small"
                                  color="warning"
                                  variant="filled"
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {callbackDate && (
                                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                                    Scheduled: {format(callbackDate, 'PPpp')}
                                  </Typography>
                                )}
                                {callback.contactNumber && (
                                  <Typography variant="body2" color="text.secondary">
                                    Contact: {callback.contactNumber}
                                  </Typography>
                                )}
                                {callback.emailId && (
                                  <Typography variant="body2" color="text.secondary">
                                    Email: {callback.emailId}
                                  </Typography>
                                )}
                                {callback.comments && (
                                  <Typography variant="body2" color="text.secondary">
                                    Notes: {callback.comments}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteCallback(callback)}
                              disabled={actionLoading}
                              sx={{ textTransform: 'none' }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </ListItem>
                        {index < todayCallbacks.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Callbacks */}
          {upcomingCallbacks.length > 0 && (
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                boxShadow: '0 10px 30px rgba(15,23,42,0.04)'
              }}
            >
              <CardHeader
                avatar={
                  <Badge badgeContent={upcomingCallbacks.length} color="info">
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <ScheduleIcon />
                    </Avatar>
                  </Badge>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    Upcoming Callbacks
                  </Typography>
                }
                subheader={`${upcomingCallbacks.length} callback${upcomingCallbacks.length === 1 ? '' : 's'} scheduled`}
              />
              <CardContent>
                <List sx={{ px: 0 }}>
                  {upcomingCallbacks.map((callback, index) => {
                    const callbackDate = callback.callbackDateTime ? new Date(callback.callbackDateTime) : null;
                    return (
                      <Box key={callback.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.05),
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.info.main, 0.1)
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <IconButton
                              onClick={() =>
                                handleCall(callback.contactNumber, {
                                  importedTaskId: callback.id,
                                  name: callback.name,
                                  source: 'CALLBACK_NOTIFICATION'
                                })
                              }
                              disabled={!callback.contactNumber}
                              sx={{ p: 0 }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.info.main, 0.12),
                                  color: theme.palette.info.main
                                }}
                              >
                                <PhoneIcon />
                              </Avatar>
                            </IconButton>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {callback.name || 'Contact'}
                                </Typography>
                                {callbackDate && (
                                  <Chip
                                    label={format(callbackDate, 'MMM dd, HH:mm')}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                )}
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {callbackDate && (
                                  <Typography variant="body2" color="text.secondary">
                                    Scheduled: {format(callbackDate, 'PPpp')} ({formatDistanceToNow(callbackDate, { addSuffix: true })})
                                  </Typography>
                                )}
                                {callback.contactNumber && (
                                  <Typography variant="body2" color="text.secondary">
                                    Contact: {callback.contactNumber}
                                  </Typography>
                                )}
                                {callback.emailId && (
                                  <Typography variant="body2" color="text.secondary">
                                    Email: {callback.emailId}
                                  </Typography>
                                )}
                                {callback.comments && (
                                  <Typography variant="body2" color="text.secondary">
                                    Notes: {callback.comments}
                                  </Typography>
                                )}
                              </Stack>
                            }
                          />
                          <Box>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteCallback(callback)}
                              disabled={actionLoading}
                              sx={{ textTransform: 'none' }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </ListItem>
                        {index < upcomingCallbacks.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TelecallerNotifications;

