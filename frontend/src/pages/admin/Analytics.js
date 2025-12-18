// src/pages/admin/Analytics.js
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  Divider,
  LinearProgress,
  Skeleton,
  CardHeader,
  CardActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Tune as TuneIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  GridView as GridViewIcon,
  List as ListIcon,
  Apps as AppsIcon,
  ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon,
  ViewStream as ViewStreamIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewCarousel as ViewCarouselIcon,
  ViewQuilt as ViewQuiltIcon,
  ViewSidebar as ViewSidebarIcon,
  ViewTimeline as ViewTimelineIcon,
  ViewComfyAlt as ViewComfyAltIcon,
  ViewCompact as ViewCompactIcon,
  ViewCompactAlt as ViewCompactAltIcon,
  ViewCozy as ViewCozyIcon,
  ViewInAr as ViewInArIcon,
  ViewKanban as ViewKanbanIcon,
  ViewListAlt as ViewListAltIcon,
  ViewModuleAlt as ViewModuleAltIcon,
  ViewQuiltAlt as ViewQuiltAltIcon,
  ViewSidebarAlt as ViewSidebarAltIcon,
  ViewTimelineAlt as ViewTimelineAltIcon,
  ViewWeekAlt as ViewWeekAltIcon,
  ViewDayAlt as ViewDayAltIcon,
  ViewAgendaAlt as ViewAgendaAltIcon,
  ViewCarouselAlt as ViewCarouselAltIcon,
  ViewComfyAlt2 as ViewComfyAlt2Icon,
  ViewCompactAlt2 as ViewCompactAlt2Icon,
  ViewCozyAlt as ViewCozyAltIcon,
  ViewInArAlt as ViewInArAltIcon,
  ViewKanbanAlt as ViewKanbanAltIcon,
  ViewListAlt2 as ViewListAlt2Icon,
  ViewModuleAlt2 as ViewModuleAlt2Icon,
  ViewQuiltAlt2 as ViewQuiltAlt2Icon,
  ViewSidebarAlt2 as ViewSidebarAlt2Icon,
  ViewTimelineAlt2 as ViewTimelineAlt2Icon,
  ViewWeekAlt2 as ViewWeekAlt2Icon,
  ViewDayAlt2 as ViewDayAlt2Icon,
  ViewAgendaAlt2 as ViewAgendaAlt2Icon,
  ViewCarouselAlt2 as ViewCarouselAlt2Icon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import axiosInstance from '../../utils/axios';
import CounselorPerformance from '../../components/admin/CounselorPerformance';
import DocumentStats from '../../components/admin/DocumentStats';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function AdminAnalytics() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    phaseDistribution: [],
    monthlyApplications: [],
    universityDistribution: [],
    counselorPerformance: [],
    documentStats: [],
    applicationTrends: []
  });
  const [filters, setFilters] = useState({
    timeRange: '12',
    counselor: 'all',
    university: 'all'
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get('/admin/analytics', {
        params: filters
      });

      setAnalytics(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
  };

  const exportData = async (exportFormat = 'csv') => {
    try {
      console.log('Exporting analytics data:', { exportFormat, filters });
      const response = await axiosInstance.get('/admin/analytics/export', {
        params: { ...filters, format: exportFormat },
        responseType: 'blob'
      });

      console.log('Export response received:', response.status, response.headers);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Failed to export data: ${error.response?.data?.message || error.message}`);
    }
  };

  const ApplicationTrendsChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Application Trends (Last 6 Months)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analytics.applicationTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis
              dataKey="month"
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stackId="1"
              stroke={theme.palette.primary.main}
              fill={alpha(theme.palette.primary.main, 0.3)}
            />
            <Area
              type="monotone"
              dataKey="active"
              stackId="1"
              stroke={theme.palette.warning.main}
              fill={alpha(theme.palette.warning.main, 0.3)}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stackId="1"
              stroke={theme.palette.success.main}
              fill={alpha(theme.palette.success.main, 0.3)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const PhaseDistributionChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Application Phase Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics.phaseDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ currentPhase, percent }) => `${currentPhase} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {analytics.phaseDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const UniversityDistributionChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Top Universities by Applications
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.universityDistribution.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis
              dataKey="name"
              stroke={theme.palette.text.secondary}
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Bar
              dataKey="count"
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const MonthlyApplicationsChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Monthly Applications Trend
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.monthlyApplications}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis
              dataKey="month"
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const SummaryCards = () => {
    const totalStudents = analytics.phaseDistribution.reduce((sum, phase) => sum + phase.count, 0);
    const completedApplications = analytics.phaseDistribution.find(p => p.currentPhase === 'CAS_VISA')?.count || 0;
    const activeApplications = analytics.phaseDistribution.filter(p => p.currentPhase !== 'DOCUMENT_COLLECTION').reduce((sum, phase) => sum + phase.count, 0);
    const successRate = totalStudents > 0 ? Math.round((completedApplications / totalStudents) * 100) : 0;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AssessmentIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.success.main, 0.2),
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {successRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.warning.main, 0.2),
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <BarChartIcon sx={{ color: theme.palette.warning.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {activeApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Applications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.info.main, 0.2),
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PieChartIcon sx={{ color: theme.palette.info.main }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {analytics.universityDistribution.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Universities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={fetchAnalytics}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: { xs: 1, md: 0 },
            fontSize: { xs: '1.75rem', md: '2.125rem' }
          }}>
            Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 }, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAnalytics}
              sx={{ borderRadius: 2, textTransform: 'none', flex: { xs: 1, sm: 'none' } }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportData('csv')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                flex: { xs: 1, sm: 'none' }
              }}
            >
              Export
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Comprehensive analytics and insights for your CRM system.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FilterIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>

          <FormControl size="small" sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={filters.timeRange}
              label="Time Range"
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            >
              <MenuItem value="6">Last 6 Months</MenuItem>
              <MenuItem value="12">Last 12 Months</MenuItem>
              <MenuItem value="24">Last 24 Months</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Counselor</InputLabel>
            <Select
              value={filters.counselor}
              label="Counselor"
              onChange={(e) => handleFilterChange('counselor', e.target.value)}
            >
              <MenuItem value="all">All Counselors</MenuItem>
              {analytics.counselorPerformance?.map(counselor => (
                <MenuItem key={counselor.id} value={counselor.id}>
                  {counselor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>University</InputLabel>
            <Select
              value={filters.university}
              label="University"
              onChange={(e) => handleFilterChange('university', e.target.value)}
            >
              <MenuItem value="all">All Universities</MenuItem>
              {analytics.universityDistribution?.map(uni => (
                <MenuItem key={uni.name} value={uni.name}>
                  {uni.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Summary Cards */}
      <SummaryCards />

      <Grid container spacing={3}>
        {/* Charts */}
        <Grid item xs={12} md={8} lg={8}>
          <ApplicationTrendsChart />
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <PhaseDistributionChart />
        </Grid>

        <Grid item xs={12} md={6} lg={6}>
          <MonthlyApplicationsChart />
        </Grid>
        <Grid item xs={12} md={6} lg={6}>
          <UniversityDistributionChart />
        </Grid>

        {/* Counselor Performance */}
        <Grid item xs={12}>
          <CounselorPerformance data={analytics.counselorPerformance || []} />
        </Grid>

        {/* Document Statistics */}
        <Grid item xs={12}>
          <DocumentStats data={analytics.documentStats || []} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminAnalytics;