import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  DoneAll as DoneAllIcon,
  EditCalendar as EditCalendarIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTelecallerDashboard,
  completeTelecallerTask,
  rescheduleTelecallerTask,
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [completeDialog, setCompleteDialog] = useState({
    open: false,
    task: null,
    outcome: '',
    notes: ''
  });
  const [rescheduleDialog, setRescheduleDialog] = useState({
    open: false,
    task: null,
    dueDate: '',
    notes: ''
  });

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

  const filterOptions = dashboardData?.filters ?? { statuses: [], outcomes: [] };
  const callQueue = dashboardData?.callQueue ?? [];
  const outcomeOptions = ['ALL', ...(filterOptions.outcomes || [])];
  const importedFollowUps = dashboardData?.importedFollowUps ?? [];

  const filteredQueue = useMemo(() => {
    return callQueue
      .filter((task) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'COMPLETED') return task.completed;
        return task.status === statusFilter;
      })
      .filter((task) => {
        if (outcomeFilter === 'ALL') return true;
        const outcome = task.callOutcome || 'Pending';
        return outcome === outcomeFilter;
      })
      .filter((task) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.trim().toLowerCase();
        const combined = [
          task.title,
          task.description,
          task.student?.name,
          task.student?.email,
          task.student?.phone
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return combined.includes(term);
      });
  }, [callQueue, statusFilter, outcomeFilter, searchTerm]);

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenCompleteDialog = (task) => {
    const defaultOutcome = outcomeOptions.find((option) => option !== 'ALL') || 'Connected';
    setCompleteDialog({
      open: true,
      task,
      outcome: task.callOutcome || defaultOutcome,
      notes: task.callNotes || ''
    });
  };

  const handleCloseCompleteDialog = () => {
    if (actionLoading) return;
    setCompleteDialog({ open: false, task: null, outcome: '', notes: '' });
  };

  const handleOpenRescheduleDialog = (task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const localIso = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setRescheduleDialog({
      open: true,
      task,
      dueDate: localIso,
      notes: task.callNotes || ''
    });
  };

  const handleCloseRescheduleDialog = () => {
    if (actionLoading) return;
    setRescheduleDialog({ open: false, task: null, dueDate: '', notes: '' });
  };

  const handleCompleteSubmit = async () => {
    const { task, outcome, notes } = completeDialog;
    if (!task || !outcome) {
      showToast('Please select an outcome.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await completeTelecallerTask(task.id, { outcome, notes });
      showToast('Follow-up marked as completed.');
      handleCloseCompleteDialog();
      await loadData();
    } catch (apiError) {
      console.error('Complete follow-up failed:', apiError);
      showToast(apiError.response?.data?.message || 'Failed to complete follow-up.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    const { task, dueDate, notes } = rescheduleDialog;
    if (!task || !dueDate) {
      showToast('Please choose a new date/time.', 'error');
      return;
    }
    const isoDate = new Date(dueDate);
    if (Number.isNaN(isoDate.getTime())) {
      showToast('Invalid date provided.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await rescheduleTelecallerTask(task.id, { dueDate: isoDate.toISOString(), notes });
      showToast('Follow-up rescheduled.');
      handleCloseRescheduleDialog();
      await loadData();
    } catch (apiError) {
      console.error('Reschedule follow-up failed:', apiError);
      showToast(apiError.response?.data?.message || 'Failed to reschedule follow-up.', 'error');
    } finally {
      setActionLoading(false);
    }
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

      <Card>
        <CardHeader
          title="Follow-up Queue"
          subheader="Manage and action your assigned follow-ups"
          action={
            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              {(filterOptions.statuses || []).map((status) => (
                <Chip
                  key={status}
                  label={status}
                  color={statusFilter === status ? 'primary' : 'default'}
                  variant={statusFilter === status ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter(status)}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              {outcomeOptions.map((outcome) => (
                <Chip
                  key={outcome}
                  label={outcome === 'ALL' ? 'All outcomes' : outcome}
                  color={outcomeFilter === outcome ? 'primary' : 'default'}
                  variant={outcomeFilter === outcome ? 'filled' : 'outlined'}
                  onClick={() => setOutcomeFilter(outcome)}
                />
              ))}
            </Stack>
            <TextField
              label="Search follow-ups"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              size="small"
              sx={{ maxWidth: 320 }}
            />

            {filteredQueue.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No follow-ups match the selected filters.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 540, overflow: 'auto', px: 0 }}>
                {filteredQueue.map((task) => {
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                  const dueLabel = dueDate
                    ? formatDistanceToNow(dueDate, { addSuffix: true })
                    : 'No due date';
                  const statusColorMap = {
                    OVERDUE: 'error',
                    TODAY: 'info',
                    UPCOMING: 'default',
                    COMPLETED: 'success',
                    PENDING: 'warning'
                  };
                  const statusColor = statusColorMap[task.status] || 'default';

                  return (
                    <Fragment key={task.id}>
                      <ListItem alignItems="flex-start" sx={{ gap: 2 }}>
                        <ListItemAvatar>
                          <IconButton
                            onClick={() =>
                              handleCall(task.student?.phone, {
                                taskId: task.id,
                                studentId: task.student?.id,
                                name: task.student?.name,
                                source: 'FOLLOW_UP_TASK'
                              })
                            }
                            disabled={!task.student?.phone}
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
                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                {task.title || task.description || 'Follow-up call'}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip label={task.status} color={statusColor} size="small" />
                                {task.completed && (
                                  <Chip
                                    label={task.callOutcome || 'Completed'}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Stack>
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.75} sx={{ mt: 1 }}>
                              {task.student && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>{task.student.name}</strong>
                                  {task.student.phone ? ` · ${task.student.phone}` : ''}
                                  {task.student.email ? ` · ${task.student.email}` : ''}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                Due {dueLabel} · Priority {task.priority} · Attempts {task.attempts || 0}
                              </Typography>
                              {task.notesPreview?.content && (
                                <Typography variant="body2" color="text.secondary">
                                  Latest note: “{task.notesPreview.content}”
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<DoneAllIcon />}
                            onClick={() => handleOpenCompleteDialog(task)}
                            disabled={actionLoading}
                            sx={{ textTransform: 'none' }}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditCalendarIcon />}
                            onClick={() => handleOpenRescheduleDialog(task)}
                            disabled={actionLoading}
                            sx={{ textTransform: 'none' }}
                          >
                            Reschedule
                          </Button>
                        </Stack>
                      </ListItem>
                      <Divider component="li" />
                    </Fragment>
                  );
                })}
              </List>
            )}
          </Stack>
        </CardContent>
      </Card>

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

      <Dialog open={completeDialog.open} onClose={handleCloseCompleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Mark Follow-up Complete</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="followup-outcome">Call outcome</InputLabel>
              <Select
                labelId="followup-outcome"
                value={completeDialog.outcome}
                label="Call outcome"
                onChange={(event) =>
                  setCompleteDialog((prev) => ({ ...prev, outcome: event.target.value }))
                }
              >
                {(filterOptions.outcomes || []).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Call notes"
              multiline
              minRows={3}
              value={completeDialog.notes}
              onChange={(event) =>
                setCompleteDialog((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCompleteSubmit}
            disabled={actionLoading || !completeDialog.outcome}
          >
            {actionLoading ? 'Saving...' : 'Save outcome'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rescheduleDialog.open} onClose={handleCloseRescheduleDialog} fullWidth maxWidth="sm">
        <DialogTitle>Reschedule Follow-up</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Next follow-up"
              type="datetime-local"
              value={rescheduleDialog.dueDate}
              onChange={(event) =>
                setRescheduleDialog((prev) => ({ ...prev, dueDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={rescheduleDialog.notes}
              onChange={(event) =>
                setRescheduleDialog((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRescheduleDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRescheduleSubmit}
            disabled={actionLoading || !rescheduleDialog.dueDate}
          >
            {actionLoading ? 'Saving...' : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>

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
