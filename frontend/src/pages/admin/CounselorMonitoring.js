import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Avatar,
  useTheme,
  Fade,
  Skeleton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Upload as UploadIcon,
  GetApp as GetAppIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Note as NoteIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Analytics as AnalyticsIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import axiosInstance from '../../utils/axios';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ACTIVITY_TYPES = [
  'LOGIN', 'LOGOUT', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_PREVIEW',
  'STUDENT_VIEW', 'STUDENT_EDIT', 'APPLICATION_CREATE', 'APPLICATION_EDIT',
  'APPLICATION_DELETE', 'NOTE_ADD', 'PHASE_CHANGE', 'EXPORT_DATA', 'SEARCH', 'FILTER', 'OTHER'
];

const getActivityIcon = (activityType) => {
  switch (activityType) {
    case 'LOGIN': return <LoginIcon />;
    case 'LOGOUT': return <LogoutIcon />;
    case 'DOCUMENT_UPLOAD': return <UploadIcon />;
    case 'DOCUMENT_DOWNLOAD': return <GetAppIcon />;
    case 'DOCUMENT_PREVIEW': return <PreviewIcon />;
    case 'STUDENT_VIEW': return <VisibilityIcon />;
    case 'STUDENT_EDIT': return <EditIcon />;
    case 'APPLICATION_CREATE': return <AddIcon />;
    case 'APPLICATION_EDIT': return <EditIcon />;
    case 'APPLICATION_DELETE': return <DeleteIcon />;
    case 'NOTE_ADD': return <NoteIcon />;
    case 'PHASE_CHANGE': return <SchoolIcon />;
    case 'EXPORT_DATA': return <DownloadIcon />;
    case 'SEARCH': return <SearchIcon />;
    case 'FILTER': return <FilterIcon />;
    default: return <AssessmentIcon />;
  }
};

const getActivityColor = (activityType) => {
  switch (activityType) {
    case 'LOGIN': return 'success';
    case 'LOGOUT': return 'warning';
    case 'DOCUMENT_UPLOAD': return 'primary';
    case 'DOCUMENT_DOWNLOAD': return 'info';
    case 'DOCUMENT_PREVIEW': return 'secondary';
    case 'STUDENT_VIEW': return 'default';
    case 'STUDENT_EDIT': return 'primary';
    case 'APPLICATION_CREATE': return 'success';
    case 'APPLICATION_EDIT': return 'warning';
    case 'APPLICATION_DELETE': return 'error';
    case 'NOTE_ADD': return 'info';
    case 'PHASE_CHANGE': return 'secondary';
    case 'EXPORT_DATA': return 'default';
    case 'SEARCH': return 'default';
    case 'FILTER': return 'default';
    default: return 'default';
  }
};

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

