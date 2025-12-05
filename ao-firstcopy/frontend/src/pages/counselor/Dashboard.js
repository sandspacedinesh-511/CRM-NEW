// src/pages/counselor/Dashboard.js
import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress, Container, Paper, Divider, useTheme, Fade, Grow, Skeleton, Chip, Grid,
  Card, CardContent, CardHeader, Avatar, IconButton, Tooltip, Badge, Stack, LinearProgress, useMediaQuery, alpha,
  Breadcrumbs, Link, AlertTitle, Snackbar, Fab, Drawer, AppBar, Toolbar, Collapse, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, Switch, FormControlLabel, Tabs, Tab
} from '@mui/material';
import { 
  Add as AddIcon, Refresh as RefreshIcon, TrendingUp as TrendingUpIcon, Dashboard as DashboardIcon, People as PeopleIcon,
  School as SchoolIcon, Assignment as AssignmentIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon,
  Info as InfoIcon, CalendarToday as CalendarIcon, LocationOn as LocationIcon, Email as EmailIcon, Phone as PhoneIcon,
  Business as BusinessIcon, Psychology as PsychologyIcon, Engineering as EngineeringIcon, Verified as VerifiedIcon,
  Timeline as TimelineIcon, Analytics as AnalyticsIcon, Notifications as NotificationsIcon, NotificationsActive as NotificationsActiveIcon,
  EmailOutlined as EmailOutlinedIcon, Phone as PhoneIcon2, LocationOn as LocationIcon2, Language as LanguageIcon,
  Public as PublicIcon, Cloud as CloudIcon, Storage as StorageIcon, Restore as RestoreIcon, Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon, Menu as MenuIcon, Search as SearchIcon, Clear as ClearIcon, Sort as SortIcon,
  FilterAlt as FilterAltIcon, Tune as TuneIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon, GridView as GridViewIcon, List as ListIcon, Apps as AppsIcon, ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon, ViewStream as ViewStreamIcon, ViewWeek as ViewWeekIcon, ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon, ViewCarousel as ViewCarouselIcon, ViewQuilt as ViewQuiltIcon, ViewSidebar as ViewSidebarIcon,
  ViewTimeline as ViewTimelineIcon, ViewComfyAlt as ViewComfyAltIcon, ViewCompact as ViewCompactIcon,
  ViewCompactAlt as ViewCompactAltIcon, ViewCozy as ViewCozyIcon, ViewInAr as ViewInArIcon, ViewKanban as ViewKanbanIcon,
  ViewListAlt as ViewListAltIcon, ViewModuleAlt as ViewModuleAltIcon, ViewQuiltAlt as ViewQuiltAltIcon,
  ViewSidebarAlt as ViewSidebarAltIcon, ViewTimelineAlt as ViewTimelineAltIcon, ViewWeekAlt as ViewWeekAltIcon,
  ViewDayAlt as ViewDayAltIcon, ViewAgendaAlt as ViewAgendaAltIcon, ViewCarouselAlt as ViewCarouselAltIcon,
  ViewComfyAlt2 as ViewComfyAlt2Icon, ViewCompactAlt2 as ViewCompactAlt2Icon, ViewCozyAlt as ViewCozyAltIcon,
  ViewInArAlt as ViewInArAltIcon, ViewKanbanAlt as ViewKanbanAltIcon, ViewListAlt2 as ViewListAlt2Icon,
  ViewModuleAlt2 as ViewModuleAlt2Icon, ViewQuiltAlt2 as ViewQuiltAlt2Icon, ViewSidebarAlt2 as ViewSidebarAlt2Icon,
  ViewTimelineAlt2 as ViewTimelineAlt2Icon, ViewWeekAlt2 as ViewWeekAlt2Icon, ViewDayAlt2 as ViewDayAlt2Icon,
  ViewAgendaAlt2 as ViewAgendaAlt2Icon, ViewCarouselAlt2 as ViewCarouselAlt2Icon, Lock as LockIcon,
  LockOpen as LockOpenIcon, VpnKey as VpnKeyIcon, Shield as ShieldIcon, Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon, AdminPanelSettings as AdminPanelSettingsIcon, SupervisedUserCircle as SupervisedUserCircleIcon,
  Group as GroupIcon, Person as PersonIcon, PersonAdd as PersonAddIcon, PersonRemove as PersonRemoveIcon,
  PersonOff as PersonOffIcon, PersonOutline as PersonOutlineIcon, AccountCircle as AccountCircleIcon,
  AccountBox as AccountBoxIcon, AccountBalance as AccountBalanceIcon, AccountBalanceWallet as AccountBalanceWalletIcon,
  AccountTree as AccountTreeIcon, AccountCircleOutlined as AccountCircleOutlinedIcon, AccountBoxOutlined as AccountBoxOutlinedIcon,
  AccountBalanceOutlined as AccountBalanceOutlinedIcon, AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon, PersonAddAlt as PersonAddAltIcon, PersonRemoveAlt as PersonRemoveAltIcon,
  PersonOffAlt as PersonOffAltIcon, PersonOutlineAlt as PersonOutlineAltIcon, AccountCircleAlt as AccountCircleAltIcon,
  AccountBoxAlt as AccountBoxAltIcon, AccountBalanceAlt as AccountBalanceAltIcon, AccountBalanceWalletAlt as AccountBalanceWalletAltIcon,
  AccountTreeAlt as AccountTreeAltIcon, AccountCircleOutlinedAlt as AccountCircleOutlinedAltIcon,
  AccountBoxOutlinedAlt as AccountBoxOutlinedAltIcon, AccountBalanceOutlinedAlt as AccountBalanceOutlinedAltIcon,
  AccountBalanceWalletOutlinedAlt as AccountBalanceWalletOutlinedAltIcon, AccountTreeOutlinedAlt as AccountTreeOutlinedAltIcon,
  Speed as SpeedIcon, Star as StarIcon, Bolt as BoltIcon, MoreVert as MoreVertIcon, ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon, Close as CloseIcon, Download as DownloadIcon, Upload as UploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import axiosInstance from '../../utils/axios';
import useWebSocket from '../../hooks/useWebSocket';
import AddStudentModal from './AddStudentModal';
import DashboardStats from '../../components/counselor/DashboardStats';
import TaskList from '../../components/counselor/TaskList';
import StudentPhaseCard from '../../components/counselor/StudentPhaseCard';
import ProgressOverview from '../../components/counselor/ProgressOverview';
import ProgressAlerts from '../../components/counselor/ProgressAlerts';
import ProgressExport from '../../components/counselor/ProgressExport';
import ProgressAnalytics from '../../components/counselor/ProgressAnalytics';
import SingleCountryAlert from '../../components/counselor/SingleCountryAlert';

function CounselorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      activeApplications: 0,
      pendingDocuments: 0,
      upcomingDeadlines: 0
    },
    recentStudents: [],
    upcomingTasks: [],
    phaseDistribution: [],
    universityDistribution: []
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { isAnyModalOpen, setModalOpen } = useModal();

  // WebSocket integration for real-time updates
  const { isConnected, onEvent, joinRoom } = useWebSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/dashboard');
      setDashboardData(response.data);
      setSuccess('Dashboard data refreshed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 30 seconds if enabled AND no modal is open
    if (autoRefresh && !isAnyModalOpen) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isAnyModalOpen]);

  // Join dashboard room for real-time updates
  useEffect(() => {
    if (isConnected && user?.role === 'counselor') {
      joinRoom(`counselor:${user.id}`);
    }
  }, [isConnected, user, joinRoom]);

  // Listen for real-time dashboard updates
  useEffect(() => {
    if (!isConnected) return;

    const cleanupDashboardUpdate = onEvent('dashboard_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        ...data
      }));
      setSuccess('Dashboard updated in real-time!');
      setTimeout(() => setSuccess(null), 2000);
    });

    const cleanupApplicationUpdate = onEvent('application_status_changed', (data) => {
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          activeApplications: data.status === 'ACCEPTED' 
            ? prev.stats.activeApplications + 1 
            : prev.stats.activeApplications
        }
      }));
    });

    const cleanupDocumentUpload = onEvent('document_uploaded', (data) => {
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          pendingDocuments: Math.max(0, prev.stats.pendingDocuments - 1)
        }
      }));
    });

    return () => {
      cleanupDashboardUpdate?.();
      cleanupApplicationUpdate?.();
      cleanupDocumentUpload?.();
    };
  }, [isConnected, onEvent]);

  const handleAddStudentSuccess = () => {
    setOpenAddStudent(false);
    setModalOpen(false);
    fetchDashboardData();
    setSuccess('Student added successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOpenAddStudent = () => {
    setOpenAddStudent(true);
    setModalOpen(true);
  };

  const handleCloseAddStudent = () => {
    setOpenAddStudent(false);
    setModalOpen(false);
  };

  const handleViewStudentDetails = (studentId) => {
    navigate(`/counselor/students/${studentId}`);
  };

  const handleExportProgress = (exportData) => {
    try {
      // This would call your export endpoint
      console.log('Exporting progress data:', exportData);
      setSuccess(`Exporting ${exportData.students.length} students as ${exportData.type.toUpperCase()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to export data. Please try again.');
    }
  };

  const handlePhaseChange = async (studentId, newPhase) => {
    try {
      await axiosInstance.patch(`/counselor/students/${studentId}/phase`, {
        currentPhase: newPhase
      });
      fetchDashboardData();
      setSuccess('Student phase updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating student phase:', error);
      if (error.response?.data?.message && error.response?.data?.missingDocuments) {
        // Show detailed error message for document requirement errors
        const errorData = error.response.data;
        const missingDocsList = errorData.missingDocuments.map(doc => 
          `• ${doc.replace(/_/g, ' ')}`
        ).join('\n');
        
        const detailedMessage = `🚫 Cannot proceed to ${errorData.phaseName} phase

${errorData.phaseDescription || ''}

📋 Missing Required Documents:
${missingDocsList}

💡 Next Steps:
1. Upload the missing documents in the Documents section
2. Ensure documents are in PDF, JPG, or PNG format
3. Wait for document approval (if applicable)
4. Try changing the phase again

Need help? Contact your counselor for assistance.`;

        setError(detailedMessage);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to update student phase. Please try again.');
      }
    }
  };

  // UI Components
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
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
            {trend && (
              <Chip
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                size="small"
                color={trend > 0 ? 'success' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: color }}>
            {value}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  const LoadingSkeleton = () => (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 2 }} />
        </Box>

        {/* Stats Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>

        {/* Charts Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>

        {/* Content Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );

  if (loading) {
    return <LoadingSkeleton />;
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
              <Breadcrumbs sx={{ mb: 2 }}>
                <Link color="inherit" href="/counselor">
                  Counselor
                </Link>
                <Typography color="text.primary">Dashboard</Typography>
              </Breadcrumbs>
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
                Welcome back, {user?.name?.split(' ')[0] || 'Counselor'}!
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                Here's what's happening with your students today
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  icon={<TrendingUpIcon />} 
                  label="Dashboard Overview" 
                  color="primary" 
                  variant="outlined"
                  size="small"
                />
                <Typography variant="caption" color="textSecondary">
                  Last updated: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                startIcon={<AddIcon />}
                onClick={handleOpenAddStudent}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                Add Student
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            <AlertTitle>Success</AlertTitle>
            {success}
          </Alert>
        )}

        {/* Main Stats Cards */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Students"
              value={dashboardData.stats.totalStudents}
              icon={<PeopleIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />}
              color={theme.palette.primary.main}
              subtitle="Registered students"
              trend={12}
              badge={dashboardData.stats.totalStudents > 0 ? dashboardData.stats.totalStudents : null}
              onClick={() => navigate('/counselor/students')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Applications"
              value={dashboardData.stats.activeApplications}
              icon={<AssignmentIcon sx={{ fontSize: 28, color: theme.palette.success.main }} />}
              color={theme.palette.success.main}
              subtitle="In progress"
              trend={8}
              badge={dashboardData.stats.activeApplications > 0 ? dashboardData.stats.activeApplications : null}
              onClick={() => navigate('/counselor/applications')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Documents"
              value={dashboardData.stats.pendingDocuments}
              icon={<SchoolIcon sx={{ fontSize: 28, color: theme.palette.warning.main }} />}
              color={theme.palette.warning.main}
              subtitle="Awaiting upload"
              trend={-3}
              badge={dashboardData.stats.pendingDocuments > 0 ? dashboardData.stats.pendingDocuments : null}
              onClick={() => navigate('/counselor/documents')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Upcoming Deadlines"
              value={dashboardData.stats.upcomingDeadlines}
              icon={<CalendarIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />}
              color={theme.palette.error.main}
              subtitle="Due soon"
              trend={5}
              badge={dashboardData.stats.upcomingDeadlines > 0 ? dashboardData.stats.upcomingDeadlines : null}
              onClick={() => navigate('/counselor/tasks')}
            />
          </Grid>
        </Grid>

        {/* Dashboard Content */}
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{ 
                px: 2,
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.875rem',
                  fontWeight: 600
                }
              }}
            >
              <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
              <Tab label="Progress Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
              <Tab label="Recent Students" icon={<PeopleIcon />} iconPosition="start" />
              <Tab label="Tasks & Alerts" icon={<AssignmentIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Overview Tab */}
            {activeTab === 0 && (
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <SingleCountryAlert />
                </Grid>
                <Grid item xs={12} lg={8}>
                  <ProgressOverview students={dashboardData.recentStudents} />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Stack spacing={3}>
                    <ProgressAlerts students={dashboardData.recentStudents} />
                    <ProgressExport onExport={handleExportProgress} />
                  </Stack>
                </Grid>
              </Grid>
            )}

            {/* Progress Analytics Tab */}
            {activeTab === 1 && (
              <ProgressAnalytics students={dashboardData.recentStudents} />
            )}

            {/* Recent Students Tab */}
            {activeTab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent Students
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/counselor/students')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    View All Students
                  </Button>
                </Box>
                <Grid container spacing={3}>
                  {dashboardData.recentStudents.map((student) => (
                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                      <StudentPhaseCard
                        student={student}
                        onPhaseChange={handlePhaseChange}
                        onViewDetails={handleViewStudentDetails}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Tasks & Alerts Tab */}
            {activeTab === 3 && (
              <Grid container spacing={4}>
                <Grid item xs={12} lg={8}>
                  <TaskList tasks={dashboardData.upcomingTasks} />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <ProgressAlerts students={dashboardData.recentStudents} />
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Add Student Modal */}
        <AddStudentModal
          key={openAddStudent ? 'open' : 'closed'} // Prevent reset when parent re-renders
          open={openAddStudent}
          onClose={handleCloseAddStudent}
          onSuccess={handleAddStudentSuccess}
        />

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add student"
            onClick={handleOpenAddStudent}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </Container>
  );
}

export default CounselorDashboard;