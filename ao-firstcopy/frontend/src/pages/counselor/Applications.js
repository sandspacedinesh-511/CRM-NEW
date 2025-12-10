import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  useTheme,
  Fade,
  Grow,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  InputAdornment,
  Divider
} from '@mui/material';
import MultiCountryApplicationManager from '../../components/counselor/MultiCountryApplicationManager';
import MultiCountryDashboard from '../../components/counselor/MultiCountryDashboard';
import SingleCountryAlert from '../../components/counselor/SingleCountryAlert';
import ApplicationCardView from '../../components/counselor/ApplicationCardView';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  LocationOn as LocationIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  Speed as SpeedIcon,
  TrendingDown as TrendingDownIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  FilterAlt as FilterAltIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  GetApp as GetAppIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreFromTrashIcon,
  PriorityHigh as PriorityHighIcon,
  LowPriority as LowPriorityIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import axiosInstance from '../../utils/axios';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const APPLICATION_STATUS = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'SUBMITTED', label: 'Submitted', color: 'info' },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: 'primary' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'success' },
  { value: 'REJECTED', label: 'Rejected', color: 'error' },
  { value: 'DEFERRED', label: 'Deferred', color: 'default' }
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  ...APPLICATION_STATUS
];

const SORT_OPTIONS = [
  { value: 'deadline_asc', label: 'Deadline (Earliest)' },
  { value: 'deadline_desc', label: 'Deadline (Latest)' },
  { value: 'created_asc', label: 'Created (Oldest)' },
  { value: 'created_desc', label: 'Created (Newest)' },
  { value: 'student_asc', label: 'Student (A-Z)' },
  { value: 'student_desc', label: 'Student (Z-A)' },
  { value: 'university_asc', label: 'University (A-Z)' },
  { value: 'university_desc', label: 'University (Z-A)' }
];

