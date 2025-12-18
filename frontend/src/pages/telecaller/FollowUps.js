import { useCallback, useEffect, useState, Fragment } from 'react';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTelecallerDashboard,
  updateImportedTelecallerTask,
  logTelecallerCallInitiated
} from '../../services/telecallerService';

const FollowUps = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, joinRoom, onEvent } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCall = (phoneNumber, meta = {}) => {
    if (!phoneNumber) {
      showToast('No phone number available for this lead.', 'error');
      return;
    }

    // Fire-and-forget logging so that Recent Call Activities update via websocket
    logTelecallerCallInitiated({
      phone: phoneNumber,
      ...meta
    }).catch((error) => {
      console.error('Failed to log call initiation:', error);
      // Do not block the actual call if logging fails
    });

    try {
      window.location.href = `tel:${phoneNumber}`;
    } catch (err) {
      console.error('Failed to initiate call:', err);
      showToast('Unable to start the call on this device.', 'error');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTelecallerDashboard();
      setDashboardData(response?.data ?? response);
    } catch (apiError) {
      console.error('Failed to load follow-ups:', apiError);
      setError('Unable to load follow-ups. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isConnected && user?.role === 'telecaller') {
      joinRoom(`telecaller:${user.id}`);
    }
  }, [isConnected, joinRoom, user]);

  useEffect(() => {
    if (!isConnected) return undefined;
    const cleanup = onEvent('telecaller_task_updated', () => loadData());
    return () => cleanup?.();
  }, [isConnected, onEvent, loadData]);

  const importedFollowUps = dashboardData?.importedFollowUps ?? [];
  const callbacks = dashboardData?.callbacks ?? [];

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleRemoveImportedFollowUp = async (item) => {
    if (!item?.id) return;
    setActionLoading(true);
    try {
      await updateImportedTelecallerTask(item.id, { callStatus: "don't follow up" });
      showToast("Removed from follow-ups.");
      await loadData();
    } catch (apiError) {
      console.error('Failed to remove imported follow-up:', apiError);
      showToast(
        apiError.response?.data?.message || 'Failed to remove follow-up. Please try again.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCallback = async (item) => {
    if (!item?.id) return;
    setActionLoading(true);
    try {
      await updateImportedTelecallerTask(item.id, { callbackDateTime: null });
      showToast('Callback deleted successfully.');
      await loadData();
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

  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {importedFollowUps.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Follow-ups from Imported Tasks"
            subheader="Leads you marked as follow up from imported call lists"
          />
          <CardContent>
            <List sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
              {importedFollowUps.map((item) => (
                <Fragment key={item.id}>
                  <ListItem alignItems="flex-start" sx={{ gap: 2 }}>
                    <ListItemAvatar>
                      <IconButton
                        onClick={() =>
                          handleCall(item.contactNumber, {
                            importedTaskId: item.id,
                            name: item.name,
                            source: 'IMPORTED_FOLLOW_UP'
                          })
                        }
                        disabled={!item.contactNumber}
                        sx={{ p: 0 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: theme.palette.primary.main
                          }}
                        >
                          <PhoneIcon />
                        </Avatar>
                      </IconButton>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {item.name || 'Imported lead'}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.75} sx={{ mt: 1 }}>
                          {item.contactNumber && (
                            <Typography variant="body2" color="text.secondary">
                              Contact: {item.contactNumber}
                            </Typography>
                          )}
                          {item.emailId && (
                            <Typography variant="body2" color="text.secondary">
                              Email: {item.emailId}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Call Status: {item.callStatus || '-'}
                            {item.leadStatus ? ` • Lead Status: ${item.leadStatus}` : ''}
                          </Typography>
                          {item.interestedCountry && (
                            <Typography variant="body2" color="text.secondary">
                              Interested country: {item.interestedCountry}
                            </Typography>
                          )}
                          {item.services && (
                            <Typography variant="body2" color="text.secondary">
                              Services: {item.services}
                            </Typography>
                          )}
                          {item.comments && (
                            <Typography variant="body2" color="text.secondary">
                              Comments: {item.comments}
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
                        onClick={() => handleRemoveImportedFollowUp(item)}
                        disabled={actionLoading}
                        sx={{ textTransform: 'none' }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {callbacks.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="Callbacks"
            subheader="Scheduled callbacks from your imported tasks"
            avatar={
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: theme.palette.warning.main
                }}
              >
                <ScheduleIcon />
              </Avatar>
            }
          />
          <CardContent>
            <List sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
              {callbacks.map((item) => {
                const callbackDate = item.callbackDateTime ? new Date(item.callbackDateTime) : null;
                const isOverdue = callbackDate && isPast(callbackDate) && !isToday(callbackDate);
                const isTodayCallback = callbackDate && isToday(callbackDate);
                
                return (
                  <Fragment key={item.id}>
                    <ListItem alignItems="flex-start" sx={{ gap: 2 }}>
                      <ListItemAvatar>
                        <IconButton
                          onClick={() =>
                            handleCall(item.contactNumber, {
                              importedTaskId: item.id,
                              name: item.name,
                              source: 'CALLBACK'
                            })
                          }
                          disabled={!item.contactNumber}
                          sx={{ p: 0 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: isOverdue
                                ? alpha(theme.palette.error.main, 0.12)
                                : isTodayCallback
                                  ? alpha(theme.palette.warning.main, 0.12)
                                  : alpha(theme.palette.info.main, 0.12),
                              color: isOverdue
                                ? theme.palette.error.main
                                : isTodayCallback
                                  ? theme.palette.warning.main
                                  : theme.palette.info.main
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
                              {item.name || 'Imported lead'}
                            </Typography>
                            {callbackDate && (
                              <Chip
                                label={
                                  isOverdue
                                    ? 'Overdue'
                                    : isTodayCallback
                                      ? 'Today'
                                      : format(callbackDate, 'MMM dd, yyyy HH:mm')
                                }
                                size="small"
                                color={isOverdue ? 'error' : isTodayCallback ? 'warning' : 'info'}
                                variant={isOverdue ? 'filled' : 'outlined'}
                                icon={<ScheduleIcon />}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.75} sx={{ mt: 1 }}>
                            {callbackDate && (
                              <Typography
                                variant="body2"
                                color={isOverdue ? 'error.main' : isTodayCallback ? 'warning.main' : 'text.secondary'}
                                sx={{ fontWeight: isOverdue || isTodayCallback ? 600 : 400 }}
                              >
                                Callback: {format(callbackDate, 'PPpp')}
                                {isOverdue && ` (${formatDistanceToNow(callbackDate)} ago)`}
                                {isTodayCallback && !isOverdue && ' (Today)'}
                                {!isTodayCallback && !isOverdue && ` (${formatDistanceToNow(callbackDate, { addSuffix: true })})`}
                              </Typography>
                            )}
                            {item.contactNumber && (
                              <Typography variant="body2" color="text.secondary">
                                Contact: {item.contactNumber}
                              </Typography>
                            )}
                            {item.emailId && (
                              <Typography variant="body2" color="text.secondary">
                                Email: {item.emailId}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              Call Status: {item.callStatus || '-'}
                              {item.leadStatus ? ` • Lead Status: ${item.leadStatus}` : ''}
                            </Typography>
                            {item.interestedCountry && (
                              <Typography variant="body2" color="text.secondary">
                                Interested country: {item.interestedCountry}
                              </Typography>
                            )}
                            {item.services && (
                              <Typography variant="body2" color="text.secondary">
                                Services: {item.services}
                              </Typography>
                            )}
                            {item.comments && (
                              <Typography variant="body2" color="text.secondary">
                                Comments: {item.comments}
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
                          onClick={() => handleDeleteCallback(item)}
                          disabled={actionLoading}
                          sx={{ textTransform: 'none' }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </Fragment>
                );
              })}
            </List>
          </CardContent>
        </Card>
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
    </Box>
  );
};

export default FollowUps;
