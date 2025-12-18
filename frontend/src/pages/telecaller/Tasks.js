import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
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
  InputLabel,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Switch,
  Grid,
  useMediaQuery
} from '@mui/material';
import {
  DoneAll as DoneAllIcon,
  EditCalendar as EditCalendarIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

import {
  fetchTelecallerTasks,
  completeTelecallerTask,
  rescheduleTelecallerTask,
  importTelecallerTasks,
  fetchImportedTelecallerTasks,
  updateImportedTelecallerTask
} from '../../services/telecallerService';

const STATUS_OPTIONS = ['ALL', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'];
// Only these columns are strictly required in the Excel header row
const REQUIRED_HEADERS = ['S.No', 'Name', 'Contact Number'];

const Tasks = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
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
  const [importedTasks, setImportedTasks] = useState([]);
  const [importError, setImportError] = useState('');
  const [importErrorOpen, setImportErrorOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    rowId: null,
    emailId: '',
    assigned: '',
    callStatus: '',
    leadStatus: '',
    interestedCountry: [],
    services: '',
    comments: '',
    isLead: false,
    callbackDateTime: ''
  });

  // Filters for imported task list
  const [contactFilter, setContactFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // Default the assigned date filter to "today" in the user's local timezone
  const getTodayDateString = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const [assignedDateFilter, setAssignedDateFilter] = useState(getTodayDateString);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTelecallerTasks();
      const payload = response?.data ?? response;
      setTasks(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
    } catch (apiError) {
      console.error('Failed to load telecaller tasks:', apiError);
      setError('Unable to load tasks. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImportedTasks = useCallback(async () => {
    try {
      const response = await fetchImportedTelecallerTasks();
      const payload = response?.data ?? response;
      setImportedTasks(
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      );
    } catch (apiError) {
      console.error('Failed to load imported telecaller tasks:', apiError);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadImportedTasks();
  }, [loadTasks, loadImportedTasks]);

  const filteredImportedTasks = useMemo(() => {
    return importedTasks.filter((row) => {
      // Contact number filter
      if (contactFilter.trim()) {
        const term = contactFilter.trim().toLowerCase();
        if (!(row.contactNumber || '').toLowerCase().includes(term)) {
          return false;
        }
      }

      // Email filter
      if (emailFilter.trim()) {
        const term = emailFilter.trim().toLowerCase();
        if (!(row.emailId || '').toLowerCase().includes(term)) {
          return false;
        }
      }

      // Country filter (Interested country)
      if (countryFilter.trim()) {
        const term = countryFilter.trim().toLowerCase();
        if (!(row.interestedCountry || '').toLowerCase().includes(term)) {
          return false;
        }
      }

      // Assigned date filter uses createdAt (imported date)
      if (assignedDateFilter) {
        if (!row.createdAt) return false;
        const created = new Date(row.createdAt);
        if (Number.isNaN(created.getTime())) return false;
        const localCreated = new Date(created.getTime() - created.getTimezoneOffset() * 60000);
        const createdDateString = localCreated.toISOString().slice(0, 10);
        if (createdDateString !== assignedDateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [importedTasks, contactFilter, emailFilter, countryFilter, assignedDateFilter]);

  const handleClearFilters = () => {
    setContactFilter('');
    setEmailFilter('');
    setCountryFilter('');
    setAssignedDateFilter('');
  };

  const priorityOptions = useMemo(() => {
    const uniques = new Set();
    tasks.forEach((task) => {
      if (task.priority) {
        uniques.add(task.priority.toUpperCase());
      }
    });
    return ['ALL', ...Array.from(uniques)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'COMPLETED') return task.completed;
        return task.status === statusFilter;
      })
      .filter((task) => {
        if (priorityFilter === 'ALL') return true;
        return (task.priority || '').toUpperCase() === priorityFilter;
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
  }, [tasks, statusFilter, priorityFilter, searchTerm]);

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenCompleteDialog = (task) => {
    const defaultOutcome = 'Connected';
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
      showToast('Task marked as completed.');
      handleCloseCompleteDialog();
      await loadTasks();
    } catch (apiError) {
      console.error('Complete task failed:', apiError);
      showToast(apiError.response?.data?.message || 'Failed to complete task.', 'error');
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
      showToast('Task rescheduled.');
      handleCloseRescheduleDialog();
      await loadTasks();
    } catch (apiError) {
      console.error('Reschedule task failed:', apiError);
      showToast(apiError.response?.data?.message || 'Failed to reschedule task.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (event.target) {
      // allow re-selecting the same file
      // eslint-disable-next-line no-param-reassign
      event.target.value = '';
    }

    if (!file) return;

    try {
      const response = await importTelecallerTasks(file);
      showToast(response?.message || 'Tasks imported successfully.');
      await loadImportedTasks();
    } catch (apiError) {
      console.error('Failed to import telecaller tasks:', apiError);
      const data = apiError.response?.data;
      if (data?.missingHeaders && data.missingHeaders.length) {
        const message =
          data.message ||
          `The Excel file is missing required columns: ${data.missingHeaders.join(', ')}`;
        setImportError(message);
        setImportErrorOpen(true);
      } else {
        showToast(
          data?.message || 'Failed to import tasks. Please check the file and try again.',
          'error'
        );
      }
    }
  };

  const openDetailsDialog = (row) => {
    // Parse interestedCountry: if it's a string, split by comma; if array, use as is; otherwise empty array
    let countries = [];
    if (row.interestedCountry) {
      if (Array.isArray(row.interestedCountry)) {
        countries = row.interestedCountry;
      } else if (typeof row.interestedCountry === 'string') {
        // Split by comma and trim each country
        countries = row.interestedCountry.split(',').map(c => c.trim()).filter(c => c.length > 0);
      }
    }

    // Format callbackDateTime for datetime-local input
    let callbackDateTimeValue = '';
    if (row.callbackDateTime) {
      const callbackDate = new Date(row.callbackDateTime);
      const localIso = new Date(callbackDate.getTime() - callbackDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      callbackDateTimeValue = localIso;
    }

    setDetailsDialog({
      open: true,
      rowId: row.id,
      emailId: row.emailId || '',
      assigned: row.assigned || '',
      callStatus: row.callStatus || '',
      leadStatus: row.leadStatus || '',
      interestedCountry: countries,
      services: row.services || '',
      comments: row.comments || '',
      isLead: Boolean(row.isLead),
      callbackDateTime: callbackDateTimeValue
    });
  };

  const closeDetailsDialog = () => {
    if (actionLoading) return;
    setDetailsDialog((prev) => ({
      ...prev,
      open: false,
      rowId: null,
      callbackDateTime: ''
    }));
  };

  const handleDetailsFieldChange = (field) => (event) => {
    const value = event.target.value;
    setDetailsDialog((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDetailsSave = async () => {
    if (!detailsDialog.rowId) {
      closeDetailsDialog();
      return;
    }
    setActionLoading(true);
    try {
      // Convert array of countries to comma-separated string
      const interestedCountryString = Array.isArray(detailsDialog.interestedCountry)
        ? detailsDialog.interestedCountry.join(', ')
        : (detailsDialog.interestedCountry || null);

      // Convert callbackDateTime to ISO string if provided
      let callbackDateTimeISO = null;
      if (detailsDialog.callbackDateTime) {
        const callbackDate = new Date(detailsDialog.callbackDateTime);
        if (!Number.isNaN(callbackDate.getTime())) {
          callbackDateTimeISO = callbackDate.toISOString();
        }
      }

      await updateImportedTelecallerTask(detailsDialog.rowId, {
        emailId: detailsDialog.emailId || null,
        assigned: detailsDialog.assigned || null,
        callStatus: detailsDialog.callStatus || null,
        leadStatus: detailsDialog.leadStatus || null,
        interestedCountry: interestedCountryString,
        services: detailsDialog.services || null,
        comments: detailsDialog.comments || null,
        isLead: detailsDialog.isLead,
        callbackDateTime: callbackDateTimeISO
      });
      showToast('Task details saved successfully.');
      closeDetailsDialog();
      await loadImportedTasks();
    } catch (apiError) {
      console.error('Failed to update imported task details:', apiError);
      showToast(
        apiError.response?.data?.message || 'Failed to save task details. Please try again.',
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
          title="Tasks"
          subheader="View and manage your follow-up tasks"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleImportClick}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Import Tasks
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadTasks}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Refresh
              </Button>
            </Stack>
          }
        />
        <CardContent>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Stack spacing={2}>
            {importedTasks.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Imported Tasks
                </Typography>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ mb: 2, mt: 1 }}
                >
                  <TextField
                    label="Filter by contact number"
                    size="small"
                    value={contactFilter}
                    onChange={(event) => setContactFilter(event.target.value)}
                  />
                  <TextField
                    label="Filter by email"
                    size="small"
                    value={emailFilter}
                    onChange={(event) => setEmailFilter(event.target.value)}
                  />
                  <TextField
                    label="Filter by country"
                    size="small"
                    value={countryFilter}
                    onChange={(event) => setCountryFilter(event.target.value)}
                  />
                  <TextField
                    label="Assigned date"
                    type="date"
                    size="small"
                    value={assignedDateFilter}
                    onChange={(event) => setAssignedDateFilter(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="text"
                    onClick={handleClearFilters}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear filters
                  </Button>
                </Stack>
                {isMobile ? (
                  <Stack spacing={2}>
                    {filteredImportedTasks.map((row) => {
                      const created = row.createdAt ? new Date(row.createdAt) : null;
                      let assignedOnDisplay = '—';
                      if (created && !Number.isNaN(created.getTime())) {
                        const localCreated = new Date(
                          created.getTime() - created.getTimezoneOffset() * 60000
                        );
                        assignedOnDisplay = localCreated.toISOString().slice(0, 10);
                      }

                      return (
                        <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack spacing={1.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {row.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    #{row.sNo} • Assigned: {assignedOnDisplay}
                                  </Typography>
                                </Box>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openDetailsDialog(row)}
                                  sx={{ textTransform: 'none', minWidth: 'auto', px: 2 }}
                                >
                                  Edit
                                </Button>
                              </Box>

                              <Divider />

                              <Grid container spacing={1} alignItems="center">
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Contact
                                  </Typography>
                                  {row.contactNumber ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        component="a"
                                        href={`tel:${row.contactNumber}`}
                                        sx={{
                                          padding: 0.5,
                                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                        }}
                                      >
                                        <PhoneIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                      <Typography variant="body2">{row.contactNumber}</Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2">—</Typography>
                                  )}
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Email
                                  </Typography>
                                  <Typography variant="body2" noWrap sx={{ mt: 0.5 }}>
                                    {row.emailId || '—'}
                                  </Typography>
                                </Grid>
                              </Grid>

                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {row.callStatus && (
                                  <Chip
                                    label={row.callStatus}
                                    size="small"
                                    color={
                                      row.callStatus === 'follow up'
                                        ? 'warning'
                                        : row.callStatus === "don't follow up"
                                          ? 'default'
                                          : 'info'
                                    }
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                )}
                                {row.leadStatus && (
                                  <Chip
                                    label={row.leadStatus}
                                    size="small"
                                    color={
                                      row.leadStatus === 'hot'
                                        ? 'error'
                                        : row.leadStatus === 'warm'
                                          ? 'success'
                                          : 'default'
                                    }
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                )}
                              </Box>

                              {(row.interestedCountry || row.services) && (
                                <Box sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), p: 1, borderRadius: 1 }}>
                                  {row.interestedCountry && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Country: <Box component="span" color="text.primary">{row.interestedCountry}</Box>
                                    </Typography>
                                  )}
                                  {row.services && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Services: <Box component="span" color="text.primary">{row.services}</Box>
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                ) : (
                  <TableContainer
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                      boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
                      overflow: 'hidden'
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                          <TableCell sx={{ fontWeight: 700 }}>S.No</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Contact Number</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Email ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Assigned on</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Call Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Lead Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Interested country</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Services</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredImportedTasks.map((row) => {
                          const created = row.createdAt ? new Date(row.createdAt) : null;
                          let assignedOnDisplay = '—';
                          if (created && !Number.isNaN(created.getTime())) {
                            const localCreated = new Date(
                              created.getTime() - created.getTimezoneOffset() * 60000
                            );
                            assignedOnDisplay = localCreated.toISOString().slice(0, 10);
                          }

                          return (
                            <TableRow
                              key={row.id}
                              hover
                              sx={{
                                '&:nth-of-type(odd)': {
                                  bgcolor: alpha(theme.palette.action.hover, 0.25)
                                }
                              }}
                            >
                              <TableCell>{row.sNo}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>
                                {row.contactNumber ? (
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    component="a"
                                    href={`tel:${row.contactNumber}`}
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>{row.emailId || '—'}</TableCell>
                              <TableCell>{assignedOnDisplay}</TableCell>
                              <TableCell>
                                {row.callStatus ? (
                                  <Chip
                                    label={row.callStatus}
                                    size="small"
                                    color={
                                      row.callStatus === 'follow up'
                                        ? 'warning'
                                        : row.callStatus === "don't follow up"
                                          ? 'default'
                                          : 'info'
                                    }
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>
                                {row.leadStatus ? (
                                  <Chip
                                    label={row.leadStatus}
                                    size="small"
                                    color={
                                      row.leadStatus === 'hot'
                                        ? 'error'
                                        : row.leadStatus === 'warm'
                                          ? 'success'
                                          : 'default'
                                    }
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>{row.interestedCountry || '—'}</TableCell>
                              <TableCell>{row.services || '—'}</TableCell>
                              <TableCell>{row.comments || '—'}</TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() => openDetailsDialog(row)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={completeDialog.open} onClose={handleCloseCompleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Mark Task Complete</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="tasks-outcome">Call outcome</InputLabel>
              <Select
                labelId="tasks-outcome"
                value={completeDialog.outcome}
                label="Call outcome"
                onChange={(event) =>
                  setCompleteDialog((prev) => ({ ...prev, outcome: event.target.value }))
                }
              >
                <MenuItem value="Connected">Connected</MenuItem>
                <MenuItem value="Left Voicemail">Left Voicemail</MenuItem>
                <MenuItem value="No Answer">No Answer</MenuItem>
                <MenuItem value="Callback Requested">Callback Requested</MenuItem>
                <MenuItem value="Wrong Number">Wrong Number</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
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

      <Dialog
        open={importErrorOpen}
        onClose={() => setImportErrorOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Invalid Excel File</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">{importError}</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Required columns
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {REQUIRED_HEADERS.join('  |  ')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportErrorOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailsDialog.open}
        onClose={closeDetailsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Log Call Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={detailsDialog.isLead}
                  onChange={(event) =>
                    setDetailsDialog((prev) => ({ ...prev, isLead: event.target.checked }))
                  }
                  color="primary"
                />
              }
              label="Lead"
            />
            <TextField
              label="Email ID (optional)"
              value={detailsDialog.emailId}
              onChange={handleDetailsFieldChange('emailId')}
              fullWidth
            />
            <TextField
              label="Assigned (optional)"
              value={detailsDialog.assigned}
              onChange={handleDetailsFieldChange('assigned')}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="details-call-status">Call Status</InputLabel>
              <Select
                labelId="details-call-status"
                value={detailsDialog.callStatus}
                label="Call Status"
                onChange={handleDetailsFieldChange('callStatus')}
              >
                <MenuItem value="no response">no response</MenuItem>
                <MenuItem value="don't follow up">don't follow up</MenuItem>
                <MenuItem value="follow up">follow up</MenuItem>
                <MenuItem value="junk">junk</MenuItem>
                <MenuItem value="call rejected">call rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="details-lead-status">Lead Status</InputLabel>
              <Select
                labelId="details-lead-status"
                value={detailsDialog.leadStatus}
                label="Lead Status"
                onChange={handleDetailsFieldChange('leadStatus')}
              >
                <MenuItem value="warm">warm</MenuItem>
                <MenuItem value="hot">hot</MenuItem>
                <MenuItem value="cold">cold</MenuItem>
                <MenuItem value="future">future</MenuItem>
                <MenuItem value="dead">dead</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="details-country">Interested country</InputLabel>
              <Select
                labelId="details-country"
                multiple
                value={detailsDialog.interestedCountry}
                label="Interested country"
                onChange={handleDetailsFieldChange('interestedCountry')}
                renderValue={(selected) => {
                  if (Array.isArray(selected) && selected.length > 0) {
                    return selected.join(', ');
                  }
                  return '';
                }}
              >
                <MenuItem value="USA">USA</MenuItem>
                <MenuItem value="UK">UK</MenuItem>
                <MenuItem value="Germany">Germany</MenuItem>
                <MenuItem value="Canada">Canada</MenuItem>
                <MenuItem value="Australia">Australia</MenuItem>
                <MenuItem value="Ireland">Ireland</MenuItem>
                <MenuItem value="Greece">Greece</MenuItem>
                <MenuItem value="Denmark">Denmark</MenuItem>
                <MenuItem value="Italy">Italy</MenuItem>
                <MenuItem value="France">France</MenuItem>
                <MenuItem value="Finland">Finland</MenuItem>
                <MenuItem value="Singapore">Singapore</MenuItem>
                <MenuItem value="Dubai">Dubai</MenuItem>
                <MenuItem value="Malta">Malta</MenuItem>
                <MenuItem value="others">others</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="details-services">Services</InputLabel>
              <Select
                labelId="details-services"
                value={detailsDialog.services}
                label="Services"
                onChange={handleDetailsFieldChange('services')}
              >
                <MenuItem value="Graduation">Graduation</MenuItem>
                <MenuItem value="UnderGraduation">UnderGraduation</MenuItem>
                <MenuItem value="Bachelors">Bachelors</MenuItem>
                <MenuItem value="visit visa">visit visa</MenuItem>
                <MenuItem value="tourist visa">tourist visa</MenuItem>
                <MenuItem value="work visa">work visa</MenuItem>
                <MenuItem value="Bussiness visa">Bussiness visa</MenuItem>
                <MenuItem value="Canada PR">Canada PR</MenuItem>
                <MenuItem value="Australia PR">Australia PR</MenuItem>
                <MenuItem value="Germany opp card">Germany opp card</MenuItem>
                <MenuItem value="RMS">RMS</MenuItem>
                <MenuItem value="others">others</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Comments"
              multiline
              minRows={3}
              value={detailsDialog.comments}
              onChange={handleDetailsFieldChange('comments')}
              fullWidth
            />
            <TextField
              label="Callback (optional)"
              type="datetime-local"
              value={detailsDialog.callbackDateTime}
              onChange={handleDetailsFieldChange('callbackDateTime')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Set a date and time for callback"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailsDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDetailsSave}
            disabled={actionLoading}
          >
            {actionLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rescheduleDialog.open} onClose={handleCloseRescheduleDialog} fullWidth maxWidth="sm">
        <DialogTitle>Reschedule Task</DialogTitle>
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

export default Tasks;


