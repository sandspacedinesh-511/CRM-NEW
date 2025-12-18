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
  Typography
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  School as ApplicationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <NotificationsIcon />
            </Avatar>
          }
          title={
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Notifications
            </Typography>
          }
          subheader="All updates and alerts relevant to your counseling work."
          action={
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ borderRadius: 2 }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          }
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                gap: 2
              }}
            >
              <NotificationsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Loading notifications…
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                gap: 1
              }}
            >
              <NotificationsIcon sx={{ fontSize: 40, color: theme.palette.text.disabled }} />
              <Typography variant="body1" color="text.secondary">
                No notifications right now.
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((n) => (
                <Box key={n.id || n._id || `${n.type}-${n.time}`} sx={{ mb: 1.5 }}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                      backgroundColor: n.isRead
                        ? theme.palette.background.paper
                        : alpha(theme.palette.primary.light, 0.08)
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            n.type === 'application'
                              ? theme.palette.success.main
                              : n.type === 'document'
                                ? theme.palette.info.main
                                : theme.palette.warning.main
                        }}
                      >
                        {typeIconMap[n.type] || <NotificationsIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {n.title || 'Notification'}
                          </Typography>
                          {n.priority && (
                            <Chip
                              size="small"
                              label={n.priority.toUpperCase()}
                              color={
                                n.priority === 'high'
                                  ? 'error'
                                  : n.priority === 'medium'
                                    ? 'warning'
                                    : 'default'
                              }
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {n.message}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                            {n.time
                              ? n.time
                              : n.timestamp
                                ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })
                                : n.createdAt
                                  ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                                  : ''}
                          </Typography>
                          {n.type === 'lead_assignment' && !n.isRead && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
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
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', borderRadius: 2 }}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </Stack>
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