function Applications() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // WebSocket integration for real-time updates
  const { isConnected, onEvent, joinRoom } = useWebSocket();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [students, setStudents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [universityFilter, setUniversityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('deadline_asc');
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedStudentForMultiCountry, setSelectedStudentForMultiCountry] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
    underReview: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [intakeFilter, setIntakeFilter] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    universityId: '',
    courseName: '',
    applicationDeadline: '',
    status: 'PENDING',
    notes: '',
    applicationFee: '',
    documentsRequired: '',
    interviewDate: '',
    offerDeadline: ''
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/applications', {
        params: {
          search: searchQuery,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          studentId: studentFilter === 'ALL' ? undefined : studentFilter,
          universityId: universityFilter === 'ALL' ? undefined : universityFilter,
          sort: sortBy,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      
      if (response.data.success) {
        setApplications(response.data.data?.applications || []);
        setTotalCount(response.data.data?.total || 0);
      } else {
        // Fallback for old response format
        const apps = Array.isArray(response.data) ? response.data : [];
        setApplications(apps);
        setTotalCount(apps.length);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications. Please try again later.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndUniversities = async () => {
    try {
      const [studentsRes, universitiesRes] = await Promise.all([
        axiosInstance.get('/counselor/students'),
        axiosInstance.get('/counselor/universities')
      ]);
      
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data?.students || []);
      } else {
        setStudents(studentsRes.data.rows || []);
      }
      
      if (universitiesRes.data.success) {
        setUniversities(universitiesRes.data.data?.universities || []);
      } else {
        setUniversities(universitiesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setStudents([]);
      setUniversities([]);
    }
  };

  const calculateApplicationStats = (apps) => {
    const stats = {
      total: apps.length,
      pending: apps.filter(app => (app.status || app.applicationStatus) === 'PENDING').length,
      submitted: apps.filter(app => (app.status || app.applicationStatus) === 'SUBMITTED').length,
      accepted: apps.filter(app => (app.status || app.applicationStatus) === 'ACCEPTED').length,
      rejected: apps.filter(app => (app.status || app.applicationStatus) === 'REJECTED').length,
      underReview: apps.filter(app => (app.status || app.applicationStatus) === 'UNDER_REVIEW').length
    };
    setApplicationStats(stats);
  };

  const getUpcomingDeadlines = (apps) => {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    
    return apps
      .filter(app => {
        const deadline = new Date(app.deadline);
        return deadline >= now && deadline <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
  };

  const getRecentActivities = (apps) => {
    return apps
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return <PriorityHighIcon />;
      case 'MEDIUM': return <WarningIcon />;
      case 'LOW': return <LowPriorityIcon />;
      default: return <RadioButtonUncheckedIcon />;
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'warning';
      case 'SUBMITTED': return 'info';
      case 'UNDER_REVIEW': return 'primary';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'DEFERRED': return 'default';
      default: return 'default';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return <ScheduleIcon />;
      case 'SUBMITTED': return <CheckBoxIcon />;
      case 'UNDER_REVIEW': return <AssignmentIcon />;
      case 'ACCEPTED': return <CheckCircleIcon />;
      case 'REJECTED': return <ErrorIcon />;
      case 'DEFERRED': return <WarningIcon />;
      default: return <AssignmentIcon />;
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStudentsAndUniversities();
  }, [searchQuery, statusFilter, studentFilter, universityFilter, sortBy, page, rowsPerPage]);

  useEffect(() => {
    if (applications.length > 0) {
      calculateApplicationStats(applications);
      setUpcomingDeadlines(getUpcomingDeadlines(applications));
      setRecentActivities(getRecentActivities(applications));
    }
  }, [applications]);

  // Join application room for real-time updates
  useEffect(() => {
    if (isConnected && user?.role === 'counselor') {
      joinRoom(`counselor:${user.id}`);
      joinRoom('role:counselor');
    }
  }, [isConnected, user, joinRoom]);

  // Listen for real-time application updates
  useEffect(() => {
    if (!isConnected) return;

    const cleanupApplicationUpdate = onEvent('application_status_changed', (data) => {
      setApplications(prev => 
        prev.map(app => 
          app.id === data.applicationId 
            ? { ...app, status: data.status, applicationStatus: data.status, updatedAt: data.timestamp }
            : app
        )
      );
    });

    const cleanupApplicationAlert = onEvent('application_alert', (data) => {
      setRecentActivities(prev => [data, ...prev].slice(0, 10));
    });

    return () => {
      cleanupApplicationUpdate?.();
      cleanupApplicationAlert?.();
    };
  }, [isConnected, onEvent]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, application = null) => {
    setDialogMode(mode);
    setSelectedApplication(application);
    if (application) {
      setFormData({
        studentId: application.studentId,
        universityId: application.universityId,
        courseName: application.courseName,
        applicationDeadline: format(new Date(application.applicationDeadline), 'yyyy-MM-dd'),
        status: application.status || application.applicationStatus,
        notes: application.notes || '',
        applicationFee: application.applicationFee || '',
        documentsRequired: application.documentsRequired || '',
        interviewDate: application.interviewDate ? format(new Date(application.interviewDate), 'yyyy-MM-dd') : '',
        offerDeadline: application.offerDeadline ? format(new Date(application.offerDeadline), 'yyyy-MM-dd') : ''
      });
    } else {
      setFormData({
        studentId: '',
        universityId: '',
        courseName: '',
        applicationDeadline: '',
        status: 'PENDING',
        notes: '',
        applicationFee: '',
        documentsRequired: '',
        interviewDate: '',
        offerDeadline: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
    setFormData({
      studentId: '',
      universityId: '',
      courseName: '',
      applicationDeadline: '',
      status: 'PENDING',
      notes: '',
      applicationFee: '',
      documentsRequired: '',
      interviewDate: '',
      offerDeadline: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === 'add') {
        await axiosInstance.post('/counselor/applications', formData);
      } else {
        await axiosInstance.put(`/counselor/applications/${selectedApplication.id}`, formData);
      }
      handleCloseDialog();
      fetchApplications();
    } catch (error) {
      console.error('Error saving application:', error);
      setError('Failed to save application. Please try again.');
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/counselor/applications/${applicationId}`);
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      setError('Failed to delete application. Please try again.');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedApplications.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await axiosInstance.delete('/counselor/applications/bulk', {
          data: { applicationIds: selectedApplications }
        });
      } else if (bulkAction === 'status') {
        // Handle bulk status change
        await axiosInstance.patch('/counselor/applications/bulk-status', {
          applicationIds: selectedApplications,
          status: 'NEXT_STATUS' // You can add a status selector
        });
      }
      
      setSelectedApplications([]);
      setBulkActionDialog(false);
      setBulkAction('');
      fetchApplications();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action. Please try again.');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedApplications(applications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (applicationId) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleEditApplication = (application) => {
    handleOpenDialog('edit', application);
  };

  const handleDeleteApplication = (application) => {
    // Implementation for deleting application
    console.log('Delete application:', application);
    // You can add confirmation dialog here
  };

  const handleViewApplication = (application) => {
    // Implementation for viewing application details
    console.log('View application:', application);
    // You can navigate to a detailed view or open a dialog
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setStudentFilter('ALL');
    setUniversityFilter('ALL');
    setSortBy('deadline_asc');
    setPage(0);
  };

  const getStatusColor = (status) => {
    const statusObj = APPLICATION_STATUS.find(s => s.value === status);
    return statusObj ? statusObj.color : 'default';
  };

  const isOverdue = (deadline) => {
    return isBefore(new Date(deadline), new Date());
  };

  const isDueSoon = (deadline) => {
    const daysUntilDue = differenceInDays(new Date(deadline), new Date());
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  };

  const getApplicationStats = () => {
    const total = applications.length;
    const getStatus = (app) => app.status || app.applicationStatus;
    const pending = applications.filter(a => getStatus(a) === 'PENDING').length;
    const submitted = applications.filter(a => getStatus(a) === 'SUBMITTED').length;
    const underReview = applications.filter(a => getStatus(a) === 'UNDER_REVIEW').length;
    const accepted = applications.filter(a => getStatus(a) === 'ACCEPTED').length;
    const rejected = applications.filter(a => getStatus(a) === 'REJECTED').length;
    const overdue = applications.filter(a => isOverdue(a.applicationDeadline) && getStatus(a) === 'PENDING').length;
    
    return { total, pending, submitted, underReview, accepted, rejected, overdue };
  };

  const stats = getApplicationStats();

  const getStatus = (app) => app.status || app.applicationStatus;
  const groupedApplications = {
    overdue: applications.filter(app => isOverdue(app.applicationDeadline) && getStatus(app) === 'PENDING'),
    dueSoon: applications.filter(app => isDueSoon(app.applicationDeadline) && getStatus(app) === 'PENDING'),
    pending: applications.filter(app => getStatus(app) === 'PENDING' && !isOverdue(app.applicationDeadline) && !isDueSoon(app.applicationDeadline)),
    submitted: applications.filter(app => getStatus(app) === 'SUBMITTED'),
    underReview: applications.filter(app => getStatus(app) === 'UNDER_REVIEW'),
    accepted: applications.filter(app => getStatus(app) === 'ACCEPTED'),
    rejected: applications.filter(app => getStatus(app) === 'REJECTED')
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );

  if (loading && applications.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LoadingSkeleton />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                University Applications
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Track and manage student university applications
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchApplications}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Refresh
              </Button>
              
              <Button
                variant={showAnalytics ? "contained" : "outlined"}
                startIcon={<AnalyticsIcon />}
                onClick={() => setShowAnalytics(!showAnalytics)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Analytics
              </Button>

              <Button
                variant="outlined"
                startIcon={viewMode === 'table' ? <ViewModuleIcon /> : <ViewListIcon />}
                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                {viewMode === 'table' ? 'Card View' : 'Table View'}
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('add')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Add Application
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Multi-Country Application Tabs */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ mb: 4 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }
              }}
            >
              <Tab label="All Applications" />
              <Tab label="Multi-Country Dashboard" />
              <Tab label="Country-Based Management" />
            </Tabs>
          </Box>
        </Fade>

        {/* Single Country Alert */}
        <SingleCountryAlert />

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <Fade in={showAnalytics} timeout={800}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Application Analytics
              </Typography>
              
              <Grid container spacing={3}>
                {/* Statistics Cards */}
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                        border: `1px solid ${theme.palette.primary[200]}`,
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                              {applicationStats.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Total Applications
                            </Typography>
                          </Box>
                          <AssignmentIcon sx={{ color: theme.palette.primary.main, fontSize: 40 }} />
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
                        border: `1px solid ${theme.palette.warning[200]}`,
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                              {applicationStats.pending}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Pending
                            </Typography>
                          </Box>
                          <ScheduleIcon sx={{ color: theme.palette.warning.main, fontSize: 40 }} />
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.info[50]} 0%, ${theme.palette.info[100]} 100%)`,
                        border: `1px solid ${theme.palette.info[200]}`,
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                              {applicationStats.submitted}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Submitted
                            </Typography>
                          </Box>
                          <CheckBoxIcon sx={{ color: theme.palette.info.main, fontSize: 40 }} />
                        </Box>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
                        border: `1px solid ${theme.palette.success[200]}`,
                        borderRadius: 3,
                        p: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                              {applicationStats.accepted}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Accepted
                            </Typography>
                          </Box>
                          <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 40 }} />
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Recent Activities */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, p: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Recent Activities
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {recentActivities.map((activity, index) => (
                        <Box key={index} sx={{ mb: 2, p: 1, borderRadius: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {activity.student?.name || 'Unknown Student'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {activity.university?.name} - {activity.status || activity.applicationStatus}
                          </Typography>
                          <Typography variant="caption" display="block" color="textSecondary">
                            {format(new Date(activity.updatedAt || activity.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            {/* Enhanced Filters Section */}
            <Fade in={true} timeout={600}>
              <Card sx={{ mb: 4, borderRadius: 3, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    <FilterAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filters & Search
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    startIcon={<FilterAltIcon />}
                  >
                    {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {/* Basic Filters */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                              <ClearIcon />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Student</InputLabel>
                      <Select
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        label="Student"
                      >
                        <MenuItem value="ALL">All Students</MenuItem>
                        {students.map((student) => (
                          <MenuItem key={student.id} value={student.id}>
                            {student.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>University</InputLabel>
                      <Select
                        value={universityFilter}
                        onChange={(e) => setUniversityFilter(e.target.value)}
                        label="University"
                      >
                        <MenuItem value="ALL">All Universities</MenuItem>
                        {universities.map((university) => (
                          <MenuItem key={university.id} value={university.id}>
                            {university.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label="Sort By"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <Fade in={showAdvancedFilters} timeout={400}>
                    <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        Advanced Filters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                              value={priorityFilter}
                              onChange={(e) => setPriorityFilter(e.target.value)}
                              label="Priority"
                            >
                              <MenuItem value="ALL">All Priorities</MenuItem>
                              <MenuItem value="HIGH">High Priority</MenuItem>
                              <MenuItem value="MEDIUM">Medium Priority</MenuItem>
                              <MenuItem value="LOW">Low Priority</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Country</InputLabel>
                            <Select
                              value={countryFilter}
                              onChange={(e) => setCountryFilter(e.target.value)}
                              label="Country"
                            >
                              <MenuItem value="ALL">All Countries</MenuItem>
                              <MenuItem value="US">United States</MenuItem>
                              <MenuItem value="CA">Canada</MenuItem>
                              <MenuItem value="UK">United Kingdom</MenuItem>
                              <MenuItem value="AU">Australia</MenuItem>
                              <MenuItem value="DE">Germany</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Intake</InputLabel>
                            <Select
                              value={intakeFilter}
                              onChange={(e) => setIntakeFilter(e.target.value)}
                              label="Intake"
                            >
                              <MenuItem value="ALL">All Intakes</MenuItem>
                              <MenuItem value="FALL">Fall</MenuItem>
                              <MenuItem value="SPRING">Spring</MenuItem>
                              <MenuItem value="SUMMER">Summer</MenuItem>
                              <MenuItem value="WINTER">Winter</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('ALL');
                              setStudentFilter('ALL');
                              setUniversityFilter('ALL');
                              setPriorityFilter('ALL');
                              setCountryFilter('ALL');
                              setIntakeFilter('ALL');
                              setSortBy('deadline_asc');
                            }}
                            startIcon={<ClearIcon />}
                          >
                            Clear All
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Fade>
                )}
              </Card>
            </Fade>

            {/* Stats Cards */}
        <Fade in={true} timeout={800}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                border: `1px solid ${theme.palette.primary[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Applications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
                border: `1px solid ${theme.palette.warning[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.info[50]} 0%, ${theme.palette.info[100]} 100%)`,
                border: `1px solid ${theme.palette.info[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {stats.submitted}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Submitted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                border: `1px solid ${theme.palette.primary[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {stats.underReview}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Under Review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
                border: `1px solid ${theme.palette.success[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {stats.accepted}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Accepted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.error[50]} 0%, ${theme.palette.error[100]} 100%)`,
                border: `1px solid ${theme.palette.error[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Filters */}
        <Fade in={true} timeout={1000}>
          <Card sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filters & Search
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? "contained" : "outlined"}
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    variant="outlined"
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
                
                {showFilters && (
                  <>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Status"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Student</InputLabel>
                        <Select
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                          label="Student"
                        >
                          <MenuItem value="ALL">All Students</MenuItem>
                          {students.map((student) => (
                            <MenuItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>University</InputLabel>
                        <Select
                          value={universityFilter}
                          onChange={(e) => setUniversityFilter(e.target.value)}
                          label="University"
                        >
                          <MenuItem value="ALL">All Universities</MenuItem>
                          {universities.map((university) => (
                            <MenuItem key={university.id} value={university.id}>
                              {university.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          label="Sort By"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <Fade in={true} timeout={800}>
            <Card sx={{ mb: 3, backgroundColor: theme.palette.primary[50] }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {selectedApplications.length} application(s) selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setBulkActionDialog(true)}
                    >
                      Bulk Actions
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedApplications([])}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Applications View */}
        <Grow in={true} timeout={1200}>
          {viewMode === 'table' ? (
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedApplications.length === applications.length && applications.length > 0}
                        indeterminate={selectedApplications.length > 0 && selectedApplications.length < applications.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>University</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => {
                    // Use included data from backend if available, otherwise fallback to separate arrays
                    const student = application.student || students.find(s => s.id === application.studentId);
                    const university = application.university || universities.find(u => u.id === application.universityId);
                    const isOverdueApp = isOverdue(application.applicationDeadline);
                    const isDueSoonApp = isDueSoon(application.applicationDeadline);
                    
                    return (
                      <TableRow 
                        key={application.id} 
                        hover
                        sx={{
                          backgroundColor: isOverdueApp ? theme.palette.error[50] : 
                                          isDueSoonApp ? theme.palette.warning[50] : 'transparent'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedApplications.includes(application.id)}
                            onChange={() => handleSelectApplication(application.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: isOverdueApp ? theme.palette.error.main : 
                                       isDueSoonApp ? theme.palette.warning.main : 
                                       theme.palette.primary.main 
                            }}>
                              <AssignmentIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                #{application.id}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {format(new Date(application.createdAt), 'MMM d, yyyy')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {student ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {student.firstName} {student.lastName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {university ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SchoolIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {university.name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {application.courseName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={APPLICATION_STATUS.find(s => s.value === (application.status || application.applicationStatus))?.label}
                            color={getStatusColor(application.status || application.applicationStatus)}
                            size="small"
                            icon={
                              (application.status || application.applicationStatus) === 'ACCEPTED' ? <CheckCircleIcon /> :
                              (application.status || application.applicationStatus) === 'PENDING' ? <WarningIcon /> :
                              (application.status || application.applicationStatus) === 'REJECTED' ? <ErrorIcon /> : null
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                            <Typography 
                              variant="body2"
                              sx={{ 
                                color: isOverdueApp ? theme.palette.error.main : 
                                      isDueSoonApp ? theme.palette.warning.main : 'inherit'
                              }}
                            >
                              {format(new Date(application.applicationDeadline), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          {(isOverdueApp || isDueSoonApp) && (
                            <Chip
                              label={isOverdueApp ? 'OVERDUE' : `Due in ${differenceInDays(new Date(application.applicationDeadline), new Date())} days`}
                              color={isOverdueApp ? 'error' : 'warning'}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog('edit', application)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(application.id)}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {applications.length === 0 && !loading && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.text.secondary
              }}>
                <AssignmentIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No applications found
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {searchQuery || statusFilter !== 'ALL' || studentFilter !== 'ALL' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding your first application'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('add')}
                >
                  Add Application
                </Button>
              </Box>
            )}

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
          ) : (
            <Box>
              <ApplicationCardView
                applications={applications}
                onEdit={handleEditApplication}
                onDelete={handleDeleteApplication}
                onView={handleViewApplication}
                getApplicationStatusColor={getApplicationStatusColor}
                getApplicationStatusIcon={getApplicationStatusIcon}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
              />
              
              {applications.length === 0 && !loading && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  color: theme.palette.text.secondary
                }}>
                  <AssignmentIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No applications found
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    {searchQuery || statusFilter !== 'ALL' || studentFilter !== 'ALL' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Start by adding your first application'
                    }
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('add')}
                  >
                    Add Application
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Grow>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <SingleCountryAlert />
            <MultiCountryDashboard />
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select a student to manage their multi-country applications:
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Student</InputLabel>
              <Select
                value={selectedStudentForMultiCountry || ''}
                onChange={(e) => setSelectedStudentForMultiCountry(e.target.value)}
                label="Select Student"
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedStudentForMultiCountry && (
              <MultiCountryApplicationManager studentId={selectedStudentForMultiCountry} />
            )}
          </Box>
        )}

      {/* Add/Edit Application Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Application' : 'Edit Application'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    label="Student"
                    required
                  >
                    {students.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>University</InputLabel>
                  <Select
                    value={formData.universityId}
                    onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    label="University"
                    required
                  >
                    {universities.map((university) => (
                      <MenuItem key={university.id} value={university.id}>
                        {university.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Course Name"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application Deadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    {APPLICATION_STATUS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application Fee"
                  value={formData.applicationFee}
                  onChange={(e) => setFormData({ ...formData, applicationFee: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Interview Date"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Offer Deadline"
                  type="date"
                  value={formData.offerDeadline}
                  onChange={(e) => setFormData({ ...formData, offerDeadline: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Documents Required"
                  value={formData.documentsRequired}
                  onChange={(e) => setFormData({ ...formData, documentsRequired: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'add' ? 'Add Application' : 'Update Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            What would you like to do with {selectedApplications.length} selected application(s)?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="status">Change Status</MenuItem>
              <MenuItem value="delete">Delete Applications</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkAction} 
            variant="contained" 
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            disabled={!bulkAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Container>
  );
}

export default Applications; 