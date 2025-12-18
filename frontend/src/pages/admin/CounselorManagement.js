// src/pages/admin/CounselorManagement.js
import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  CircularProgress, Alert, Switch, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, TablePagination, TableSortLabel,
  DialogContentText, InputAdornment, Card, CardContent,
  Grid, Chip, Avatar, LinearProgress, Checkbox,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
  Divider, List, ListItem, ListItemText, ListItemAvatar,
  Badge, Fab, Drawer, AppBar, Toolbar, useTheme,
  useMediaQuery, Accordion, AccordionSummary, AccordionDetails,
  Fade, Grow, alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import RealTimeActivityFeed from '../../components/common/RealTimeActivityFeed';
import { format } from 'date-fns';

function CounselorManagement() {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // WebSocket integration
  const { isConnected, onEvent, joinRoom } = useWebSocket();
  const isDeletingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const [counselors, setCounselors] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailDrawer, setOpenDetailDrawer] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedCounselors, setSelectedCounselors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    experience: '',
    bio: ''
  });

  const SPECIALIZATION_OPTIONS = [
    'Engineering & Technology',
    'Business & Management',
    'Medical & Healthcare',
    'Arts & Humanities',
    'Law & Social Sciences',
    'Science & Research',
    'General Counseling'
  ];

  // Helper function to show snackbar messages
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Helper function to clear all messages
  const clearMessages = () => {
    setSnackbarOpen(false);
  };

  const fetchCounselors = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/counselors');

      // Get the counselors data from the correct path
      const counselorsData = response.data.data || response.data || [];

      // Transform the data to include calculated fields
      const transformedCounselors = counselorsData.map(counselor => ({
        ...counselor,
        totalStudents: counselor.totalStudents || 0,
        successfulApplications: counselor.successfulApplications || 0,
        pendingApplications: counselor.pendingApplications || 0,
        avgResponseTime: counselor.avgResponseTime || 'N/A',
        rating: counselor.rating || 0,
        recentActivities: counselor.recentActivities || []
      }));

      setCounselors(transformedCounselors);
    } catch (error) {
      console.error('Error fetching counselors:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load counselors';
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  // Join admin room for real-time updates
  useEffect(() => {
    if (isConnected && user?.role === 'admin') {
      joinRoom('admin:all');
      joinRoom('role:admin');
    }
  }, [isConnected, user, joinRoom]);

  // Listen for real-time counselor updates
  useEffect(() => {
    if (!isConnected) return;

    const cleanupCounselorUpdate = onEvent('counselor_update', (data) => {
      fetchCounselors();
    });

    const cleanupCounselorActivity = onEvent('user_activity_update', (data) => {
      if (data.userRole === 'counselor') {
        setCounselors(prev =>
          prev.map(counselor =>
            counselor.id === data.userId
              ? { ...counselor, lastActivity: data.timestamp }
              : counselor
          )
        );
      }
    });

    return () => {
      cleanupCounselorUpdate?.();
      cleanupCounselorActivity?.();
    };
  }, [isConnected, onEvent]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      return;
    }

    // Client-side validation
    if (!formData.name || !formData.name.trim()) {
      showSnackbar('Name is required', 'error');
      return;
    }

    if (!formData.email || !formData.email.trim()) {
      showSnackbar('Email is required', 'error');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }

    // Password is required only for new counselors
    if (!selectedCounselor && (!formData.password || !formData.password.trim())) {
      showSnackbar('Password is required for new counselors', 'error');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setActionLoading(true);
      clearMessages();

      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || '',
        specialization: formData.specialization || '',
        experience: formData.experience?.trim() || '',
        bio: formData.bio?.trim() || ''
      };

      if (selectedCounselor) {
        await axiosInstance.put(`/admin/counselors/${selectedCounselor.id}`, submitData);
        showSnackbar('Counselor updated successfully!', 'success');
      } else {
        await axiosInstance.post('/admin/counselors', {
          ...submitData,
          password: formData.password.trim()
        });
        showSnackbar('Counselor added successfully!', 'success');
      }

      setOpenModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', specialization: '', experience: '', bio: '' });
      setSelectedCounselor(null);
      fetchCounselors();
    } catch (error) {
      // Extract error message with support for different error formats
      let errorMessage = 'Failed to process counselor';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        }
        // Handle error details if present
        else if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.join(', ');
        }
        // Handle single message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleStatusChange = async (counselorId, newStatus) => {
    try {
      setActionLoading(true);
      clearMessages();

      // Optimistic update
      setCounselors(prev =>
        prev.map(counselor =>
          counselor.id === counselorId
            ? { ...counselor, active: newStatus }
            : counselor
        )
      );

      await axiosInstance.put(`/admin/counselors/${counselorId}/status`, {
        active: newStatus
      });

      showSnackbar(`Counselor ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
    } catch (error) {
      // Revert optimistic update on error
      fetchCounselors();
      const errorMessage = error.response?.data?.message || 'Failed to update counselor status';
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCounselor = async () => {
    // Prevent duplicate calls
    if (isDeletingRef.current) {
      return;
    }

    if (!selectedCounselor) {
      showSnackbar('No counselor selected', 'error');
      return;
    }

    try {
      isDeletingRef.current = true;
      setActionLoading(true);
      clearMessages();

      await axiosInstance.delete(`/admin/counselors/${selectedCounselor.id}`);

      showSnackbar(`${selectedCounselor.name} deleted successfully!`, 'success');
      setOpenDeleteDialog(false);
      setSelectedCounselor(null);
      fetchCounselors();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete counselor';
      showSnackbar(errorMessage, 'error');
      setOpenDeleteDialog(false);
    } finally {
      setActionLoading(false);
      isDeletingRef.current = false;
    }
  };

  const handleBulkDelete = async () => {
    // Prevent duplicate calls
    if (isDeletingRef.current) {
      return;
    }

    if (!selectedCounselors || selectedCounselors.length === 0) {
      showSnackbar('Please select counselors to delete', 'warning');
      return;
    }

    try {
      isDeletingRef.current = true;
      setActionLoading(true);
      clearMessages();

      const deleteResults = await Promise.allSettled(
        selectedCounselors.map(id =>
          axiosInstance.delete(`/admin/counselors/${id}`)
            .catch(error => {
              const errorMessage = error.response?.data?.message || 'Failed to delete counselor';
              return Promise.reject({ id, error: errorMessage });
            })
        )
      );

      const failed = deleteResults.filter(r => r.status === 'rejected');
      const succeeded = deleteResults.filter(r => r.status === 'fulfilled');

      if (succeeded.length > 0 && failed.length === 0) {
        // All succeeded
        showSnackbar(`${succeeded.length} counselor(s) deleted successfully!`, 'success');
        setSelectedCounselors([]);
      } else if (succeeded.length > 0 && failed.length > 0) {
        // Partial success
        showSnackbar(
          `${succeeded.length} deleted successfully, ${failed.length} failed. Some counselors may have assigned students.`,
          'warning'
        );
      } else if (failed.length > 0) {
        // All failed
        const uniqueMessages = [...new Set(failed.map(r => r.reason?.error || 'Failed to delete'))];
        showSnackbar(
          `Deletion failed. ${uniqueMessages[0]}`,
          'error'
        );
      }

      fetchCounselors();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete selected counselors';
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(false);
      isDeletingRef.current = false;
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCounselors(filteredCounselors.map(c => c.id));
    } else {
      setSelectedCounselors([]);
    }
  };

  const handleSelectCounselor = (counselorId) => {
    const selectedIndex = selectedCounselors.indexOf(counselorId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedCounselors, counselorId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedCounselors.slice(1));
    } else if (selectedIndex === selectedCounselors.length - 1) {
      newSelected = newSelected.concat(selectedCounselors.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedCounselors.slice(0, selectedIndex),
        selectedCounselors.slice(selectedIndex + 1),
      );
    }

    setSelectedCounselors(newSelected);
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceLabel = (rate) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const filteredCounselors = counselors
    .filter(counselor => {
      const matchesSearch =
        counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counselor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (counselor.specialization && counselor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && counselor.active) ||
        (filterStatus === 'inactive' && !counselor.active);

      const successRate = counselor.successRate || 0;

      const matchesPerformance = filterPerformance === 'all' ||
        (filterPerformance === 'excellent' && successRate >= 80) ||
        (filterPerformance === 'good' && successRate >= 60 && successRate < 80) ||
        (filterPerformance === 'poor' && successRate < 60);

      return matchesSearch && matchesStatus && matchesPerformance;
    })
    .sort((a, b) => {
      const isAsc = order === 'asc';
      if (orderBy === 'successRate') {
        const rateA = a.successRate || 0;
        const rateB = b.successRate || 0;
        return isAsc ? rateA - rateB : rateB - rateA;
      }
      if (orderBy === 'rating') {
        return isAsc ? a.rating - b.rating : b.rating - a.rating;
      }
      return isAsc
        ? a[orderBy] < b[orderBy] ? -1 : 1
        : b[orderBy] < a[orderBy] ? -1 : 1;
    });

  const paginatedCounselors = filteredCounselors
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const totalCounselors = counselors.length;
  const activeCounselors = counselors.filter(c => c.active).length;
  const avgSuccessRate = counselors.length > 0 ?
    counselors.reduce((sum, c) => sum + (c.totalStudents > 0 ? (c.successfulApplications / c.totalStudents) * 100 : 0), 0) / counselors.length : 0;
  const totalStudents = counselors.reduce((sum, c) => sum + c.totalStudents, 0);

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 3
      }}>
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
          Loading Counselors...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fetching counselor data and analytics
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Counselor Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor counselor performance and activities
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedCounselor(null);
            setFormData({ name: '', email: '', password: '', phone: '', specialization: '', experience: '', bio: '' });
            setOpenModal(true);
          }}
          disabled={actionLoading}
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
            }
          }}
        >
          Add Counselor
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalCounselors}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Counselors
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {activeCounselors}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Counselors
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {Math.round(avgSuccessRate)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Avg Success Rate
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(67, 233, 123, 0.3)',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalStudents}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Students
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search counselors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Performance</InputLabel>
                    <Select
                      value={filterPerformance}
                      onChange={(e) => setFilterPerformance(e.target.value)}
                      label="Performance"
                    >
                      <MenuItem value="all">All Performance</MenuItem>
                      <MenuItem value="excellent">Excellent (80%+)</MenuItem>
                      <MenuItem value="good">Good (60-79%)</MenuItem>
                      <MenuItem value="poor">Needs Improvement (&lt;60%)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                    onClick={() => showSnackbar('Export functionality coming soon!', 'info')}
                  >
                    Export
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    fullWidth
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <RealTimeActivityFeed
            maxItems={8}
            title="Counselor Activity"
            showHeader={true}
          />
        </Grid>
      </Grid>

      {/* Bulk Actions */}
      {selectedCounselors.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>
                {selectedCounselors.length} counselor(s) selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  startIcon={<DeleteIcon />}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedCounselors([])}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Clear Selection
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedCounselors.length > 0 && selectedCounselors.length < filteredCounselors.length}
                    checked={filteredCounselors.length > 0 && selectedCounselors.length === filteredCounselors.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Counselor
                  </TableSortLabel>
                </TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'totalStudents'}
                    direction={orderBy === 'totalStudents' ? order : 'asc'}
                    onClick={() => handleSort('totalStudents')}
                  >
                    Students
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'successRate'}
                    direction={orderBy === 'successRate' ? order : 'asc'}
                    onClick={() => handleSort('successRate')}
                  >
                    Success Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'rating'}
                    direction={orderBy === 'rating' ? order : 'asc'}
                    onClick={() => handleSort('rating')}
                  >
                    Rating
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'createdAt'}
                    direction={orderBy === 'createdAt' ? order : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Joined
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCounselors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {searchTerm || filterStatus !== 'all' || filterPerformance !== 'all'
                          ? 'No counselors found matching your criteria'
                          : 'No counselors yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || filterStatus !== 'all' || filterPerformance !== 'all'
                          ? 'Try adjusting your filters or search query'
                          : 'Get started by adding your first counselor'}
                      </Typography>
                      {(!searchTerm && filterStatus === 'all' && filterPerformance === 'all') && (
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedCounselor(null);
                            setFormData({ name: '', email: '', password: '', phone: '', specialization: '', experience: '', bio: '' });
                            setOpenModal(true);
                          }}
                          sx={{ mt: 2 }}
                        >
                          Add First Counselor
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCounselors.map((counselor, index) => {
                  const successRate = counselor.successRate || 0;
                  const isSelected = selectedCounselors.indexOf(counselor.id) !== -1;

                  return (
                    <Fade in key={counselor.id} timeout={300 + (index * 50)}>
                      <TableRow
                        hover
                        selected={isSelected}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            transform: 'scale(1.01)',
                            transition: 'all 0.2s ease'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectCounselor(counselor.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {counselor.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {counselor.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {counselor.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={counselor.specialization || 'Not specified'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {counselor.totalStudents}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {counselor.pendingApplications} pending
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 100 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {Math.round(successRate)}%
                              </Typography>
                              <Chip
                                label={getPerformanceLabel(successRate)}
                                size="small"
                                color={getPerformanceColor(successRate)}
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={successRate}
                              color={getPerformanceColor(successRate)}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                            <Typography variant="body2">
                              {counselor.rating || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={counselor.active ? 'Active' : 'Inactive'}
                            color={counselor.active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {counselor.createdAt ? format(new Date(counselor.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedCounselor(counselor);
                                  setOpenDetailDrawer(true);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedCounselor(counselor);
                                  setFormData({
                                    name: counselor.name,
                                    email: counselor.email,
                                    password: '',
                                    phone: counselor.phone || '',
                                    specialization: counselor.specialization || '',
                                    experience: counselor.experience || '',
                                    bio: counselor.bio || ''
                                  });
                                  setOpenModal(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedCounselor(counselor);
                                  setOpenDeleteDialog(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredCounselors.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white'
          }}>
            {selectedCounselor ? 'Edit Counselor' : 'Add New Counselor'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  autoFocus
                  label="Full Name"
                  type="text"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  type="tel"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={actionLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={actionLoading}>
                  <InputLabel id="specialization-label">Specialization</InputLabel>
                  <Select
                    labelId="specialization-label"
                    label="Specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    {SPECIALIZATION_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Experience"
                  type="text"
                  fullWidth
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  disabled={actionLoading}
                />
              </Grid>
              {!selectedCounselor && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={actionLoading}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={actionLoading}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenModal(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={actionLoading}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                }
              }}
            >
              {actionLoading ? <CircularProgress size={24} /> : (selectedCounselor ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !actionLoading && setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2
        }}>
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <WarningIcon />
          </Avatar>
          <Typography variant="h6" component="span">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem' }}>
            Are you sure you want to delete counselor <strong>{selectedCounselor?.name}</strong>?
            <br /><br />
            {selectedCounselor?.totalStudents > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  WARNING: This counselor has {selectedCounselor.totalStudents} assigned student(s)!
                </Typography>
                <Typography variant="body2">
                  You must reassign or delete these students before deleting the counselor.
                </Typography>
              </Alert>
            )}
            <Alert severity="warning" sx={{ mt: selectedCounselor?.totalStudents > 0 ? 0 : 2 }}>
              This action cannot be undone.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={actionLoading}
            variant="outlined"
            fullWidth
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCounselor}
            color="error"
            variant="contained"
            disabled={actionLoading || (selectedCounselor?.totalStudents > 0)}
            fullWidth
            sx={{ ml: 1 }}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete Counselor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Counselor Detail Drawer */}
      <Drawer
        anchor="right"
        open={openDetailDrawer}
        onClose={() => setOpenDetailDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 400,
            p: 3
          }
        }}
      >
        {selectedCounselor && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Counselor Details
              </Typography>
              <IconButton onClick={() => setOpenDetailDrawer(false)}>
                <ClearIcon />
              </IconButton>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                {selectedCounselor.name.charAt(0)}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedCounselor.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCounselor.specialization || 'Not specified'} • {selectedCounselor.experience || 'Not specified'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{selectedCounselor.email}</Typography>
              </Box>
              {selectedCounselor.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{selectedCounselor.phone}</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {selectedCounselor.totalStudents}
                    </Typography>
                    <Typography variant="caption">Total Students</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {Math.round((selectedCounselor.successfulApplications / selectedCounselor.totalStudents) * 100)}%
                    </Typography>
                    <Typography variant="caption">Success Rate</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Recent Activities
              </Typography>
              <List dense>
                {selectedCounselor.recentActivities && selectedCounselor.recentActivities.length > 0 ? (
                  selectedCounselor.recentActivities.map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {activity.type === 'application' && <AssessmentIcon />}
                          {activity.type === 'document' && <SchoolIcon />}
                          {activity.type === 'meeting' && <GroupIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary="No recent activities"
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setOpenDetailDrawer(false);
                  setFormData({
                    name: selectedCounselor.name,
                    email: selectedCounselor.email,
                    password: '',
                    phone: selectedCounselor.phone || '',
                    specialization: selectedCounselor.specialization || '',
                    experience: selectedCounselor.experience || '',
                    bio: selectedCounselor.bio || ''
                  });
                  setOpenModal(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => showSnackbar('View detailed analytics coming soon!', 'info')}
              >
                View Analytics
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CounselorManagement;