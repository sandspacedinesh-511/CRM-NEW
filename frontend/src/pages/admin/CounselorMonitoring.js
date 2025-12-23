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
  Divider,
  Badge,
  Zoom,
  Grow,
  Slide
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
  const [pulseAnimation, setPulseAnimation] = useState(0);

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

  // Pulse animation for real-time indicators
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 2);
    }, 2000); // Pulse every 2 seconds
    return () => clearInterval(pulseInterval);
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
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
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
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      color: 'primary.main'
                    }
                  }}
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
                gap: 2,
                p: 3,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    animation: pulseAnimation === 0 ? 'pulse 2s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)', boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}` },
                      '50%': { transform: 'scale(1.05)', boxShadow: `0 6px 30px ${alpha(theme.palette.primary.main, 0.5)}` }
                    }
                  }}>
                    <AdminIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Counselor Monitoring
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Real-time activity tracking & analytics
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={exportData}
                    variant="outlined"
                    sx={{ 
                      borderRadius: 3,
                      px: 3,
                      py: 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                      }
                    }}
                  >
                    Export Data
                  </Button>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchMonitoringData}
                    variant="contained"
                    sx={{ 
                      borderRadius: 3,
                      px: 3,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                      }
                    }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>
            </Box>
          </Fade>

        {error && (
          <Slide direction="down" in={true} timeout={800}>
            <Alert severity="error" sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.2)}`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
            }}>
              {error}
            </Alert>
          </Slide>
        )}

        {/* Filters */}
        <Grow in={true} timeout={800}>
          <Card sx={{ 
            mb: 3, 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
              transform: 'translateY(-2px)'
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  mr: 1.5
                }}>
                  <FilterIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Filters
                </Typography>
              </Box>

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
        </Grow>

        {/* Summary Statistics */}
        {monitoringData && (
          <Grow in={true} timeout={1000}>
            <Card sx={{ 
              mb: 3, 
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    mr: 1.5
                  }}>
                    <AnalyticsIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Summary Statistics
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {[
                    { value: monitoringData.summary?.totalActivities || 0, label: 'Total Activities', color: 'primary', icon: <TimelineIcon /> },
                    { value: monitoringData.summary?.uniqueCounselors || 0, label: 'Active Counselors', color: 'success', icon: <PeopleIcon /> },
                    { value: monitoringData.summary?.activeSessions || 0, label: 'Active Sessions', color: 'warning', icon: <AccessTimeIcon /> },
                    { value: monitoringData.counselors?.length || 0, label: 'Total Counselors', color: 'info', icon: <PersonIcon /> }
                  ].map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Zoom in={true} timeout={1200 + (index * 100)}>
                        <Card sx={{
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.1)} 0%, ${alpha(theme.palette[stat.color].main, 0.05)} 100%)`,
                          border: `2px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
                          borderRadius: 3,
                          p: 2.5,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette[stat.color].main, 0.1)}, transparent)`,
                            transition: 'left 0.5s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-8px) scale(1.02)',
                            boxShadow: `0 12px 40px ${alpha(theme.palette[stat.color].main, 0.3)}`,
                            borderColor: alpha(theme.palette[stat.color].main, 0.4),
                            '&::before': {
                              left: '100%'
                            }
                          }
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{
                              p: 1.5,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${theme.palette[stat.color].main} 0%, ${alpha(theme.palette[stat.color].main, 0.8)} 100%)`,
                              color: 'white',
                              boxShadow: `0 4px 15px ${alpha(theme.palette[stat.color].main, 0.4)}`,
                              animation: pulseAnimation === 0 && stat.color === 'warning' ? 'pulse 2s ease-in-out infinite' : 'none',
                              '@keyframes pulse': {
                                '0%, 100%': { transform: 'scale(1)', boxShadow: `0 4px 15px ${alpha(theme.palette[stat.color].main, 0.4)}` },
                                '50%': { transform: 'scale(1.1)', boxShadow: `0 6px 25px ${alpha(theme.palette[stat.color].main, 0.6)}` }
                              }
                            }}>
                              {stat.icon}
                            </Box>
                            <Badge 
                              badgeContent={stat.value} 
                              color={stat.color}
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  animation: pulseAnimation === 0 && stat.color === 'warning' ? 'pulse 2s ease-in-out infinite' : 'none'
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: `${stat.color}.main`,
                            mb: 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {stat.label}
                          </Typography>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grow>
        )}

        {/* Tabs */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="monitoring tabs"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 72,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                    color: 'primary.main',
                    fontWeight: 600
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            >
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
                  {monitoringData.counselors?.map((counselor, index) => (
                    <Grid item xs={12} sm={6} md={4} key={counselor.id}>
                      <Zoom in={true} timeout={800 + (index * 100)}>
                        <Card sx={{ 
                          height: '100%',
                          borderRadius: 4,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                            transition: 'left 0.6s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-12px) scale(1.02)',
                            boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.25)}`,
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            '&::before': {
                              left: '100%'
                            }
                          }
                        }}>
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                  counselor.active ? (
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: theme.palette.success.main,
                                        border: `2px solid ${theme.palette.background.paper}`,
                                        animation: 'pulse 2s ease-in-out infinite',
                                        '@keyframes pulse': {
                                          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                                          '50%': { transform: 'scale(1.3)', opacity: 0.7 }
                                        }
                                      }}
                                    />
                                  ) : null
                                }
                              >
                                <Avatar sx={{ 
                                  mr: 2, 
                                  width: 56,
                                  height: 56,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1) rotate(5deg)',
                                    boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                                  }
                                }}>
                                  <PersonIcon />
                                </Avatar>
                              </Badge>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 600,
                                  mb: 0.5,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent'
                                }}>
                                  {counselor.name}
                                </Typography>
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
                                sx={{
                                  fontWeight: 600,
                                  boxShadow: counselor.active ? `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}` : 'none',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              />
                            </Box>

                            <Box sx={{
                              p: 2,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                              mb: 2,
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                Activities: <Box component="span" sx={{ fontSize: '1.2em', fontWeight: 700 }}>{counselor.activities?.length || 0}</Box>
                              </Typography>
                            </Box>

                            <Button
                              size="medium"
                              fullWidth
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewCounselorDetails(counselor)}
                              sx={{
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      </Zoom>
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
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                }}>
                  <TimelineIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Real-time Activity Feed
                </Typography>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: theme.palette.success.main,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.5)', opacity: 0.5 }
                  }
                }} />
              </Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchRealTimeActivities}
                disabled={realTimeLoading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px) rotate(180deg)',
                    boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground
                  }
                }}
              >
                Refresh
              </Button>
            </Box>

            {realTimeActivities.length > 0 ? (
              <List sx={{ 
                p: 0,
                '& .MuiListItem-root': {
                  borderRadius: 3,
                  mb: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateX(8px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  }
                }
              }}>
                {realTimeActivities.map((activity, index) => (
                  <Slide direction="left" in={true} timeout={500 + (index * 50)} key={activity.id || index}>
                    <ListItem divider={false} sx={{ p: 2.5 }}>
                      <ListItemIcon>
                        <Avatar sx={{ 
                          bgcolor: `${getActivityColor(activity.activityType)}.main`,
                          background: `linear-gradient(135deg, ${theme.palette[getActivityColor(activity.activityType)].main} 0%, ${alpha(theme.palette[getActivityColor(activity.activityType)].main, 0.8)} 100%)`,
                          boxShadow: `0 4px 15px ${alpha(theme.palette[getActivityColor(activity.activityType)].main, 0.4)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.2) rotate(10deg)',
                            boxShadow: `0 6px 25px ${alpha(theme.palette[getActivityColor(activity.activityType)].main, 0.6)}`
                          }
                        }}>
                          {getActivityIcon(activity.activityType)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {activity.counselor?.name || 'Unknown Counselor'}
                            </Typography>
                            <Chip
                              label={activity.activityType?.replace(/_/g, ' ')}
                              size="small"
                              color={getActivityColor(activity.activityType)}
                              sx={{
                                fontWeight: 600,
                                boxShadow: `0 2px 8px ${alpha(theme.palette[getActivityColor(activity.activityType)].main, 0.3)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)'
                                }
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {activity.description || (
                              activity.activityType === 'LOGIN' ? 'User logged in' :
                                activity.activityType === 'LOGOUT' ? 'User logged out' :
                                  activity.activityType === 'DOCUMENT_UPLOAD' ? 'Uploaded a document' :
                                    activity.activityType === 'STUDENT_CREATE' ? 'Added a new student' :
                                      activity.activityType?.replace(/_/g, ' ').toLowerCase()
                            )} • <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>{formatTimeAgo(activity.createdAt)}</Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Slide>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
              }}>
                No recent activities found.
              </Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* Performance Tab */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                }}>
                  <AssessmentIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Performance Analytics
                </Typography>
              </Box>
            </Box>
            {monitoringData?.sessionStats && (
              <Grid container spacing={3}>
                {monitoringData.sessionStats.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={4} key={stat.counselorId}>
                    <Grow in={true} timeout={800 + (index * 100)}>
                      <Card sx={{
                        height: '100%',
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                          transition: 'left 0.6s ease',
                        },
                        '&:hover': {
                          transform: 'translateY(-12px) scale(1.02)',
                          boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.25)}`,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          '&::before': {
                            left: '100%'
                          }
                        }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ 
                              mr: 2, 
                              width: 56,
                              height: 56,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1) rotate(5deg)',
                                boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                              }
                            }}>
                              <PersonIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ 
                                fontWeight: 600,
                                mb: 0.5,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}>
                                {stat.counselor?.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {stat.counselor?.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                                  Login Count
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                                  {stat.loginCount || 0}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                                  Total Time
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                  {stat.totalSessionDuration ?
                                    `${Math.round(stat.totalSessionDuration / 60)} min` : 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                Avg Session: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  {stat.avgSessionDuration ?
                                    `${Math.round(stat.avgSessionDuration / 60)} min` : 'N/A'}
                                </Box>
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                Last Login: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                  {stat.lastLogin ?
                                    new Date(stat.lastLogin).toLocaleDateString() : 'N/A'}
                                </Box>
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{
                                p: 2,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                              }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                                  Students Completed
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                                  {stat.completedStudents || 0}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Button
                            size="medium"
                            fullWidth
                            startIcon={<VisibilityIcon />}
                            onClick={() => {
                              const counselor = monitoringData.counselors?.find(c => c.id === stat.counselorId);
                              if (counselor) {
                                handleViewCounselorDetails(counselor);
                              }
                            }}
                            sx={{ 
                              mt: 3,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                              boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grow>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Card>

        {/* Export Actions */}
        <Grow in={true} timeout={1200}>
          <Card sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  mr: 1.5
                }}>
                  <DownloadIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Export Data
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  startIcon={<DownloadIcon />}
                  variant="outlined"
                  onClick={exportData}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    borderWidth: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      borderWidth: 2
                    }
                  }}
                >
                  Export CSV
                </Button>
                <Button
                  startIcon={<GetAppIcon />}
                  variant="outlined"
                  onClick={() => exportData('json')}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    borderWidth: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      borderWidth: 2
                    }
                  }}
                >
                  Export JSON
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grow>

        {/* Counselor Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.2)}`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }
          }}
        >
          <DialogTitle sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`
                }}>
                  <PersonIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Counselor Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCounselor?.name}
                  </Typography>
                </Box>
              </Box>
              <IconButton 
                onClick={() => setDetailsDialogOpen(false)}
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(90deg) scale(1.1)',
                    background: alpha(theme.palette.error.main, 0.1)
                  }
                }}
              >
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                  }}>
                    <AnalyticsIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Counselor Performance
                  </Typography>
                </Box>
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
                      <Zoom in={true} timeout={600 + (index * 100)}>
                        <Card sx={{
                          height: '100%',
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                          border: `2px solid ${alpha(stat.color, 0.2)}`,
                          boxShadow: `0 4px 20px ${alpha(stat.color, 0.1)}`,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${alpha(stat.color, 0.1)}, transparent)`,
                            transition: 'left 0.6s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-8px) scale(1.03)',
                            boxShadow: `0 12px 40px ${alpha(stat.color, 0.25)}`,
                            borderColor: alpha(stat.color, 0.4),
                            '&::before': {
                              left: '100%'
                            }
                          }
                        }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                                color: 'white',
                                boxShadow: `0 4px 15px ${alpha(stat.color, 0.4)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1) rotate(5deg)',
                                  boxShadow: `0 6px 25px ${alpha(stat.color, 0.6)}`
                                }
                              }}>
                                {stat.icon}
                              </Box>
                              <Typography variant="h4" sx={{ 
                                fontWeight: 700, 
                                color: stat.color,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)'
                                }
                              }}>
                                {stat.value}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {stat.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ 
                  my: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  borderWidth: 2
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                  }}>
                    <AccessTimeIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Session Statistics
                  </Typography>
                </Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                      border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 30px ${alpha(theme.palette.info.main, 0.2)}`
                      }
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                        Total Sessions
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                        {counselorDetails.sessionStats?.totalSessions || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Active Sessions: <Box component="span" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {counselorDetails.sessionStats?.activeSessions || 0}
                        </Box>
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{
                      p: 2.5,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                      border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 30px ${alpha(theme.palette.warning.main, 0.2)}`
                      }
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                        Total Duration
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                        {counselorDetails.sessionStats?.totalDuration !== undefined ?
                          `${Math.round((counselorDetails.sessionStats.totalDuration + (counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? (currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 1000 : 0)) / 60)} min` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Avg: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {counselorDetails.sessionStats?.avgDuration !== undefined ?
                            `${Math.round((counselorDetails.sessionStats.totalDuration + (counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? (currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 1000 : 0)) / 60 / (Math.max(counselorDetails.sessionStats.totalSessions || 0, 1) + (counselorDetails.sessionStats.currentSessionDuration === 0 && counselorDetails.sessionStats.lastLogin && ((new Date() - new Date(counselorDetails.sessionStats.lastLogin)) / 1000) < 43200 ? 1 : 0)))} min/session` : 'N/A'}
                        </Box>
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ 
                  my: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  borderWidth: 2
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                  }}>
                    <AccessTimeIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Timing Information
                  </Typography>
                </Box>
                <Card sx={{
                  p: 2.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  mb: 3
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Last Login
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {counselorDetails.sessionStats?.lastLogin ?
                          format(new Date(counselorDetails.sessionStats.lastLogin), 'PPpp') : 'N/A'}
                      </Typography>
                    </Grid>
                    {counselorDetails.sessionStats?.currentSessionDuration > 0 && (
                      <Grid item xs={12}>
                        <Box sx={{
                          p: 2,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: theme.palette.success.main,
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                              '50%': { transform: 'scale(1.5)', opacity: 0.5 }
                            }
                          }} />
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              Current Session
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {Math.round(counselorDetails.sessionStats.currentSessionDuration / 60)} minutes
                              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                (Real-time: {Math.round((currentTime - new Date(counselorDetails.sessionStats.lastLogin)) / 60000)} min)
                              </Typography>
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Divider sx={{ 
                  my: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  borderWidth: 2
                }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      p: 1,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                    }}>
                      <PeopleIcon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Students
                    </Typography>
                  </Box>
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
                <Card sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }} variant="outlined">
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                          Students in range
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {students.length}
                        </Typography>
                      </Box>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                          Total Applications
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                          {students.reduce((acc, curr) => acc + (curr.applications?.length || 0), 0)}
                        </Typography>
                      </Box>
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
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
                              transition: 'left 0.6s ease',
                            },
                            '&:hover': {
                              transform: 'translateY(-8px) scale(1.02)',
                              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
                              borderColor: alpha(theme.palette.primary.main, 0.3),
                              '&::before': {
                                left: '100%'
                              }
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
                              {student.isPaused && (
                                <Chip
                                  label="Paused"
                                  size="small"
                                  color="warning"
                                />
                              )}
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

                <Divider sx={{ 
                  my: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  borderWidth: 2
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                  }}>
                    <TimelineIcon sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Session Details
                  </Typography>
                </Box>
                {counselorDetails.sessions && counselorDetails.sessions.length > 0 ? (
                  <TableContainer component={Paper} sx={{ 
                    mb: 2,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
                    overflow: 'hidden'
                  }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                        }}>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Login Time</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Logout Time</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Duration</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {counselorDetails.sessions.slice(0, 10).map((session, index) => (
                          <TableRow 
                            key={session.id}
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.05),
                                transform: 'scale(1.01)'
                              }
                            }}
                          >
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
          <DialogActions sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Button 
              onClick={() => setDetailsDialogOpen(false)}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Container>
    </Box>
  );
}

export default CounselorMonitoring;
