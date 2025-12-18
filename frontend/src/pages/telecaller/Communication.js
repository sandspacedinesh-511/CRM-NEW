import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Comment as CommentIcon,
  Call as CallIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

import { fetchTelecallerDashboard } from '../../services/telecallerService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import { logTelecallerCallInitiated } from '../../services/telecallerService';
import axiosInstance from '../../utils/axios';
import StudentProgressBar from '../../components/counselor/StudentProgressBar';

function TelecallerCommunication() {
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, joinRoom, onEvent } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [progressDialog, setProgressDialog] = useState({ open: false, lead: null });
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [countryProfiles, setCountryProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      const response = await fetchTelecallerDashboard();
      setDashboardData(response?.data ?? response);
    } catch (apiError) {
      console.error('Failed to load communication data:', apiError);
      setError('Unable to load leads. Please try again later.');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (isConnected && user?.role === 'telecaller') {
      joinRoom(`telecaller:${user.id}`);
    }
  }, [isConnected, joinRoom, user]);

  useEffect(() => {
    if (!isConnected) return undefined;
    const cleanup = onEvent('telecaller_task_updated', () => loadData(false));
    return () => cleanup?.();
  }, [isConnected, onEvent, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleCall = (phoneNumber, meta = {}) => {
    if (!phoneNumber) {
      showToast('No phone number available for this lead.', 'error');
      return;
    }

    logTelecallerCallInitiated({
      phone: phoneNumber,
      ...meta
    }).catch((error) => {
      console.error('Failed to log call initiation:', error);
    });

    try {
      window.location.href = `tel:${phoneNumber}`;
    } catch (err) {
      console.error('Failed to initiate call:', err);
      showToast('Unable to start the call on this device.', 'error');
    }
  };

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleViewProgress = async (lead) => {
    setProgressDialog({ open: true, lead });
    setLoadingProgress(true);
    
    try {
      // First, try to find student by email or phone
      let studentId = null;
      
      if (lead.emailId) {
        try {
          const emailCheck = await axiosInstance.post('/validation/email', { email: lead.emailId });
          if (emailCheck.data.success && emailCheck.data.student) {
            studentId = emailCheck.data.student.id;
          }
        } catch (err) {
          console.log('Error checking email:', err);
        }
      }
      
      // If not found by email, try phone
      if (!studentId && lead.contactNumber) {
        try {
          const phoneCheck = await axiosInstance.post('/validation/phone', { phone: lead.contactNumber });
          if (phoneCheck.data.success && phoneCheck.data.student) {
            studentId = phoneCheck.data.student.id;
          }
        } catch (err) {
          console.log('Error checking phone:', err);
        }
      }
      
      if (!studentId) {
        showToast('Student not found. This lead may not have been converted to a student yet.', 'info');
        setLoadingProgress(false);
        return;
      }
      
      // Fetch progress via telecaller endpoint (authorized for telecaller-owned leads)
      const progressResponse = await axiosInstance.get(`/telecaller/students/${studentId}/progress`).catch(() => null);

      if (progressResponse?.data?.success) {
        const {
          student: studentData,
          documents: docs = [],
          applications: apps = [],
          countryProfiles: profiles = []
        } = progressResponse.data.data || {};

        setStudentDetails(studentData || null);
        setStudentDocuments(Array.isArray(docs) ? docs : []);
        setStudentApplications(Array.isArray(apps) ? apps : []);
        setCountryProfiles(Array.isArray(profiles) ? profiles : []);
        // Default selected country to first profile if available
        if (profiles && profiles.length > 0) {
          setSelectedCountry(profiles[0].country);
        } else {
          setSelectedCountry(null);
        }
      } else {
        showToast('Not authorized to view this student progress.', 'error');
        setStudentDetails(null);
        setStudentDocuments([]);
        setStudentApplications([]);
        setCountryProfiles([]);
        setSelectedCountry(null);
      }
    } catch (error) {
      console.error('Error loading application progress:', error);
      showToast('Failed to load application progress. Please try again.', 'error');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleCloseProgressDialog = () => {
    setProgressDialog({ open: false, lead: null });
    setStudentDetails(null);
    setStudentDocuments([]);
    setStudentApplications([]);
    setCountryProfiles([]);
    setSelectedCountry(null);
  };

  const importedLeads = dashboardData?.importedLeads ?? [];

  const filteredLeads = useMemo(() => {
    return importedLeads.filter((lead) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const searchableText = [
          lead.name,
          lead.contactNumber,
          lead.emailId,
          lead.interestedCountry,
          lead.services,
          lead.comments,
          lead.callStatus,
          lead.leadStatus
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ASSIGNED' && lead.leadStatus !== 'ASSIGNED_TO_COUNSELOR') {
          return false;
        }
        if (statusFilter === 'NOT_ASSIGNED' && lead.leadStatus === 'ASSIGNED_TO_COUNSELOR') {
          return false;
        }
        if (statusFilter === 'FOLLOW_UP' && lead.callStatus !== 'follow up') {
          return false;
        }
      }

      return true;
    });
  }, [importedLeads, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = importedLeads.length;
    const assigned = importedLeads.filter((l) => l.leadStatus === 'ASSIGNED_TO_COUNSELOR').length;
    const notAssigned = total - assigned;
    const followUp = importedLeads.filter((l) => l.callStatus === 'follow up').length;
    return { total, assigned, notAssigned, followUp };
  }, [importedLeads]);

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
          Loading your leads...
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            My Leads
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            View and manage leads you've marked from imported tasks
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          disabled={refreshing}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main
                  }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Total Leads
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    color: theme.palette.success.main
                  }}
                >
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                    {stats.assigned}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Assigned
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.15),
                    color: theme.palette.warning.main
                  }}
                >
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
                    {stats.notAssigned}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Not Assigned
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.15),
                    color: theme.palette.info.main
                  }}
                >
                  <CallIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.info.main }}>
                    {stats.followUp}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Follow Up
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search leads by name, contact, email, country, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="All"
                  onClick={() => setStatusFilter('ALL')}
                  color={statusFilter === 'ALL' ? 'primary' : 'default'}
                  variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
                  clickable
                />
                <Chip
                  label="Assigned"
                  onClick={() => setStatusFilter('ASSIGNED')}
                  color={statusFilter === 'ASSIGNED' ? 'primary' : 'default'}
                  variant={statusFilter === 'ASSIGNED' ? 'filled' : 'outlined'}
                  clickable
                />
                <Chip
                  label="Not Assigned"
                  onClick={() => setStatusFilter('NOT_ASSIGNED')}
                  color={statusFilter === 'NOT_ASSIGNED' ? 'primary' : 'default'}
                  variant={statusFilter === 'NOT_ASSIGNED' ? 'filled' : 'outlined'}
                  clickable
                />
                <Chip
                  label="Follow Up"
                  onClick={() => setStatusFilter('FOLLOW_UP')}
                  color={statusFilter === 'FOLLOW_UP' ? 'primary' : 'default'}
                  variant={statusFilter === 'FOLLOW_UP' ? 'filled' : 'outlined'}
                  clickable
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Leads List
              </Typography>
              <Chip
                label={`${filteredLeads.length} lead${filteredLeads.length === 1 ? '' : 's'}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
          }
          subheader="All leads you've marked from imported tasks"
        />
        <CardContent>
          {filteredLeads.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.12),
                  color: theme.palette.info.main
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {importedLeads.length === 0 ? 'No Leads Yet' : 'No Leads Match Filters'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {importedLeads.length === 0
                  ? "You haven't marked any leads yet. Mark leads from your imported tasks to see them here."
                  : 'Try adjusting your search or filter criteria.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
                maxHeight: 600,
                overflow: 'auto'
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Call Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Lead Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Services</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                              fontSize: '0.875rem'
                            }}
                          >
                            {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lead.name || '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {lead.contactNumber ? (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<PhoneIcon />}
                            onClick={() =>
                              handleCall(lead.contactNumber, {
                                importedTaskId: lead.id,
                                name: lead.name,
                                source: 'COMMUNICATION_PAGE'
                              })
                            }
                            sx={{ textTransform: 'none' }}
                          >
                            {lead.contactNumber}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.emailId ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{lead.emailId}</Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.callStatus ? (
                          <Chip
                            label={lead.callStatus}
                            size="small"
                            color={
                              lead.callStatus.toLowerCase() === 'follow up'
                                ? 'info'
                                : lead.callStatus.toLowerCase() === 'no response'
                                  ? 'warning'
                                  : 'default'
                            }
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.leadStatus ? (
                          <Chip
                            label={lead.leadStatus}
                            size="small"
                            color={lead.leadStatus === 'ASSIGNED_TO_COUNSELOR' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.interestedCountry ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">{lead.interestedCountry}</Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.services ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <WorkIcon fontSize="small" color="action" />
                            <Typography variant="body2">{lead.services}</Typography>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.comments ? (
                          <Tooltip title={lead.comments}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {lead.comments}
                            </Typography>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.updatedAt ? (
                          <Tooltip title={format(new Date(lead.updatedAt), 'PPpp')}>
                            <Typography variant="body2" color="text.secondary">
                              {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                            </Typography>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Application Progress">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProgress(lead)}
                              color="info"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCall(lead.contactNumber, {
                                  importedTaskId: lead.id,
                                  name: lead.name,
                                  source: 'COMMUNICATION_PAGE'
                                })
                              }
                              disabled={!lead.contactNumber}
                              color="primary"
                            >
                              <PhoneIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Application Progress Dialog */}
      <Dialog
        open={progressDialog.open}
        onClose={handleCloseProgressDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Application Progress
            </Typography>
            {progressDialog.lead && (
              <Chip
                label={progressDialog.lead.name || 'Lead'}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingProgress ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : studentDetails ? (
            <Box>
              <Stack spacing={3}>
                {/* Student Info */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Student Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {studentDetails.firstName} {studentDetails.lastName}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {studentDetails.email || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {studentDetails.phone || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={studentDetails.status || 'ACTIVE'}
                            size="small"
                            color={
                              studentDetails.status === 'ACTIVE'
                                ? 'success'
                                : studentDetails.status === 'COMPLETED'
                                  ? 'info'
                                  : 'default'
                            }
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Application Progress by Country */}
                <Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Application Progress by Country
                    </Typography>
                  </Stack>

                  {countryProfiles.length > 0 ? (() => {
                    const currentCountry = selectedCountry || countryProfiles[0]?.country || null;
                    const currentProfile =
                      countryProfiles.find((p) => p.country === currentCountry) || countryProfiles[0];

                    return (
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <LocationIcon color="primary" />
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {currentProfile?.country || 'Country'}
                              </Typography>
                              {currentProfile?.preferredCountry && (
                                <Chip
                                  label="Preferred"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                            <StudentProgressBar
                              student={{
                                id: studentDetails.id,
                                firstName: studentDetails.firstName,
                                lastName: studentDetails.lastName,
                                currentPhase: currentProfile?.currentPhase || studentDetails.currentPhase,
                                status: studentDetails.status,
                                ...studentDetails
                              }}
                              documents={studentDocuments || []}
                              applications={studentApplications || []}
                              countryProfiles={countryProfiles}
                              selectedCountry={selectedCountry || countryProfiles[0]?.country || null}
                              onCountryChange={(country) => setSelectedCountry(country)}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })() : (
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Application Progress
                      </Typography>
                      <StudentProgressBar
                        student={{
                          id: studentDetails.id,
                          firstName: studentDetails.firstName,
                          lastName: studentDetails.lastName,
                          currentPhase: studentDetails.currentPhase,
                          status: studentDetails.status,
                          ...studentDetails
                        }}
                        documents={studentDocuments || []}
                        applications={studentApplications || []}
                        countryProfiles={countryProfiles}
                        selectedCountry={selectedCountry}
                        onCountryChange={(country) => setSelectedCountry(country)}
                      />
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Student not found. This lead may not have been converted to a student yet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgressDialog} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default TelecallerCommunication;

