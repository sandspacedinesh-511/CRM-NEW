// src/pages/admin/Dashboard.js
import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Fade,
  Grow,
  useTheme,
  alpha,
  Container,
  Stack,
  Badge,
  CardActions,
  CardHeader,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Speed as SpeedIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Bolt as BoltIcon,
  MoreVert as MoreVertIcon
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
  ResponsiveContainer 
} from 'recharts';
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import CounselorPerformance from '../../components/admin/CounselorPerformance';
import DocumentStats from '../../components/admin/DocumentStats';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function AdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({
    totalCounselors: 0,
    totalStudents: 0,
    activeApplications: 0,
    successRate: 0,
    pendingDocuments: 0,
    totalUniversities: 0,
    monthlyGrowth: 0,
    averageProcessingTime: 0
  });
  const [analytics, setAnalytics] = useState({
    phaseDistribution: [],
    monthlyApplications: [],
    universityDistribution: [],
    counselorPerformance: []
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({
    todayApplications: 0,
    thisWeekApplications: 0,
    thisMonthApplications: 0,
    pendingApprovals: 0
  });

  // WebSocket integration for real-time updates
  const { isConnected, onEvent, joinRoom } = useWebSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        axiosInstance.get('/admin/dashboard'),
        axiosInstance.get('/admin/analytics')
      ]);

      setStats(dashboardResponse.data.stats);
      setRecentActivities(dashboardResponse.data.recentActivities);
      setAnalytics(analyticsResponse.data.data || analyticsResponse.data);

      setQuickStats({
        todayApplications: dashboardResponse.data.stats.todayApplications || 0,
        thisWeekApplications: dashboardResponse.data.stats.thisWeekApplications || 0,
        thisMonthApplications: dashboardResponse.data.stats.thisMonthApplications || 0,
        pendingApprovals: dashboardResponse.data.stats.pendingApprovals || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Join admin room for real-time updates
  useEffect(() => {
    if (isConnected && user?.role === 'admin') {
      joinRoom('admin:all');
      joinRoom('role:admin');
    }
  }, [isConnected, user, joinRoom]);

  // Listen for real-time dashboard updates
  useEffect(() => {
    if (!isConnected) return;

    const cleanupDashboardUpdate = onEvent('dashboard_update', (data) => {
      fetchDashboardData();
    });

    const cleanupApplicationUpdate = onEvent('application_update', (data) => {
      setQuickStats(prev => ({
        ...prev,
        todayApplications: prev.todayApplications + 1,
        thisWeekApplications: prev.thisWeekApplications + 1,
        thisMonthApplications: prev.thisMonthApplications + 1
      }));
    });

    const cleanupSystemAlert = onEvent('system_alert', (alert) => {
      setRecentActivities(prev => [alert, ...prev].slice(0, 20));
    });

    return () => {
      cleanupDashboardUpdate?.();
      cleanupApplicationUpdate?.();
      cleanupSystemAlert?.();
    };
  }, [isConnected, onEvent]);

  // Quick action handlers
  const handleAddCounselor = () => {
    navigate('/admin/counselors');
  };

  const handleAddUniversity = () => {
    navigate('/admin/universities');
  };

  const handleGenerateReport = () => {
    navigate('/admin/reports');
  };

  const handleExportData = async () => {
    try {
      const response = await axiosInstance.get('/admin/analytics/export', {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend, onClick, badge }) => (
    <Fade in={true} timeout={600}>
      <Card 
        sx={{ 
          height: '100%', 
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'visible',
          '&:hover': onClick ? {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[12],
            backgroundColor: alpha(color, 0.05)
          } : {},
          background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.03)} 100%)`,
          border: `1px solid ${alpha(color, 0.15)}`,
          borderRadius: 3
        }}
        onClick={onClick}
      >
        {badge && (
          <Badge
            badgeContent={badge}
            color="error"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 1
            }}
          />
        )}
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box
              sx={{
                backgroundColor: alpha(color, 0.15),
                borderRadius: 3,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(color, 0.2)}`
              }}
            >
              {icon}
            </Box>
            {trend && (
              <Chip
                icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={trend > 0 ? `+${trend}%` : `${trend}%`}
                size="small"
                color={trend > 0 ? 'success' : 'error'}
                variant="filled"
                sx={{ 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: `0 2px 8px ${alpha(trend > 0 ? theme.palette.success.main : theme.palette.error.main, 0.3)}`
                }}
              />
            )}
          </Box>
          <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1, color: color }}>
            {value}
          </Typography>
          <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  const ActivityItem = ({ activity, index }) => (
    <Grow in={true} timeout={800 + (index * 100)}>
      <ListItem
        sx={{
          borderRadius: 2,
          mb: 1.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(4px)',
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
          }
        }}
      >
        <ListItemIcon>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            {activity.type === 'New Student' && <PeopleIcon />}
            {activity.type === 'Document Upload' && <AssignmentIcon />}
            {activity.type === 'Phase Update' && <TrendingUpIcon />}
            {activity.type === 'Application' && <SchoolIcon />}
          </Avatar>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {activity.description}
              </Typography>
              <Chip
                label={activity.type}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: 1.5
                }}
              />
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mt: 1 }}>
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </Typography>
          }
        />
      </ListItem>
    </Grow>
  );

  const QuickActionsCard = () => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.secondary[50]} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderRadius: 3
    }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Quick Actions
          </Typography>
        }
        avatar={
          <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
            <BoltIcon />
          </Avatar>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCounselor}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              }}
            >
              Add Counselor
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SchoolIcon />}
              onClick={handleAddUniversity}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Add University
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={handleGenerateReport}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Generate Report
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportData}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Export Data
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const PerformanceChart = () => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[4] }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Monthly Applications
          </Typography>
        }
        avatar={
          <Avatar sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
            <ShowChartIcon />
          </Avatar>
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
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
                borderRadius: 8,
                boxShadow: theme.shadows[8]
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke={theme.palette.primary.main} 
              strokeWidth={3}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: theme.palette.primary.main, strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const PhaseDistributionChart = () => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[4] }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Application Phases
          </Typography>
        }
        avatar={
          <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
            <PieChartIcon />
          </Avatar>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={analytics.phaseDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ currentPhase, percent }) => `${currentPhase} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
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
                borderRadius: 8,
                boxShadow: theme.shadows[8]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const UniversityDistributionChart = () => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[4] }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Top Universities
          </Typography>
        }
        avatar={
          <Avatar sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
            <BusinessIcon />
          </Avatar>
        }
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analytics.universityDistribution.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis 
              dataKey="name" 
              stroke={theme.palette.text.secondary}
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              fontSize={12}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                boxShadow: theme.shadows[8]
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

  const SystemStatusCard = () => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
      borderRadius: 3
    }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
            System Status
          </Typography>
        }
        avatar={
          <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
            <CheckCircleIcon />
          </Avatar>
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Database Connection
            </Typography>
            <Chip label="Online" color="success" size="small" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              API Services
            </Typography>
            <Chip label="Healthy" color="success" size="small" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              File Storage
            </Typography>
            <Chip label="Active" color="success" size="small" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Auto Refresh
            </Typography>
            <Switch
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              color="success"
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 3
      }}>
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading Dashboard...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Preparing your comprehensive overview
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[4]
          }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Fade in={true} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 800, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                Admin Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                Welcome back! Here's what's happening with your CRM system today.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto Refresh"
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDashboardData}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportData}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                Export Report
              </Button>
            </Stack>
          </Box>
        </Box>
      </Fade>

      <Grid container spacing={4}>
        {/* Main Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Counselors"
            value={stats.totalCounselors}
            icon={<PeopleIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            subtitle="Active counselors"
            trend={12}
            badge={stats.totalCounselors > 0 ? stats.totalCounselors : null}
            onClick={() => navigate('/admin/counselors')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Counselor Monitoring"
            value="Monitor"
            icon={<AssessmentIcon sx={{ fontSize: 28, color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
            subtitle="Track activities"
            trend={0}
            onClick={() => navigate('/admin/counselor-monitoring')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<SchoolIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            subtitle="Registered students"
            trend={8}
            badge={stats.totalStudents > 0 ? stats.totalStudents : null}
            onClick={() => navigate('/admin/students')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Applications"
            value={stats.activeApplications}
            icon={<AssignmentIcon sx={{ fontSize: 28, color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            subtitle="In progress"
            trend={-3}
            badge={stats.activeApplications > 0 ? stats.activeApplications : null}
            onClick={() => navigate('/admin/applications')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />}
            color={theme.palette.error.main}
            subtitle="Applications completed"
            trend={5}
            onClick={() => navigate('/admin/reports')}
          />
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Quick Statistics
                </Typography>
              }
              avatar={
                <Avatar sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                  <SpeedIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1), 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 800, mb: 1 }}>
                      {quickStats.todayApplications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Today
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.success.main, 0.1), 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 800, mb: 1 }}>
                      {quickStats.thisWeekApplications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      This Week
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.warning.main, 0.1), 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                  }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 800, mb: 1 }}>
                      {quickStats.thisMonthApplications}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      This Month
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.error.main, 0.1), 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                  }}>
                    <Typography variant="h4" color="error.main" sx={{ fontWeight: 800, mb: 1 }}>
                      {quickStats.pendingApprovals}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Pending
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <QuickActionsCard />
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={4}>
          <SystemStatusCard />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} lg={8}>
          <PerformanceChart />
        </Grid>
        <Grid item xs={12} lg={4}>
          <PhaseDistributionChart />
        </Grid>

        {/* University Distribution */}
        <Grid item xs={12} lg={6}>
          <UniversityDistributionChart />
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Activities
                </Typography>
              }
              avatar={
                <Avatar sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                  <TimelineIcon />
                </Avatar>
              }
              action={
                <Button size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>
                  View All
                </Button>
              }
            />
            <CardContent>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {recentActivities.map((activity, index) => (
                      <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No recent activities
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activities will appear here as they happen
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
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
    </Container>
  );
}

export default AdminDashboard;