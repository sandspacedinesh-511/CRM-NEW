import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
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
  Container,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import {
  GroupAdd as GroupAddIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Campaign as CampaignIcon,
  Refresh as RefreshIcon,
  Insights as InsightsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  PeopleAlt as PeopleAltIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';

import { fetchMarketingDashboard } from '../../services/marketingService';

const PhaseName = (phase) => {
  if (!phase) {
    return 'Uncategorised';
  }
  return phase
    .split('_')
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');
};

const toTitleCase = (value) => {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .split(/[\s_]+/)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');
};

const GrowthChip = ({ delta }) => {
  if (delta == null) {
    return <Chip label="No baseline" size="small" />;
  }
  const isPositive = delta >= 0;
  const icon = isPositive ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
  return (
    <Chip
      icon={icon}
      label={`${isPositive ? '+' : ''}${delta}%`}
      color={isPositive ? 'success' : 'error'}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

const StatCard = ({ icon, value, title, color, subtitle }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.15)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.04)} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.18),
              color,
              width: 48,
              height: 48,
              border: `2px solid ${alpha(color, 0.25)}`,
              boxShadow: `0 6px 16px ${alpha(color, 0.35)}`
            }}
          >
            {icon}
          </Avatar>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
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

function MarketingDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const loadData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const response = await fetchMarketingDashboard();
        setDashboardData(response?.data ?? response);
      } catch (apiError) {
        console.error('Failed to load marketing dashboard:', apiError);
        setError('Unable to load marketing insights currently. Please try refreshing.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) {
      return () => {};
    }
    const interval = setInterval(() => {
      loadData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const stats = dashboardData?.stats ?? {};
  const leadTrend = dashboardData?.leadTrend ?? [];
  const phaseDistribution = dashboardData?.phaseDistribution ?? [];
  const engagement = dashboardData?.engagement ?? {};
  const recentLeads = dashboardData?.recentLeads ?? [];
  const insights = dashboardData?.insights ?? {};
  const conversionTrend = insights.conversionTrend ?? [];
  const leadAging = insights.leadAging ?? [];
  const topUniversities = insights.topUniversities ?? [];
  const topCourses = insights.topCourses ?? [];
  const teamPerformance = insights.teamPerformance ?? [];
  const recentActivities = insights.recentActivities ?? [];

  const totalEngagementEvents = useMemo(() => {
    return Object.values(engagement).reduce((acc, value) => acc + value, 0);
  }, [engagement]);

  const trendChartData = useMemo(() => {
    return leadTrend.map((entry, index) => ({
      month: entry.month,
      leads: entry.total,
      conversions: conversionTrend[index]?.total ?? 0
    }));
  }, [leadTrend, conversionTrend]);

  const leadAgingTotal = useMemo(
    () => leadAging.reduce((acc, bucket) => acc + bucket.total, 0),
    [leadAging]
  );

  const prevWeekDailyAverage = useMemo(() => {
    if (stats.leadsPrevWeek == null) {
      return null;
    }
    return Math.round(stats.leadsPrevWeek / 7);
  }, [stats.leadsPrevWeek]);

  const leadsToday = stats.leadsToday ?? 0;
  const leadsThisWeek = stats.leadsThisWeek ?? 0;
  const leadsThisMonth = stats.leadsThisMonth ?? 0;
  const leadsPrevWeek = stats.leadsPrevWeek ?? 0;
  const leadsPrevMonth = stats.leadsPrevMonth ?? 0;
  const weekOverWeekGrowth = stats.weekOverWeekGrowth ?? null;
  const monthOverMonthGrowth = stats.monthOverMonthGrowth ?? null;
  const dailyDelta = useMemo(() => {
    if (prevWeekDailyAverage == null) {
      return null;
    }
    return leadsToday - prevWeekDailyAverage;
  }, [prevWeekDailyAverage, leadsToday]);

  const engagementRows = [
    {
      key: 'email',
      label: 'Email Outreach',
      value: engagement.email || 0,
      icon: <EmailIcon />,
      color: theme.palette.primary.main
    },
    {
      key: 'documents',
      label: 'Document Touchpoints',
      value: engagement.documents || 0,
      icon: <DescriptionIcon />,
      color: theme.palette.warning.main
    },
    {
      key: 'applications',
      label: 'Application Updates',
      value: engagement.applications || 0,
      icon: <CampaignIcon />,
      color: theme.palette.success.main
    },
    {
      key: 'misc',
      label: 'Other Interactions',
      value: engagement.misc || 0,
      icon: <InsightsIcon />,
      color: theme.palette.info.main
    }
  ];

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
          Loading marketing KPIs...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aggregating lead funnel metrics and campaign engagement
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
            Marketing Intelligence
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Monitor pipeline health, conversion efficiency, and campaign engagement
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
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

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<GroupAddIcon />}
            value={stats.totalLeads ?? 0}
            title="Total Leads"
            subtitle="All captured leads"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PendingActionsIcon />}
            value={stats.activeLeads ?? 0}
            title="Active Leads"
            subtitle="In-progress prospects"
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CheckCircleIcon />}
            value={stats.convertedLeads ?? 0}
            title="Converted"
            subtitle="Successful enrollments"
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CancelIcon />}
            value={stats.lostLeads ?? 0}
            title="Lost / Deferred"
            subtitle="Requires nurturing"
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.18),
                    color: theme.palette.secondary.main
                  }}
                >
                  <TrendingUpIcon />
                </Avatar>
                <Chip
                  label={`${stats.conversionRate ?? 0}%`}
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Conversion Rate
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ratio of total leads that moved to completed enrollment.
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats.conversionRate ?? 0, 100)}
                sx={{
                  height: 8,
                  borderRadius: 20,
                  [`& .MuiLinearProgress-bar`]: {
                    borderRadius: 20,
                    background: theme.palette.secondary.main
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: theme.palette.primary.main
                  }}
                >
                  <AccessTimeIcon />
                </Avatar>
                <Chip
                  label={stats.avgConversionDays != null ? `${stats.avgConversionDays} days` : 'N/A'}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Avg. Time to Convert
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average duration from lead creation to successful enrollment.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: theme.palette.primary.main,
                      width: 40,
                      height: 40
                    }}
                  >
                    <GroupAddIcon />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    New Leads Today
                  </Typography>
                </Stack>
                {dailyDelta != null ? (
                  <Chip
                    label={`${dailyDelta >= 0 ? '+' : ''}${dailyDelta} vs avg`}
                    color={dailyDelta >= 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Chip label="No baseline" size="small" />
                )}
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {leadsToday}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last week daily avg: {prevWeekDailyAverage ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                      color: theme.palette.info.main,
                      width: 40,
                      height: 40
                    }}
                  >
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Leads This Week
                  </Typography>
                </Stack>
                <GrowthChip delta={weekOverWeekGrowth} />
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {leadsThisWeek}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Previous week: {leadsPrevWeek}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.2),
                      color: theme.palette.success.main,
                      width: 40,
                      height: 40
                    }}
                  >
                    <CampaignIcon />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Leads This Month
                  </Typography>
                </Stack>
                <GrowthChip delta={monthOverMonthGrowth} />
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {leadsThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Previous month: {leadsPrevMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Activities</Typography>}
              subheader="Latest marketing interactions across the funnel"
              avatar={
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.15),
                    color: theme.palette.info.main
                  }}
                >
                  <HistoryIcon />
                </Avatar>
              }
            />
            <CardContent>
              {recentActivities.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Team activity will appear here as soon as interactions are logged.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
                  {recentActivities.map((activity, index) => {
                    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
                    const userName = activity.user?.name || 'Marketing';
                    const studentName = activity.student?.name;
                    const activityMeta = [
                      userName,
                      studentName ? `Student: ${studentName}` : null,
                      timestamp
                        ? `${format(timestamp, 'PPpp')} (${formatDistanceToNow(timestamp, { addSuffix: true })})`
                        : 'Just now'
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    return (
                      <Fragment key={activity.id}>
                        <ListItem sx={{ alignItems: 'flex-start', px: 2 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.18),
                                color: theme.palette.info.main
                              }}
                            >
                              {userName.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {activity.description}
                                </Typography>
                                <Chip label={toTitleCase(activity.type)} size="small" variant="outlined" />
                              </Stack>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {activityMeta}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index !== recentActivities.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                      </Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>6-Month Lead Trend</Typography>}
              subheader="Monthly new leads captured"
            />
            <CardContent sx={{ height: 320 }}>
              {trendChartData.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">No lead data captured in the last 6 months.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[6]
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      name="New leads"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#leadGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      name="Conversions"
                      stroke={theme.palette.success.main}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#conversionGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Pipeline Distribution</Typography>}
              subheader="Current phase allocation across leads"
            />
            <CardContent sx={{ height: 320 }}>
              {phaseDistribution.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">No pipeline data available yet.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseDistribution.map((item) => ({ ...item, label: PhaseName(item.phase) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.6)} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={80} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip
                      formatter={(value) => [`${value}`, 'Leads']}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[6]
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Leads" fill={theme.palette.info.main} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Lead Aging</Typography>}
              subheader="How long leads have been in the pipeline"
            />
            <CardContent>
              {leadAgingTotal === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">No active leads awaiting follow-up.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {leadAging.map((bucket) => {
                    const percentage = leadAgingTotal === 0 ? 0 : Math.round((bucket.total / leadAgingTotal) * 100);
                    const chipColor =
                      bucket.key === '30_plus'
                        ? 'error'
                        : bucket.key === '15_30'
                          ? 'warning'
                          : bucket.key === '0_7'
                            ? 'success'
                            : 'info';
                    return (
                      <Box key={bucket.key}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {bucket.label}
                          </Typography>
                          <Chip label={`${bucket.total} • ${percentage}%`} size="small" color={chipColor} variant="outlined" />
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
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Engagement Channels</Typography>}
              subheader="Breakdown of recent marketing touchpoints"
            />
            <CardContent>
              <Stack spacing={3}>
                {engagementRows.map((row) => {
                  const ratio = totalEngagementEvents ? Math.round((row.value / totalEngagementEvents) * 100) : 0;
                  return (
                    <Box key={row.key}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(row.color, 0.18),
                            color: row.color,
                            width: 40,
                            height: 40
                          }}
                        >
                          {row.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {row.label}
                            </Typography>
                            <Chip label={`${row.value}`} size="small" />
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {ratio}% of total interactions
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={ratio}
                        sx={{
                          height: 8,
                          borderRadius: 20,
                          [`& .MuiLinearProgress-bar`]: {
                            borderRadius: 20,
                            background: row.color
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Top Preferences</Typography>}
              subheader="Most requested universities and courses"
            />
            <CardContent>
              {topUniversities.length === 0 && topCourses.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">Preference data will appear once leads provide their interests.</Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            color: theme.palette.primary.main,
                            width: 40,
                            height: 40
                          }}
                        >
                          <SchoolIcon />
                        </Avatar>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Universities
                        </Typography>
                      </Stack>
                      {topUniversities.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No university preferences recorded.
                        </Typography>
                      ) : (
                        topUniversities.map((item) => (
                          <Stack
                            key={item.name || 'unknown-university'}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.name || 'Not specified'}
                            </Typography>
                            <Chip label={item.total} size="small" />
                          </Stack>
                        ))
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.15),
                            color: theme.palette.secondary.main,
                            width: 40,
                            height: 40
                          }}
                        >
                          <MenuBookIcon />
                        </Avatar>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Courses
                        </Typography>
                      </Stack>
                      {topCourses.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No course preferences recorded.
                        </Typography>
                      ) : (
                        topCourses.map((item) => (
                          <Stack
                            key={item.name || 'unknown-course'}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.name || 'Not specified'}
                            </Typography>
                            <Chip label={item.total} size="small" />
                          </Stack>
                        ))
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Team Performance</Typography>}
              subheader="Marketing touchpoints by team members"
              avatar={
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    color: theme.palette.secondary.main
                  }}
                >
                  <PeopleAltIcon />
                </Avatar>
              }
            />
            <CardContent>
              {teamPerformance.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">No marketing activities logged yet.</Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 320, overflow: 'auto', px: 0 }}>
                  {teamPerformance.map((member, index) => {
                    const initials = member.name
                      ? member.name
                          .split(' ')
                          .map((part) => part.charAt(0))
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'MT';
                    return (
                      <Fragment key={member.userId || `member-${index}`}>
                        <ListItem sx={{ alignItems: 'flex-start', px: 2 }}>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: alpha(theme.palette.secondary.main, 0.18),
                                color: theme.palette.secondary.main
                              }}
                            >
                              {initials}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {member.name || 'Marketing Team Member'}
                                </Typography>
                                <Chip
                                  label={`${member.activityCount} interactions`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </Stack>
                            }
                            secondary={
                              member.email ? (
                                <Typography variant="body2" color="text.secondary">
                                  {member.email}
                                </Typography>
                              ) : null
                            }
                          />
                        </ListItem>
                        {index !== teamPerformance.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                      </Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Leads</Typography>}
              subheader="Latest prospects entering the funnel"
            />
            <CardContent>
              {recentLeads.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">Leads will appear here as soon as they are captured.</Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 360, overflow: 'auto', px: 0 }}>
                  {recentLeads.map((lead) => {
                    const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
                    return (
                      <ListItem key={lead.id} sx={{ px: 2, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.18),
                              color: theme.palette.primary.main
                            }}
                          >
                            {lead.name ? lead.name.charAt(0) : 'L'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {lead.name || 'Unnamed Lead'}
                              </Typography>
                              <Chip
                                label={lead.status || 'ACTIVE'}
                                size="small"
                                color={
                                  lead.status === 'COMPLETED'
                                    ? 'success'
                                    : lead.status === 'REJECTED'
                                      ? 'error'
                                      : 'default'
                                }
                              />
                              <Chip
                                label={PhaseName(lead.currentPhase)}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {lead.email ? `${lead.email} · ` : ''}
                              {lead.phone ? `${lead.phone} · ` : ''}
                              {createdDate
                                ? `${format(createdDate, 'PPpp')} (${formatDistanceToNow(createdDate, { addSuffix: true })})`
                                : 'Just now'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default MarketingDashboard;

