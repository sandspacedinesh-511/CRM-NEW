import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Grid,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import {
  Download as DownloadIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon
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
  Legend,
  BarChart,
  Bar
} from 'recharts';

import { fetchMarketingDashboard } from '../../services/marketingService';

const StatTile = ({ icon, label, value, color, helper }) => {
  const theme = useTheme();
  const paletteColor = theme.palette[color] || theme.palette.primary;
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(paletteColor.main, 0.18)}`,
        background: `linear-gradient(135deg, ${alpha(paletteColor.main, 0.12)} 0%, ${alpha(paletteColor.main, 0.04)} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Avatar
            sx={{
              bgcolor: alpha(paletteColor.main, 0.2),
              color: paletteColor.main,
              width: 48,
              height: 48,
              boxShadow: `0 6px 16px ${alpha(paletteColor.main, 0.35)}`,
              border: `2px solid ${alpha(paletteColor.main, 0.25)}`
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: paletteColor.main }}>
              {value}
            </Typography>
            {helper && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

function MarketingReports() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMarketingDashboard();
      setReportData(response?.data ?? response);
    } catch (apiError) {
      console.error('Failed to load marketing reports:', apiError);
      setError(apiError.response?.data?.message || 'Unable to load marketing reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExportSummary = () => {
    if (!reportData) {
      return;
    }

    const { leadTrend = [], insights = {} } = reportData;
    const conversionTrend = insights.conversionTrend ?? [];

    const csvHeaders = ['Month', 'Leads', 'Conversions'];
    const rows = leadTrend.map((entry, index) => {
      const conversions = conversionTrend[index]?.total ?? 0;
      return [entry.month, entry.total, conversions].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setSnackbar({ open: true, severity: 'success', message: 'Summary export generated successfully.' });
  };

  const stats = reportData?.stats ?? {};
  const leadTrend = reportData?.leadTrend ?? [];
  const insights = reportData?.insights ?? {};
  const conversionTrend = insights.conversionTrend ?? [];
  const phaseDistribution = reportData?.phaseDistribution ?? [];
  const leadAging = insights.leadAging ?? [];
  const topUniversities = insights.topUniversities ?? [];
  const topCourses = insights.topCourses ?? [];

  const trendSeries = useMemo(() => {
    return leadTrend.map((entry, index) => ({
      month: entry.month,
      leads: entry.total,
      conversions: conversionTrend[index]?.total ?? 0
    }));
  }, [leadTrend, conversionTrend]);

  const leadAgingTotal = useMemo(
    () => leadAging.reduce((sum, bucket) => sum + bucket.total, 0),
    [leadAging]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: { xs: 'flex-start', md: 'center' },
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
            Marketing Reports
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Evidence-based insights from real enrollment data to support campaign planning.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportSummary}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Export Summary CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
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
            minHeight: '60vh',
            gap: 3
          }}
        >
          <CircularProgress size={56} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Loading marketing performance reports…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggregating live data on leads, conversions, and student preferences
          </Typography>
        </Box>
      ) : (
        reportData && (
          <Stack spacing={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatTile
                  icon={<TrendingUpIcon />}
                  label="Total Leads"
                  value={stats.totalLeads ?? 0}
                  color="primary"
                  helper={`Month-to-date: ${stats.leadsThisMonth ?? 0}`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatTile
                  icon={<AssessmentIcon />}
                  label="Conversion Rate"
                  value={`${stats.conversionRate ?? 0}%`}
                  color="success"
                  helper={`Avg conversion days: ${stats.avgConversionDays ?? '—'}`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatTile
                  icon={<InsightsIcon />}
                  label="Week-over-week"
                  value={`${stats.weekOverWeekGrowth ?? 0}%`}
                  color={stats.weekOverWeekGrowth >= 0 ? 'success' : 'error'}
                  helper={`This week: ${stats.leadsThisWeek ?? 0}`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatTile
                  icon={<InsightsIcon />}
                  label="Month-over-month"
                  value={`${stats.monthOverMonthGrowth ?? 0}%`}
                  color={stats.monthOverMonthGrowth >= 0 ? 'success' : 'error'}
                  helper={`Last month: ${stats.leadsPrevMonth ?? 0}`}
                />
              </Grid>
            </Grid>

            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Lead vs Conversion Trend</Typography>}
                subheader="Six-month view of lead acquisition and successful enrollments"
              />
              <CardContent sx={{ height: 360 }}>
                {trendSeries.length === 0 ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography color="text.secondary">No trend data recorded for the selected period.</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendSeries}>
                      <defs>
                        <linearGradient id="reportsLeadsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="reportsConversionGradient" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#reportsLeadsGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="conversions"
                        name="Conversions"
                        stroke={theme.palette.success.main}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#reportsConversionGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Phase Distribution</Typography>}
                    subheader="Where leads currently sit in the funnel"
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
                        <Typography color="text.secondary">No phase data available.</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={phaseDistribution.map((item) => ({
                            ...item,
                            label: item.phase ? item.phase.replace(/_/g, ' ') : 'Uncategorised'
                          }))}
                        >
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
                          <Bar dataKey="count" name="Leads" fill={theme.palette.info.main} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Lead Aging</Typography>}
                    subheader="How long current leads have been in the funnel"
                  />
                  <CardContent>
                    {leadAgingTotal === 0 ? (
                      <Typography color="text.secondary">No pending leads to analyse.</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {leadAging.map((bucket) => {
                          const percentage = Math.round((bucket.total / leadAgingTotal) * 100);
                          return (
                            <Box key={bucket.key}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {bucket.label}
                                </Typography>
                                <Chip label={`${bucket.total} • ${percentage}%`} size="small" variant="outlined" />
                              </Stack>
                              <Box
                                sx={{
                                  height: 8,
                                  borderRadius: 12,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    borderRadius: 12,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Top Universities</Typography>}
                    subheader="Most requested destinations from live leads"
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: theme.palette.primary.main
                        }}
                      >
                        <SchoolIcon />
                      </Avatar>
                    }
                  />
                  <CardContent sx={{ px: 0 }}>
                    {topUniversities.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
                        No university preferences recorded yet.
                      </Typography>
                    ) : (
                      <Table size="small" sx={{ px: 3 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>University</TableCell>
                            <TableCell align="right">Leads</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topUniversities.map((item) => (
                            <TableRow key={item.name || 'unknown-university'}>
                              <TableCell>{item.name || 'Not specified'}</TableCell>
                              <TableCell align="right">{item.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader
                    title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Top Courses</Typography>}
                    subheader="Popular programmes requested by prospects"
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.12),
                          color: theme.palette.secondary.main
                        }}
                      >
                        <MenuBookIcon />
                      </Avatar>
                    }
                  />
                  <CardContent sx={{ px: 0 }}>
                    {topCourses.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2 }}>
                        No course preferences captured yet.
                      </Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Course</TableCell>
                            <TableCell align="right">Leads</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topCourses.map((item) => (
                            <TableRow key={item.name || 'unknown-course'}>
                              <TableCell>{item.name || 'Not specified'}</TableCell>
                              <TableCell align="right">{item.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )
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

export default MarketingReports;