function CounselorMonitoring() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [monitoringData, setMonitoringData] = useState(null);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [counselorDetails, setCounselorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');

  // Student list filters in details dialog
  const [studentStartDate, setStudentStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [studentEndDate, setStudentEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Real-time updates
  const [realTimeActivities, setRealTimeActivities] = useState([]);
  const [realTimeLoading, setRealTimeLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedCounselorId && { counselorId: selectedCounselorId }),
        ...(selectedActivityType && { activityType: selectedActivityType })
      });

      const response = await axiosInstance.get(`/admin/counselor-monitoring?${params}`);
      setMonitoringData(response.data.data);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError('Failed to load counselor monitoring data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeActivities = async () => {
    try {
      setRealTimeLoading(true);
      const response = await axiosInstance.get('/admin/counselor-monitoring/real-time?limit=20');
      setRealTimeActivities(response.data.data);
    } catch (error) {
      console.error('Error fetching real-time activities:', error);
    } finally {
      setRealTimeLoading(false);
    }
  };

  const fetchCounselorDetails = async (counselorId) => {
    try {
      setDetailsLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedActivityType && { activityType: selectedActivityType })
      });

      const response = await axiosInstance.get(`/admin/counselor-monitoring/${counselorId}?${params}`);
      setCounselorDetails(response.data.data);
      setDetailsDialogOpen(true);

      // Fetch students for this counselor
      await fetchStudentsForCounselor(counselorId);
    } catch (error) {
      console.error('Error fetching counselor details:', error);
      setError('Failed to load counselor details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchStudentsForCounselor = async (counselorId) => {
    try {
      setStudentsLoading(true);
      const response = await axiosInstance.get('/admin/students', {
        params: {
          counselorId,
          startDate: studentStartDate,
          endDate: studentEndDate,
          limit: 100
        }
      });

      if (response.data.success) {
        setStudents(response.data.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedCounselorId && { counselorId: selectedCounselorId })
      });

      const response = await axiosInstance.get(`/admin/counselor-monitoring/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `counselor_activity_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedCounselorId, selectedActivityType]);

  // Refresh students when student list filters change
  useEffect(() => {
    if (selectedCounselor) {
      fetchStudentsForCounselor(selectedCounselor.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentStartDate, studentEndDate]);

  useEffect(() => {
    fetchRealTimeActivities();
    const interval = setInterval(fetchRealTimeActivities, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update current time every minute for real-time session duration
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timeInterval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewCounselorDetails = (counselor) => {
    setSelectedCounselor(counselor);
    fetchCounselorDetails(counselor.id);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="rectangular" width={200} height={40} />
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ mb: 4 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin/dashboard');
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Dashboard
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Counselor Monitoring
              </Typography>
            </Breadcrumbs>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Counselor Monitoring
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={exportData}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Export Data
                </Button>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchMonitoringData}
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Counselor</InputLabel>
                  <Select
                    value={selectedCounselorId}
                    onChange={(e) => setSelectedCounselorId(e.target.value)}
                    label="Counselor"
                  >
                    <MenuItem value="">All Counselors</MenuItem>
                    {monitoringData?.counselors?.map((counselor) => (
                      <MenuItem key={counselor.id} value={counselor.id}>
                        {counselor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={selectedActivityType}
                    onChange={(e) => setSelectedActivityType(e.target.value)}
                    label="Activity Type"
                  >
                    <MenuItem value="">All Activities</MenuItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {monitoringData && (
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {monitoringData.summary?.totalActivities || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Activities
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {monitoringData.summary?.uniqueCounselors || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Counselors
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {monitoringData.summary?.activeSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Sessions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {monitoringData.counselors?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Counselors
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
              <Tab
                label="Overview"
                icon={<DashboardIcon />}
                iconPosition="start"
                id="monitoring-tab-0"
                aria-controls="monitoring-tabpanel-0"
              />
              <Tab
                label="Activity Feed"
                icon={<TimelineIcon />}
                iconPosition="start"
                id="monitoring-tab-1"
                aria-controls="monitoring-tabpanel-1"
              />
              <Tab
                label="Performance"
                icon={<AssessmentIcon />}
                iconPosition="start"
                id="monitoring-tab-2"
                aria-controls="monitoring-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {/* Overview Tab */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {monitoringData ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Debug: Found {monitoringData.counselors?.length || 0} counselors
                </Typography>
                <Grid container spacing={3}>
                  {/* Counselor Cards */}
                  {monitoringData.counselors?.map((counselor) => (
                    <Grid item xs={12} sm={6} md={4} key={counselor.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{counselor.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {counselor.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={counselor.active ? 'Active' : 'Inactive'}
                              color={counselor.active ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>

                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Activities: {counselor.activities?.length || 0}
                          </Typography>

                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewCounselorDetails(counselor)}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Activity Feed Tab */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Real-time Activity Feed</Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchRealTimeActivities}
                disabled={realTimeLoading}
              >
                Refresh
              </Button>
            </Box>

            {realTimeActivities.length > 0 ? (
              <List>
                {realTimeActivities.map((activity, index) => (
                  <ListItem key={activity.id || index} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                        {activity.activityType === 'LOGIN' && <LoginIcon />}
                        {activity.activityType === 'LOGOUT' && <LogoutIcon />}
                        {activity.activityType === 'DOCUMENT_UPLOAD' && <UploadIcon />}
                        {!['LOGIN', 'LOGOUT', 'DOCUMENT_UPLOAD'].includes(activity.activityType) && <TimelineIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {activity.counselor?.name || 'Unknown Counselor'}
                          </Typography>
                          <Chip
                            label={activity.activityType?.replace(/_/g, ' ')}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {activity.description || (
                            activity.activityType === 'LOGIN' ? 'User logged in' :
                              activity.activityType === 'LOGOUT' ? 'User logged out' :
                                activity.activityType === 'DOCUMENT_UPLOAD' ? 'Uploaded a document' :
                                  activity.activityType === 'STUDENT_CREATE' ? 'Added a new student' :
                                    activity.activityType?.replace(/_/g, ' ').toLowerCase()
                          )} • {formatTimeAgo(activity.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No recent activities found.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Performance Tab */}
            <Typography variant="h6" sx={{ mb: 2 }}>Performance Analytics</Typography>
            {monitoringData?.sessionStats && (
              <Grid container spacing={3}>
                {monitoringData.sessionStats.map((stat) => (
                  <Grid item xs={12} sm={6} md={4} key={stat.counselorId}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{stat.counselor?.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stat.counselor?.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Login Count: {stat.loginCount || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Total Time: {stat.totalSessionDuration ?
                                `${Math.round(stat.totalSessionDuration / 60)} min` : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Avg Session: {stat.avgSessionDuration ?
                                `${Math.round(stat.avgSessionDuration / 60)} min` : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Last Login: {stat.lastLogin ?
                                new Date(stat.lastLogin).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              Students Completed: {stat.completedStudents || 0}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            const counselor = monitoringData.counselors?.find(c => c.id === stat.counselorId);
                            if (counselor) {
                              handleViewCounselorDetails(counselor);
                            }
                          }}
                          sx={{ mt: 2 }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Card>

        {/* Export Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Export Data</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={exportData}
              >
                Export CSV
              </Button>
              <Button
                startIcon={<GetAppIcon />}
                variant="outlined"
                onClick={() => exportData('json')}
              >
                Export JSON
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Counselor Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                Counselor Details: {selectedCounselor?.name}
              </Typography>
              <IconButton onClick={() => setDetailsDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {detailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : counselorDetails ? (
              <Box>

                <Typography variant="h6" sx={{ mb: 2 }}>Counselor Performance</Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {[
                    { title: 'Total Students', value: counselorDetails.dashboardStats?.totalStudents || 0, color: theme.palette.primary.main, icon: <PeopleIcon /> },
                    { title: 'Active Applications', value: counselorDetails.dashboardStats?.activeApplications || 0, color: theme.palette.success.main, icon: <SchoolIcon /> },
                    { title: 'Pending Documents', value: counselorDetails.dashboardStats?.pendingDocuments || 0, color: theme.palette.warning.main, icon: <NoteIcon /> },
                    { title: 'Upcoming Deadlines', value: counselorDetails.dashboardStats?.upcomingDeadlines || 0, color: theme.palette.error.main, icon: <AccessTimeIcon /> },
                    { title: 'Completed', value: counselorDetails.dashboardStats?.completedEnrollments || 0, color: theme.palette.info.main, icon: <CheckCircleIcon /> },
                    { title: 'Current Students', value: counselorDetails.dashboardStats?.currentStudents || 0, color: theme.palette.secondary.main, icon: <PeopleIcon /> }
                  ].map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                        border: `1px solid ${alpha(stat.color, 0.2)}`
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: alpha(stat.color, 0.1),
                              color: stat.color,
                              display: 'flex'
                            }}>
                              {stat.icon}
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                              {stat.value}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {stat.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>Session Statistics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Total Sessions: {counselorDetails.sessionStats?.totalSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Sessions: {counselorDetails.sessionStats?.activeSessions || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Total Duration: {counselorDetails.sessionStats?.totalDuration !== undefined ?
                        `${Math.round((counselorDetails.sessionStats.totalDuration + (counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? (currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 1000 : 0)) / 60)} minutes` : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg: {counselorDetails.sessionStats?.avgDuration !== undefined ?
                        `${Math.round((counselorDetails.sessionStats.totalDuration + (counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? (currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 1000 : 0)) / 60 / (Math.max(counselorDetails.sessionStats.totalSessions || 0, 1) + (counselorDetails.sessionStats.currentSessionDuration === 0 && counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? 1 : 0)))} min/session` : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>Timing Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Last Login: {counselorDetails.sessionStats?.lastLogin ?
                        format(new Date(counselorDetails.sessionStats.lastLogin), 'PPpp') : 'N/A'}
                    </Typography>
                  </Grid>
                  {counselorDetails.sessionStats?.currentSessionDuration > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        Current Session: {Math.round(counselorDetails.sessionStats.currentSessionDuration / 60)} minutes
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (Real-time: {Math.round((currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 60000)} min)
                        </Typography>
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6">Students</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      type="date"
                      label="From"
                      value={studentStartDate}
                      onChange={(e) => setStudentStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ width: 150 }}
                    />
                    <TextField
                      type="date"
                      label="To"
                      value={studentEndDate}
                      onChange={(e) => setStudentEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ width: 150 }}
                    />
                  </Box>
                </Box>

                {/* Filter Summary */}
                <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px dashed ' + alpha(theme.palette.primary.main, 0.3) }} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Students in range: <Box component="span" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1em' }}>{students.length}</Box>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Total Applications in range: <Box component="span" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1em' }}>{students.reduce((acc, curr) => acc + (curr.applications?.length || 0), 0)}</Box>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                {studentsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : students.length > 0 ? (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {students.map((student) => (
                      <Grid item xs={12} sm={6} md={4} key={student.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                          onClick={() => {
                            setDetailsDialogOpen(false);
                            navigate(`/admin/students/${student.id}/progress`);
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {student.firstName?.charAt(0) || 'S'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {student.firstName} {student.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {student.email}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                              <Chip
                                label={student.currentPhase?.replace(/_/g, ' ') || 'Not Started'}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={student.status || 'ACTIVE'}
                                size="small"
                                color={student.status === 'COMPLETED' ? 'success' : 'default'}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No students found for this counselor.
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>Session Details</Typography>
                {counselorDetails.sessions && counselorDetails.sessions.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Login Time</TableCell>
                          <TableCell>Logout Time</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {counselorDetails.sessions.slice(0, 10).map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>
                              {session.loginTime ?
                                new Date(session.loginTime).toLocaleString() :
                                new Date(session.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {session.logoutTime ?
                                new Date(session.logoutTime).toLocaleString() :
                                'Active Session'}
                            </TableCell>
                            <TableCell>
                              {session.logoutTime ? (
                                session.sessionDuration ? `${Math.round(session.sessionDuration / 60)} min` :
                                  session.loginTime ? `${Math.round((new Date(session.logoutTime) - new Date(session.loginTime)) / 60000)} min` : 'N/A'
                              ) : (
                                session.status === 'ACTIVE' && session.loginTime && ((currentTime - new Date(session.loginTime)) / 60000) < 1440 ?
                                  `${Math.round((currentTime - new Date(session.loginTime)) / 60000)} min` :
                                  session.status === 'COMPLETED' ? 'N/A' : 'N/A'
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={session.status}
                                size="small"
                                color={session.status === 'ACTIVE' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No session data available for this period.
                  </Typography>
                )}

              </Box>
            ) : (
              <Alert severity="error">Failed to load counselor details.</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container >
  );
}

export default CounselorMonitoring;
