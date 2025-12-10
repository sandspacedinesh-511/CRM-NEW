// src/pages/counselor/StudentList.js
import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress, Container, Paper, Divider, useTheme, Fade, Grow, Skeleton, Chip, Grid,
  Card, CardContent, CardHeader, Avatar, IconButton, Tooltip, Badge, Stack, LinearProgress, useMediaQuery, alpha,
  Breadcrumbs, Link, AlertTitle, Snackbar, Fab, Drawer, AppBar, Toolbar, Collapse, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails,
  List, ListItem, ListItemText, ListItemAvatar, ListItemSecondaryAction, Switch, FormControlLabel, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox
} from '@mui/material';
import {
  Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon, FilterList as FilterIcon, Sort as SortIcon,
  ViewList as ViewListIcon, ViewModule as ViewModuleIcon, GridView as GridViewIcon, List as ListIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, MoreVert as MoreIcon, TrendingUp as TrendingUpIcon,
  People as PeopleIcon, School as SchoolIcon, Assignment as AssignmentIcon, CheckCircle as CheckCircleIcon,
  Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon, CalendarToday as CalendarIcon,
  LocationOn as LocationIcon, Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon,
  Psychology as PsychologyIcon, Engineering as EngineeringIcon, Verified as VerifiedIcon,
  Timeline as TimelineIcon, Analytics as AnalyticsIcon, Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon, EmailOutlined as EmailOutlinedIcon,
  Phone as PhoneIcon2, LocationOn as LocationIcon2, Language as LanguageIcon, Public as PublicIcon,
  Cloud as CloudIcon, Storage as StorageIcon, Restore as RestoreIcon, Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon, Menu as MenuIcon, Clear as ClearIcon, FilterAlt as FilterAltIcon,
  Tune as TuneIcon, Apps as AppsIcon, ViewColumn as ViewColumnIcon, ViewHeadline as ViewHeadlineIcon,
  ViewStream as ViewStreamIcon, ViewWeek as ViewWeekIcon, ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon, ViewCarousel as ViewCarouselIcon, ViewQuilt as ViewQuiltIcon,
  ViewSidebar as ViewSidebarIcon, ViewTimeline as ViewTimelineIcon, ViewComfyAlt as ViewComfyAltIcon,
  ViewCompact as ViewCompactIcon, ViewCompactAlt as ViewCompactAltIcon, ViewCozy as ViewCozyIcon,
  ViewInAr as ViewInArIcon, ViewKanban as ViewKanbanIcon, ViewListAlt as ViewListAltIcon,
  ViewModuleAlt as ViewModuleAltIcon, ViewQuiltAlt as ViewQuiltAltIcon, ViewSidebarAlt as ViewSidebarAltIcon,
  ViewTimelineAlt as ViewTimelineAltIcon, ViewWeekAlt as ViewWeekAltIcon, ViewDayAlt as ViewDayAltIcon,
  ViewAgendaAlt as ViewAgendaAltIcon, ViewCarouselAlt as ViewCarouselAltIcon,
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
  ExpandLess as ExpandLessIcon, Close as CloseIcon, Download as DownloadIcon, Upload as UploadIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import axiosInstance from '../../utils/axios';
import AddStudentModal from './AddStudentModal';
import StudentPhaseCard from '../../components/counselor/StudentPhaseCard';

const PHASES = [
  'DOCUMENT_COLLECTION',
  'UNIVERSITY_SHORTLISTING',
  'APPLICATION_SUBMISSION',
  'OFFER_RECEIVED',
  'INITIAL_PAYMENT',
  'INTERVIEW',
  'FINANCIAL_TB_TEST',
  'CAS_VISA',
  'VISA_APPLICATION',
  'ENROLLMENT'
];

function StudentList() {
  const { setModalOpen } = useModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareStudent, setShareStudent] = useState(null);
  const [shareTargetCounselorId, setShareTargetCounselorId] = useState('');
  const [shareCounselors, setShareCounselors] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [pendingSharedLeads, setPendingSharedLeads] = useState([]);
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [selectedStudentForCountry, setSelectedStudentForCountry] = useState(null);
  const [countryLoading, setCountryLoading] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/students', {
        params: {
          search: searchTerm,
          phase: phaseFilter !== 'ALL' ? phaseFilter : undefined,
          sort: `${sortBy}_${sortOrder}`,
          page: page + 1,
          limit: rowsPerPage
        }
      });

      if (response.data.success) {
        setStudents(response.data.data.students);
        setFilteredStudents(response.data.data.students);
      } else {
        setStudents([]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSharedLeads = async () => {
    try {
      const response = await axiosInstance.get('/shared-leads/pending');
      if (response.data.success) {
        setPendingSharedLeads(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending shared leads:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchPendingSharedLeads();
  }, [searchTerm, phaseFilter, statusFilter, sortBy, sortOrder, page, rowsPerPage]);

  const fetchShareCounselors = async () => {
    try {
      setShareError(null);
      const response = await axiosInstance.get('/counselor/counselors');
      if (response.data?.success) {
        setShareCounselors(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setShareCounselors(response.data);
      } else {
        setShareCounselors([]);
      }
    } catch (error) {
      console.error('Error fetching counselors for sharing:', error);
      setShareError('Failed to load counselors. Please try again.');
      setShareCounselors([]);
    }
  };

  const handleOpenShareDialog = (student) => {
    setShareStudent(student);
    setShareTargetCounselorId('');
    setShareDialogOpen(true);
    fetchShareCounselors();
  };

  const handleOpenCountryDialog = (student) => {
    setSelectedStudentForCountry(student);
    setCountryDialogOpen(true);
  };

  const handleCreateCountryProfile = async (country) => {
    if (!selectedStudentForCountry) {
      setError('No student selected');
      return;
    }

    if (!country) {
      setError('No country selected');
      return;
    }

    try {
      setCountryLoading(true);
      setError(null);
      
      const payload = {
        studentId: parseInt(selectedStudentForCountry.id, 10),
        country: country
      };

      console.log('Creating country profile with payload:', payload);
      console.log('Selected student:', selectedStudentForCountry);

      const response = await axiosInstance.post('/counselor/students/country-profile', payload);

      if (response.data.success) {
        setCountryDialogOpen(false);
        setSelectedStudentForCountry(null);
        setSuccess(`Country profile for ${country} created successfully! Application progress starts from the beginning.`);
        setTimeout(() => setSuccess(null), 5000);
        fetchStudents();
      } else {
        setError(response.data.message || 'Failed to create country profile');
      }
    } catch (error) {
      console.error('Error creating country profile:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to create country profile. Please try again.';
      setError(errorMsg);
    } finally {
      setCountryLoading(false);
    }
  };

  const handleShareLead = async () => {
    if (!shareStudent || !shareTargetCounselorId) return;

    try {
      setShareLoading(true);
      setShareError(null);
      await axiosInstance.post(`/shared-leads/share/${shareStudent.id}`, {
        counselorId: shareTargetCounselorId
      });

      await fetchStudents();
      await fetchPendingSharedLeads();

      setShareDialogOpen(false);
      setShareStudent(null);
      setShareTargetCounselorId('');
      setSuccess('Lead share request sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error sharing lead:', error);
      const msg =
        error.response?.data?.message ||
        'Failed to share lead. Please try again.';
      setShareError(msg);
    } finally {
      setShareLoading(false);
    }
  };

  const handleAddStudentSuccess = () => {
    setOpenAddStudent(false);
    fetchStudents();
    setSuccess('Student added successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleViewStudentDetails = (studentId) => {
    navigate(`/counselor/students/${studentId}`);
  };

  const handleEditStudent = (studentId) => {
    navigate(`/counselor/students/${studentId}/edit`);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await axiosInstance.delete(`/counselor/students/${studentToDelete.id}`);
      setSuccess('Student deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setOpenDeleteDialog(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (error) {
      setError('Failed to delete student. Please try again.');
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const deletePromises = selectedStudents.map(studentId =>
        axiosInstance.delete(`/counselor/students/${studentId}`)
      );

      await Promise.all(deletePromises);

      setSuccess(`${selectedStudents.length} student(s) deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      setOpenBulkDeleteDialog(false);
      setSelectedStudents([]);
      fetchStudents();
    } catch (error) {
      console.error('Error bulk deleting students:', error);
      setError(`Failed to delete some students. Please try again.`);
    }
  };

  const handlePhaseChange = async (studentId, newPhase) => {
    try {
      await axiosInstance.patch(`/counselor/students/${studentId}/phase`, {
        currentPhase: newPhase
      });
      fetchStudents();
      setSuccess('Student phase updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating student phase:', error);
      if (error.response?.data?.message && error.response?.data?.missingDocuments) {
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

  const handleSort = (property) => {
    const isAsc = sortBy === property && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    const selectedIndex = selectedStudents.indexOf(studentId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedStudents, studentId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedStudents.slice(1));
    } else if (selectedIndex === selectedStudents.length - 1) {
      newSelected = newSelected.concat(selectedStudents.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedStudents.slice(0, selectedIndex),
        selectedStudents.slice(selectedIndex + 1),
      );
    }

    setSelectedStudents(newSelected);
  };

  const getPhaseColor = (phase) => {
    const colors = {
      DOCUMENT_COLLECTION: theme.palette.primary.main,
      UNIVERSITY_SHORTLISTING: theme.palette.warning.main,
      APPLICATION_SUBMISSION: theme.palette.secondary.main,
      OFFER_RECEIVED: theme.palette.success.main,
      INITIAL_PAYMENT: theme.palette.info.main,
      INTERVIEW: theme.palette.warning.dark,
      FINANCIAL_TB_TEST: theme.palette.error.main,
      CAS_VISA: theme.palette.success.dark,
      VISA_APPLICATION: theme.palette.warning.light,
      ENROLLMENT: theme.palette.primary.dark
    };
    return colors[phase] || theme.palette.grey[500];
  };

  const formatPhaseLabel = (phase) => {
    if (!phase) return 'Not Started';
    return phase.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return theme.palette.success.main;
      case 'DEFERRED': return theme.palette.warning.main;
      case 'REJECTED': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const LoadingSkeleton = () => (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 2 }} />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
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
        <Fade in={true} timeout={600}>
          <Box sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 4,
            p: 4,
            mb: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 3
            }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Breadcrumbs sx={{ mb: 2, opacity: 0.8 }}>
                  <Link color="inherit" href="/counselor/dashboard" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Dashboard
                  </Link>
                  <Typography color="text.primary" sx={{ fontWeight: 600 }}>Students</Typography>
                </Breadcrumbs>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    lineHeight: 1.2
                  }}
                >
                  Student Management
                </Typography>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 3, opacity: 0.8, fontWeight: 400 }}>
                  Manage and track your students' progress through the application process
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${students.length} Students`}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontWeight: 600,
                      height: 32
                    }}
                  />
                  <Chip
                    label={`Last updated: ${new Date().toLocaleTimeString()}`}
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.grey[500], 0.1),
                      color: theme.palette.text.secondary,
                      border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStudents}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setOpenAddStudent(true);
                    setModalOpen(true);
                  }}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Add Student
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

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

        <Paper elevation={0} sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.common.white, 0.9)} 100%)`,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(theme.palette.secondary.main, 0.3)})`,
            borderRadius: '4px 4px 0 0'
          }
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.common.white, 0.8),
                    '&:hover': {
                      backgroundColor: theme.palette.common.white,
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme.palette.common.white,
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                  label="Phase"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.common.white, 0.8),
                      '&:hover': {
                        backgroundColor: theme.palette.common.white,
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.common.white,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }
                  }}
                >
                  <MenuItem value="ALL">All Phases</MenuItem>
                  {PHASES.map((phase) => (
                    <MenuItem key={phase} value={phase}>
                      {formatPhaseLabel(phase)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.common.white, 0.8),
                      '&:hover': {
                        backgroundColor: theme.palette.common.white,
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.common.white,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }
                  }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="DEFERRED">Deferred</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.common.white, 0.8),
                      '&:hover': {
                        backgroundColor: theme.palette.common.white,
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.common.white,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }
                  }}
                >
                  <MenuItem value="createdAt">Date Added</MenuItem>
                  <MenuItem value="firstName">First Name</MenuItem>
                  <MenuItem value="lastName">Last Name</MenuItem>
                  <MenuItem value="currentPhase">Phase</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Tooltip title="Grid View">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    sx={{
                      backgroundColor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: viewMode === 'grid' ? theme.palette.primary.main : theme.palette.text.secondary,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <GridViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    onClick={() => setViewMode('list')}
                    sx={{
                      backgroundColor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: viewMode === 'list' ? theme.palette.primary.main : theme.palette.text.secondary,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <ViewListIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {selectedStudents.length > 0 && (
          <Fade in={true} timeout={300}>
            <Paper elevation={2} sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
                borderRadius: '3px 3px 0 0'
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedStudents.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                      {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''} Selected
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Choose an action to perform on selected students
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedStudents([])}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: alpha(theme.palette.grey[400], 0.5),
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme.palette.grey[400],
                        backgroundColor: alpha(theme.palette.grey[400], 0.05)
                      }
                    }}
                  >
                    Cancel Selection
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenBulkDeleteDialog(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
                        background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Delete Selected
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Fade>
        )}

        {loading && (
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {[...Array(8)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Skeleton
                  variant="rectangular"
                  height={280}
                  sx={{ borderRadius: 3, mb: 2 }}
                />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1, mt: 1 }} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredStudents.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.5)} 0%, ${alpha(theme.palette.common.white, 0.8)} 100%)`,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.grey[200], 0.5)}`
          }}>
            <PeopleIcon sx={{ fontSize: 80, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
              No students found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3, opacity: 0.8 }}>
              {searchTerm || phaseFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters'
                : 'Get started by adding your first student'
              }
            </Typography>
            {!searchTerm && phaseFilter === 'ALL' && statusFilter === 'ALL' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setOpenAddStudent(true);
                  setModalOpen(true);
                }}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Add Your First Student
              </Button>
            )}
          </Box>
        )}

        {!loading && filteredStudents.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={4} sx={{ mb: 4 }}>
                {filteredStudents.map((student) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                    <StudentPhaseCard
                      student={student}
                      onPhaseChange={handlePhaseChange}
                      onViewDetails={handleViewStudentDetails}
                      onEditStudent={handleEditStudent}
                      onShareLead={handleOpenShareDialog}
                      onCreateCountryProfile={handleOpenCountryDialog}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.grey[200], 0.5)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.3)} 0%, ${alpha(theme.palette.common.white, 0.9)} 100%)`
              }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      '& .MuiTableCell-head': {
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'firstName'}
                            direction={sortBy === 'firstName' ? sortOrder : 'asc'}
                            onClick={() => handleSort('firstName')}
                          >
                            Student Name
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'currentPhase'}
                            direction={sortBy === 'currentPhase' ? sortOrder : 'asc'}
                            onClick={() => handleSort('currentPhase')}
                          >
                            Phase
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'status'}
                            direction={sortBy === 'status' ? sortOrder : 'asc'}
                            onClick={() => handleSort('status')}
                          >
                            Status
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'createdAt'}
                            direction={sortBy === 'createdAt' ? sortOrder : 'asc'}
                            onClick={() => handleSort('createdAt')}
                          >
                            Created
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedStudents.indexOf(student.id) !== -1}
                              onChange={() => handleSelectStudent(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {`${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {student.firstName} {student.lastName}
                                </Typography>
                                {pendingSharedLeads.some(share => share.studentId === student.id && share.senderId === user.id) && (
                                  <Chip
                                    label="Share Pending"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={formatPhaseLabel(student.currentPhase)}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getPhaseColor(student.currentPhase), 0.1),
                                color: getPhaseColor(student.currentPhase),
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.status}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(student.status), 0.1),
                                color: getStatusColor(student.status),
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(student.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewStudentDetails(student.id)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Share Lead">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenShareDialog(student)}
                                >
                                  <PersonAddIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Student">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditStudent(student.id)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Add Country Profile">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCountryDialog(student);
                                  }}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Student">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setOpenDeleteDialog(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredStudents.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </Paper>
            )}
          </>
        )}

        <AddStudentModal
          key={openAddStudent ? 'open' : 'closed'}
          open={openAddStudent}
          onClose={() => setOpenAddStudent(false)}
          onSuccess={handleAddStudentSuccess}
        />

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {studentToDelete?.firstName} {studentToDelete?.lastName}?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteStudent} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openBulkDeleteDialog}
          onClose={() => setOpenBulkDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: theme.palette.error.main,
            fontWeight: 600
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main
            }}>
              <DeleteIcon />
            </Box>
            Bulk Delete Students
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete <strong>{selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}</strong>?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              This action cannot be undone and will permanently remove all selected students and their associated data.
            </Typography>
            <Box sx={{
              backgroundColor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 2,
              p: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                ⚠️ Warning: This will delete:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Student profiles and personal information<br />
                • All uploaded documents<br />
                • Application records<br />
                • Task assignments and notes
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={() => setOpenBulkDeleteDialog(false)}
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDeleteStudents}
              color="error"
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`
                }
              }}
            >
              Delete {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={shareDialogOpen}
          onClose={() => {
            if (!shareLoading) {
              setShareDialogOpen(false);
              setShareStudent(null);
              setShareTargetCounselorId('');
              setShareError(null);
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Share Lead
          </DialogTitle>
          <DialogContent>
            {shareStudent && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                Share lead{' '}
                <strong>
                  {shareStudent.firstName} {shareStudent.lastName}
                </strong>{' '}
                with another counselor.
              </Typography>
            )}
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Select Counselor</InputLabel>
              <Select
                label="Select Counselor"
                value={shareTargetCounselorId}
                onChange={(e) => setShareTargetCounselorId(e.target.value)}
              >
                {shareCounselors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {shareError && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={() => setShareError(null)}
              >
                {shareError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (!shareLoading) {
                  setShareDialogOpen(false);
                  setShareStudent(null);
                  setShareTargetCounselorId('');
                  setShareError(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleShareLead}
              disabled={!shareTargetCounselorId || shareLoading}
            >
              {shareLoading ? 'Sharing…' : 'Share Lead'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Country Profile Selection Dialog */}
        <Dialog
          open={countryDialogOpen}
          onClose={() => {
            if (!countryLoading) {
              setCountryDialogOpen(false);
              setSelectedStudentForCountry(null);
            }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}>
              <FlagIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Create Country Profile
              </Typography>
              {selectedStudentForCountry && (
                <Typography variant="body2" color="textSecondary">
                  For {selectedStudentForCountry.firstName} {selectedStudentForCountry.lastName}
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select a country to create a new profile. The application progress will start from the beginning (Document Collection phase).
            </Typography>
            <Grid container spacing={2}>
              {['USA', 'UK', 'Canada', 'Australia', 'Italy', 'Germany', 'France', 'Ireland'].map((country) => (
                <Grid item xs={6} sm={4} key={country}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleCreateCountryProfile(country)}
                    disabled={countryLoading}
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <FlagIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {country}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
            {countryLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (!countryLoading) {
                  setCountryDialogOpen(false);
                  setSelectedStudentForCountry(null);
                }
              }}
              disabled={countryLoading}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {isMobile && (
          <Fab
            color="primary"
            aria-label="add student"
            onClick={() => setOpenAddStudent(true)}
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

export default StudentList;