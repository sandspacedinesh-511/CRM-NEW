import { useEffect, useMemo, useState, useCallback, Fragment } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Switch,
  Tooltip,
  Typography,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
  Call as CallIcon,
  Assignment as AssignmentIcon,
  EditCalendar as EditCalendarIcon,
  DoneAll as DoneAllIcon,
  NotificationImportant as NotificationImportantIcon,
  Flag as FlagIcon,
  PhoneMissed as PhoneMissedIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import useWebSocket from '../../hooks/useWebSocket';
import {
  fetchTelecallerDashboard,
  completeTelecallerTask,
  rescheduleTelecallerTask
} from '../../services/telecallerService';

const CALL_OUTCOME_COLORS = ['#1E88E5', '#43A047', '#F4511E', '#8E24AA', '#FB8C00', '#3949AB'];
const PRIORITY_CHIP_COLOR_MAP = {
  URGENT: 'error',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'success'
};

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.05)} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.15),
              color,
              width: 48,
              height: 48,
              boxShadow: `0 6px 18px ${alpha(color, 0.35)}`,
              border: `2px solid ${alpha(color, 0.25)}`
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
            {subtitle}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color, mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

function TelecallerDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, joinRoom, onEvent } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
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

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const response = await fetchTelecallerDashboard();
      setDashboardData(response?.data ?? response);
    } catch (apiError) {
      console.error('Failed to load telecaller dashboard:', apiError);
      setError('Unable to fetch telecalling metrics right now. Please try again in a moment.');
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
    if (!autoRefresh) {
      return () => { };
    }
    const interval = setInterval(() => {
      loadData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  useEffect(() => {
    if (isConnected && user?.role === 'telecaller') {
      joinRoom(`telecaller:${user.id}`);
    }
  }, [isConnected, joinRoom, user]);

  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }
    const cleanup = onEvent('telecaller_task_updated', () => {
      loadData(false);
    });
    return () => {
      cleanup?.();
    };
  }, [isConnected, onEvent, loadData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const filterOptions =
    dashboardData?.filters ??
    {
      statuses: ['ALL', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'],
      outcomes: [],
      priorities: ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
    };
  const callQueue = dashboardData?.callQueue ?? [];
  const callVolume = dashboardData?.callVolume ?? [];
  const callOutcomeSummary = dashboardData?.callOutcomes ?? { completed: 0, pending: 0, overdue: 0, byOutcome: [] };
  const activityFeed = dashboardData?.activityFeed ?? [];
  const engagementAlerts = dashboardData?.engagementAlerts ?? [];
  const importedFollowUps = dashboardData?.importedFollowUps ?? [];

  const outcomeOptions = ['ALL', ...(filterOptions.outcomes || [])];
  const priorityOptions = ['ALL', ...(filterOptions.priorities || [])];
  const insights = dashboardData?.insights ?? {};
  const prioritySummary = insights.prioritySummary ?? [];
  const workloadAging = insights.workloadAging ?? [];
  const nextFollowUp = insights.nextFollowUp ?? null;

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

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCompleteSubmit = async () => {
    const { task, outcome, notes } = completeDialog;
    if (!task || !outcome) {
      showToast('Please select an outcome before saving.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await completeTelecallerTask(task.id, {
        outcome,
        notes
      });
      showToast('Follow-up marked as complete.');
      handleCloseCompleteDialog();
      await loadData(false);
    } catch (apiError) {
      console.error('Failed to complete follow-up:', apiError);
      showToast(
        apiError.response?.data?.message || 'Failed to complete follow-up. Please try again.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    const { task, dueDate, notes } = rescheduleDialog;
    if (!task || !dueDate) {
      showToast('Please select a new date to reschedule.', 'error');
      return;
    }
    const isoDate = new Date(dueDate);
    if (Number.isNaN(isoDate.getTime())) {
      showToast('Invalid date provided. Please choose a valid date/time.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await rescheduleTelecallerTask(task.id, {
        dueDate: isoDate.toISOString(),
        notes
      });
      showToast('Follow-up rescheduled.');
      handleCloseRescheduleDialog();
      await loadData(false);
    } catch (apiError) {
      console.error('Failed to reschedule follow-up:', apiError);
      showToast(
        apiError.response?.data?.message || 'Failed to reschedule follow-up. Please try again.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const stats = dashboardData?.stats ?? {};
  const scheduledToday =
    typeof stats.importedTasksToday === 'number'
      ? stats.importedTasksToday
      : stats.todayFollowUps ?? 0;
  const pendingCalls =
    typeof stats.pendingImportedCalls === 'number'
      ? stats.pendingImportedCalls
      : stats.pendingFollowUps ?? 0;
  const completedCalls =
    typeof stats.importedCompletedCalls === 'number'
      ? stats.importedCompletedCalls
      : stats.completedFollowUps ?? 0;
  const totalPendingCalls =
    typeof stats.totalPendingImportedCalls === 'number' ? stats.totalPendingImportedCalls : pendingCalls;
  const noResponseCount = stats.noResponseToday ?? 0;
  const dontFollowUpCount = stats.dontFollowUpToday ?? 0;

  const filteredQueue = useMemo(() => {
    return callQueue
      .filter((task) => {
        if (statusFilter === 'ALL') {
          return true;
        }
        return task.status === statusFilter || (statusFilter === 'COMPLETED' && task.completed);
      })
      .filter((task) => {
        if (outcomeFilter === 'ALL') {
          return true;
        }
        const taskOutcome = task.callOutcome || 'PENDING';
        return taskOutcome === outcomeFilter;
      })
      .filter((task) => {
        if (priorityFilter === 'ALL') {
          return true;
        }
        return (task.priority || '').toUpperCase() === priorityFilter;
      })
      .filter((task) => {
        if (!searchTerm.trim()) {
          return true;
        }
        const term = searchTerm.trim().toLowerCase();
        const haystack = [
          task.title,
          task.description,
          task.student?.name,
          task.student?.email,
          task.student?.phone
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
  }, [callQueue, statusFilter, outcomeFilter, priorityFilter, searchTerm]);

  const outcomeChartData = useMemo(() => {
    return (callOutcomeSummary.byOutcome || []).map((item, index) => ({
      status: item.outcome,
      total: item.total,
      color: CALL_OUTCOME_COLORS[index % CALL_OUTCOME_COLORS.length]
    }));
  }, [callOutcomeSummary]);

  const priorityFillMap = useMemo(
    () => ({
      URGENT: theme.palette.error.main,
      HIGH: theme.palette.warning.main,
      MEDIUM: theme.palette.info.main,
      LOW: theme.palette.success.main
    }),
    [theme]
  );

  const priorityChartData = useMemo(() => {
    return (prioritySummary || []).map((item, index) => ({
      priority: item.priority,
      total: item.total,
      percentage: item.percentage,
      color: CALL_OUTCOME_COLORS[index % CALL_OUTCOME_COLORS.length]
    }));
  }, [prioritySummary]);

  const workloadAgingTotal = useMemo(
    () => (workloadAging || []).reduce((sum, bucket) => sum + bucket.total, 0),
    [workloadAging]
  );

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
          Preparing your telecalling overview...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gathering follow-ups, call queues, and performance metrics
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
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
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
            Telecalling Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Track follow-ups, call outcomes, and daily productivity in real-time
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                color="primary"
              />
            }
            label="Auto refresh"
          />
          <Button
            variant="outlined"
            onClick={handleManualRefresh}
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

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PhoneIcon />}
            title="Total Follow-ups"
            value={importedFollowUps.length}
            subtitle="Assigned to you"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PendingActionsIcon />}
            title="Pending Calls (Today)"
            value={pendingCalls}
            subtitle="Imported calls not yet updated"
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CheckCircleIcon />}
            title="Completed"
            value={completedCalls}
            subtitle="Imported calls updated"
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<TodayIcon />}
            title="Scheduled Today"
            value={scheduledToday}
            subtitle="Imported calls for today"
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<WarningIcon />}
            title="Total Pending Calls"
            value={totalPendingCalls}
            subtitle="All imported calls not yet updated"
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PhoneMissedIcon />}
            title="No Response"
            value={noResponseCount}
            subtitle="Calls marked as no response today"
            color={theme.palette.warning.dark}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<BlockIcon />}
            title="Don't Follow Up"
            value={dontFollowUpCount}
            subtitle="Calls marked as don't follow up today"
            color={theme.palette.error.dark}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  7-Day Call Volume
                </Typography>
              }
              action={
                <Tooltip title="Total follow-ups created each day">
                  <IconButton>
                    <AssignmentIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent sx={{ height: 320 }}>
              {callVolume.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">
                    No call volume recorded for the selected period.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[6]
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total follow-ups" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Call Outcomes
                </Typography>
              }
              subheader="Distribution of completed, pending, and overdue follow-ups"
            />
            <CardContent sx={{ height: 320 }}>
              {outcomeChartData.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">
                    Call outcomes will appear once activity is recorded.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`Pending: ${callOutcomeSummary.pending ?? 0}`} size="small" color="warning" />
                    <Chip label={`Completed: ${callOutcomeSummary.completed ?? 0}`} size="small" color="success" />
                    <Chip label={`Overdue: ${callOutcomeSummary.overdue ?? 0}`} size="small" color="error" />
                  </Stack>
                  <Box sx={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={outcomeChartData}
                          dataKey="total"
                          nameKey="status"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {outcomeChartData.map((entry, index) => (
                            <Cell key={entry.status} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value) => [`${value}`, 'Calls']}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: theme.shadows[6]
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Priority Breakdown
                </Typography>
              }
              subheader="How your current workload is distributed across priority levels"
              action={
                <Tooltip title="Understand where to focus next">
                  <IconButton>
                    <FlagIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent sx={{ height: 320 }}>
              {priorityChartData.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">
                    Priority insights will appear once follow-ups are assigned.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {priorityChartData.map((item) => {
                      const chipColor =
                        PRIORITY_CHIP_COLOR_MAP[item.priority] === 'success'
                          ? 'success'
                          : PRIORITY_CHIP_COLOR_MAP[item.priority];
                      const label = `${item.priority.charAt(0)}${item.priority.slice(1).toLowerCase()}: ${item.total
                        } • ${item.percentage}%`;
                      return (
                        <Chip
                          key={item.priority}
                          label={label}
                          color={chipColor}
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      );
                    })}
                  </Stack>
                  <Box sx={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} />
                        <XAxis dataKey="priority" />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip
                          formatter={(value, name, props) => [`${value}`, 'Follow-ups']}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: theme.shadows[6]
                          }}
                        />
                        <Bar dataKey="total" name="Follow-ups" radius={[8, 8, 0, 0]}>
                          {priorityChartData.map((entry) => (
                            <Cell
                              key={entry.priority}
                              fill={priorityFillMap[entry.priority] || theme.palette.primary.main}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Workload Aging
                </Typography>
              }
              subheader="Track how long pending follow-ups have been waiting"
            />
            <CardContent>
              {workloadAging.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No pending follow-ups — great job staying on top of your queue!
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {workloadAging.map((bucket) => {
                    const percentage =
                      workloadAgingTotal === 0 ? 0 : Math.round((bucket.total / workloadAgingTotal) * 100);
                    return (
                      <Box key={bucket.key}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {bucket.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${bucket.total} • ${percentage}%`}
                            color={bucket.key.includes('overdue') ? 'error' : 'info'}
                            variant="outlined"
                          />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 12,
                            [`& .MuiLinearProgress-bar`]: { borderRadius: 12 }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main
                  }}
                >
                  <CallIcon />
                </Avatar>
              }
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Upcoming Call Queue</Typography>}
              subheader="Prioritized follow-ups for the next actions"
            />
            <CardContent>
              <Stack spacing={2}>
                <Tabs
                  value={statusFilter}
                  onChange={(_, value) => setStatusFilter(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {filterOptions.statuses?.map((status) => (
                    <Tab key={status} value={status} label={status} />
                  ))}
                </Tabs>

                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  {outcomeOptions.map((outcome) => (
                    <Chip
                      key={outcome}
                      label={outcome === 'ALL' ? 'All outcomes' : outcome}
                      color={outcomeFilter === outcome ? 'primary' : 'default'}
                      variant={outcomeFilter === outcome ? 'filled' : 'outlined'}
                      onClick={() => setOutcomeFilter(outcome)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  ))}
                  {priorityOptions.map((priority) => {
                    const isActive = priorityFilter === priority;
                    const color = isActive
                      ? priority === 'ALL'
                        ? 'secondary'
                        : PRIORITY_CHIP_COLOR_MAP[priority] || 'secondary'
                      : 'default';
                    const label =
                      priority === 'ALL'
                        ? 'All priorities'
                        : `${priority.charAt(0)}${priority.slice(1).toLowerCase()} priority`;
                    return (
                      <Chip
                        key={`priority-${priority}`}
                        label={label}
                        color={color}
                        variant={isActive ? 'filled' : 'outlined'}
                        onClick={() => setPriorityFilter(priority)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    );
                  })}
                  <TextField
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    label="Search follow-ups"
                    size="small"
                    sx={{ minWidth: 220, flexGrow: 1, maxWidth: 320 }}
                  />
                </Stack>

                {filteredQueue.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No follow-ups match the selected filters. Adjust your filters or refresh to check for new tasks.
                    </Typography>
                  </Box>
                ) : (
                  <List component="div" sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
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
                      const outcomeLabel = task.callOutcome || 'Pending';
                      const showHighAttempts = (task.attempts || 0) >= 3;

                      return (
                        <Fragment key={task.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              py: 2,
                              px: 2,
                              alignItems: 'flex-start',
                              gap: 2
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main
                                }}
                              >
                                <PhoneIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
                                    {task.title || task.description || 'Follow-up call'}
                                  </Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                                    <Chip
                                      label={
                                        task.priority
                                          ? `${task.priority.charAt(0)}${task.priority.slice(1).toLowerCase()} priority`
                                          : 'Priority'
                                      }
                                      color={PRIORITY_CHIP_COLOR_MAP[task.priority] || 'secondary'}
                                      size="small"
                                      variant="outlined"
                                      sx={{ textTransform: 'capitalize' }}
                                    />
                                    <Chip label={task.status} color={statusColor} size="small" />
                                    {task.completed && (
                                      <Chip
                                        label={outcomeLabel}
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize' }}
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
                                  {showHighAttempts && (
                                    <Typography variant="body2" color="warning.main">
                                      Multiple attempts registered — consider escalating.
                                    </Typography>
                                  )}
                                  {task.notesPreview?.content && (
                                    <Typography variant="body2" color="text.secondary">
                                      Latest note: “{task.notesPreview.content}”
                                    </Typography>
                                  )}
                                  {task.callNotes && !task.notesPreview?.content && (
                                    <Typography variant="body2" color="text.secondary">
                                      Last call note: “{task.callNotes}”
                                    </Typography>
                                  )}
                                </Stack>
                              }
                            />
                            <Stack spacing={1}>
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
                          <Divider component="li" variant="inset" />
                        </Fragment>
                      );
                    })}
                  </List>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Next Follow-up Spotlight</Typography>}
              subheader="The most urgent pending follow-up based on due date"
            />
            {nextFollowUp ? (
              <>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={nextFollowUp.status}
                        color={
                          nextFollowUp.status === 'OVERDUE'
                            ? 'error'
                            : nextFollowUp.status === 'TODAY'
                              ? 'info'
                              : nextFollowUp.status === 'COMPLETED'
                                ? 'success'
                                : 'default'
                        }
                        size="small"
                      />
                      <Chip
                        label={`${nextFollowUp.priority} priority`}
                        color={PRIORITY_CHIP_COLOR_MAP[nextFollowUp.priority] || 'secondary'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Chip label={`Attempts ${nextFollowUp.attempts || 0}`} size="small" color="warning" />
                    </Stack>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {nextFollowUp.title || nextFollowUp.description || 'Follow-up call'}
                      </Typography>
                      {nextFollowUp.student && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {nextFollowUp.student.name}
                          {nextFollowUp.student.phone ? ` · ${nextFollowUp.student.phone}` : ''}
                          {nextFollowUp.student.email ? ` · ${nextFollowUp.student.email}` : ''}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Due{' '}
                        {nextFollowUp.dueDate
                          ? formatDistanceToNow(new Date(nextFollowUp.dueDate), { addSuffix: true })
                          : 'No due date'}{' '}
                        · Last attempted{' '}
                        {nextFollowUp.lastAttemptAt
                          ? formatDistanceToNow(new Date(nextFollowUp.lastAttemptAt), { addSuffix: true })
                          : 'No attempts yet'}
                      </Typography>
                      {nextFollowUp.notesPreview?.content && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Latest note: “{nextFollowUp.notesPreview.content}”
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<DoneAllIcon />}
                    onClick={() => handleOpenCompleteDialog(nextFollowUp)}
                    disabled={actionLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    Complete now
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditCalendarIcon />}
                    onClick={() => handleOpenRescheduleDialog(nextFollowUp)}
                    disabled={actionLoading}
                    sx={{ textTransform: 'none' }}
                  >
                    Reschedule
                  </Button>
                </CardActions>
              </>
            ) : (
              <CardContent>
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    You’re all caught up — no pending follow-ups found.
                  </Typography>
                </Box>
              </CardContent>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Engagement Alerts</Typography>}
              subheader="Potential risks and items that need your attention"
            />
            <CardContent>
              {engagementAlerts.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    All clear for now. Alerts will appear here when follow-ups need special attention.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
                  {engagementAlerts.map((alert) => (
                    <Fragment key={`${alert.type}-${alert.taskId}`}>
                      <ListItem sx={{ alignItems: 'flex-start', px: 2 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                alert.severity === 'warning'
                                  ? alpha(theme.palette.warning.main, 0.15)
                                  : alpha(theme.palette.info.main, 0.15),
                              color:
                                alert.severity === 'warning'
                                  ? theme.palette.warning.main
                                  : theme.palette.info.main
                            }}
                          >
                            <NotificationImportantIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {alert.message}
                            </Typography>
                          }
                          secondary={
                            alert.dueDate ? (
                              <Typography variant="body2" color="text.secondary">
                                Due {formatDistanceToNow(new Date(alert.dueDate), { addSuffix: true })}
                              </Typography>
                            ) : null
                          }
                        />
                      </ListItem>
                      <Divider component="li" variant="inset" />
                    </Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Call Activities</Typography>}
              subheader="Highlights from your latest interactions"
            />
            <CardContent>
              {activityFeed.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Activity updates will appear here after your next calls.
                  </Typography>
                </Box>
              ) : (
                <List component="div" sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
                  {activityFeed.map((activity) => {
                    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
                    const secondaryContent = (
                      <Typography variant="body2" color="text.secondary">
                        {activity.student?.name ? `${activity.student.name} · ` : ''}
                        {timestamp ? format(timestamp, 'PPpp') : 'Just now'}
                        {timestamp && ` (${formatDistanceToNow(timestamp, { addSuffix: true })})`}
                      </Typography>
                    );

                    return (
                      <Fragment key={activity.id}>
                        <ListItem sx={{ alignItems: 'flex-start', px: 2 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.15),
                                color: theme.palette.info.main
                              }}
                            >
                              <AssignmentIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {activity.description}
                              </Typography>
                            }
                            secondary={secondaryContent}
                          />
                        </ListItem>
                        <Divider component="li" variant="inset" />
                      </Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={completeDialog.open} onClose={handleCloseCompleteDialog} fullWidth maxWidth="sm">
        <DialogTitle>Mark Follow-up Complete</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="telecaller-outcome-select">Call outcome</InputLabel>
              <Select
                labelId="telecaller-outcome-select"
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
              placeholder="Capture relevant details from the conversation..."
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
              placeholder="Add context for the next attempt..."
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
    </Container>
  );
}

export default TelecallerDashboard;

