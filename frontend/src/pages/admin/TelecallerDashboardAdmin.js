import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Fade,
  Zoom,
  Grow,
  Slide,
  Badge,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Call as CallIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Today as TodayIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import {
  fetchTelecallerDashboardAdmin,
  fetchCounselors,
  assignTelecallerImportedLeadToCounselor
} from '../../services/adminTeamService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, label, value, color, index }) => {
  const theme = useTheme();
  return (
    <Zoom in={true} timeout={800 + (index * 100)}>
      <Card
        sx={{
          height: '100%',
          borderRadius: 4,
          border: `2px solid ${alpha(color, 0.2)}`,
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 20px ${alpha(color, 0.1)}`,
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
            background: `linear-gradient(90deg, transparent, ${alpha(color, 0.1)}, transparent)`,
            transition: 'left 0.6s ease',
          },
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: `0 12px 40px ${alpha(color, 0.25)}`,
            borderColor: alpha(color, 0.4),
            '&::before': {
              left: '100%'
            }
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
                color: 'white',
                boxShadow: `0 4px 15px ${alpha(color, 0.4)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: `0 6px 25px ${alpha(color, 0.6)}`
                }
              }}
            >
              {icon}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                {label}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Zoom>
  );
};

function TelecallerDashboardAdmin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { isConnected, onEvent } = useWebSocket();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [member, setMember] = useState(location.state?.member || null);
  const [dashboard, setDashboard] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    lead: null,
    counselorId: ''
  });
  const [pulseAnimation, setPulseAnimation] = useState(0);

  // Pulse animation for real-time indicators
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 2);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTelecallerDashboardAdmin(id);
      // Backend shape: { success, data: { ... } }
      const payload = response?.data ?? response;
      setDashboard(payload || null);
    } catch (apiError) {
      console.error('Failed to load telecaller dashboard (admin):', apiError);
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        'Unable to load telecaller dashboard data. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadCounselors = async () => {
      try {
        const response = await fetchCounselors();
        const payload = response?.data ?? response;
        setCounselors(payload?.data || payload || []);
      } catch (apiError) {
        console.error('Failed to load counselors for assignment:', apiError);
      }
    };

    loadCounselors();
  }, []);

  // WebSocket listener for real-time lead status updates
  useEffect(() => {
    if (!isConnected || !user) return;

    const cleanup = onEvent('lead_status_update', (data) => {
      console.log('Lead status update received:', data);
      
      // Update the lead status in the dashboard
      setDashboard((prevDashboard) => {
        if (!prevDashboard) return prevDashboard;
        
        const updateLeads = (leads) => {
          if (!Array.isArray(leads)) return leads;
          return leads.map((lead) => {
            // Check if this update is for this lead (match by studentId)
            if (lead.studentId === data.studentId) {
              return {
                ...lead,
                sharingStatus: data.status === 'accepted' ? 'accepted' : lead.sharingStatus,
                leadStatus: data.status === 'accepted' ? 'ASSIGNED_TO_COUNSELOR' : lead.leadStatus
              };
            }
            return lead;
          });
        };

        const updatedDashboard = { ...prevDashboard };
        if (updatedDashboard.importedLeads) {
          updatedDashboard.importedLeads = updateLeads(updatedDashboard.importedLeads);
        }
        if (updatedDashboard.data?.importedLeads) {
          updatedDashboard.data.importedLeads = updateLeads(updatedDashboard.data.importedLeads);
        }
        
        return updatedDashboard;
      });
    });

    return cleanup;
  }, [isConnected, user, onEvent]);

  // When called via admin, `dashboard` is usually the `data` object from backend.
  const stats = dashboard?.stats || dashboard?.data?.stats || {};
  const importedLeads = dashboard?.importedLeads || dashboard?.data?.importedLeads || [];
  const importedFollowUps = dashboard?.importedFollowUps || dashboard?.data?.importedFollowUps || [];
  const scheduledToday =
    typeof stats.importedTasksToday === 'number'
      ? stats.importedTasksToday
      : stats.todayFollowUps ?? 0;
  const pendingCalls =
    typeof stats.pendingImportedCalls === 'number'
      ? stats.pendingImportedCalls
      : stats.pendingFollowUps ?? 0;
  const totalPendingCalls =
    typeof stats.totalPendingImportedCalls === 'number' ? stats.totalPendingImportedCalls : pendingCalls;

  const titleMemberName = member?.name || `Telecaller #${id}`;

  const openAssignDialog = (lead) => {
    setAssignDialog({
      open: true,
      lead,
      counselorId: ''
    });
  };

  const closeAssignDialog = () => {
    setAssignDialog((prev) => ({
      ...prev,
      open: false
    }));
  };

  const handleAssignSubmit = async () => {
    if (!assignDialog.lead || !assignDialog.counselorId) {
      return;
    }
    try {
      await assignTelecallerImportedLeadToCounselor(id, assignDialog.lead.id, assignDialog.counselorId);
      closeAssignDialog();
      await loadData();
    } catch (apiError) {
      console.error('Failed to assign telecaller lead to counselor:', apiError);
      alert(
        apiError.response?.data?.message ||
          'Failed to assign this lead to counselor. Please try again.'
      );
    }
  };

  if (loading && !dashboard) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Fade in={true} timeout={600}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: 3
              }}
            >
              <CircularProgress 
                size={60}
                sx={{
                  color: 'primary.main',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Loading telecaller dashboard…
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>
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
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Fade in={true} timeout={600}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/telecallers')}
              sx={{ 
                borderRadius: 3,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(-4px)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderWidth: 2
                }
              }}
            >
              Back to Telecaller Team
            </Button>
          </Stack>
        </Fade>

        <Grow in={true} timeout={800}>
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
              }
            }}
          >
            <Box sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              p: 3
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
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
                    <PhoneIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700,
                      mb: 0.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {titleMemberName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Telecaller performance and follow-up overview
                    </Typography>
                  </Box>
                </Stack>
                {member && (
                  <Stack spacing={1.5} alignItems="flex-end">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        member.active ? (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: theme.palette.success.main,
                              border: `2px solid ${theme.palette.background.paper}`,
                              animation: pulseAnimation === 0 ? 'pulse 2s ease-in-out infinite' : 'none',
                              '@keyframes pulse': {
                                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                                '50%': { transform: 'scale(1.3)', opacity: 0.7 }
                              }
                            }}
                          />
                        ) : null
                      }
                    >
                      <Chip
                        label={member.active ? 'Active' : 'Inactive'}
                        color={member.active ? 'success' : 'default'}
                        size="medium"
                        sx={{
                          fontWeight: 600,
                          boxShadow: member.active ? `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}` : 'none'
                        }}
                      />
                    </Badge>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {member.email}
                      {member.phone ? ` • ${member.phone}` : ''}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          </Card>
        </Grow>

        {error && (
          <Slide direction="down" in={true} timeout={800}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.2)}`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Slide>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<CallIcon />}
              label="Total Follow-ups"
              value={importedFollowUps.length}
              color={theme.palette.primary.main}
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TodayIcon />}
              label="Scheduled Today"
              value={scheduledToday}
              color={theme.palette.info.main}
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<PendingActionsIcon />}
              label="Pending Calls (Today)"
              value={pendingCalls}
              color={theme.palette.warning.main}
              index={2}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<WarningIcon />}
              label="Total Pending Calls"
              value={totalPendingCalls}
              color={theme.palette.error.main}
              index={3}
            />
          </Grid>
        </Grid>

        <Grow in={true} timeout={1000}>
          <Card sx={{ 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            overflow: 'hidden'
          }}>
            <Box sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              p: 2.5
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    mb: 0.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Leads from Telecaller Tasks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leads marked by the telecaller from imported call lists
                  </Typography>
                </Box>
                <Chip
                  label={`${importedLeads.length} lead${importedLeads.length === 1 ? '' : 's'}`}
                  size="medium"
                  color="primary"
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    px: 2,
                    py: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                />
              </Box>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {importedLeads.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No leads have been marked yet on this telecaller&apos;s task list.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                      }}>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Call Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Lead Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Interested Country</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Services</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Comments</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importedLeads.map((lead, index) => (
                        <Slide direction="left" in={true} timeout={300 + (index * 50)} key={lead.id}>
                          <TableRow 
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.05),
                                transform: 'scale(1.01)',
                                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{
                                  width: 32,
                                  height: 32,
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                                }}>
                                  {lead.name?.charAt(0)?.toUpperCase() || 'L'}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {lead.name || '-'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {lead.contactNumber ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<CallIcon />}
                                  component="a"
                                  href={`tel:${lead.contactNumber}`}
                                  sx={{
                                    borderRadius: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`
                                    }
                                  }}
                                >
                                  Call
                                </Button>
                              ) : (
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {lead.emailId || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={lead.callStatus || '-'}
                                sx={{
                                  fontWeight: 600,
                                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={lead.leadStatus || '-'}
                                color={lead.leadStatus === 'ASSIGNED_TO_COUNSELOR' ? 'success' : 'default'}
                                sx={{
                                  fontWeight: 600,
                                  boxShadow: lead.leadStatus === 'ASSIGNED_TO_COUNSELOR' ? `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}` : `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {lead.interestedCountry || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {lead.services || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {lead.comments || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isSharePending = lead.sharingStatus === 'pending';
                                const isAssignedSuccessfully = lead.sharingStatus === 'accepted';
                                
                                let label = 'Assign';
                                let variant = 'contained';
                                let color = 'primary';
                                let disabled = false;
                                let icon = <PersonAddIcon fontSize="small" />;
                                
                                if (isSharePending) {
                                  label = 'Share pending';
                                  color = 'warning';
                                  disabled = true;
                                  icon = <PendingIcon fontSize="small" />;
                                } else if (isAssignedSuccessfully) {
                                  label = 'Assigned successfully';
                                  color = 'success';
                                  disabled = true;
                                  icon = <CheckCircleIcon fontSize="small" />;
                                }
                                
                                return (
                                  <Button
                                    size="small"
                                    variant={variant}
                                    color={color}
                                    startIcon={icon}
                                    onClick={() => {
                                      if (!disabled) {
                                        openAssignDialog(lead);
                                      }
                                    }}
                                    disabled={disabled || !counselors.length}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: 2,
                                      fontWeight: 600,
                                      boxShadow: `0 2px 8px ${alpha(
                                        color === 'primary' ? theme.palette.primary.main :
                                        color === 'warning' ? theme.palette.warning.main :
                                        theme.palette.success.main,
                                        0.3
                                      )}`,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${alpha(
                                          color === 'primary' ? theme.palette.primary.main :
                                          color === 'warning' ? theme.palette.warning.main :
                                          theme.palette.success.main,
                                          0.5
                                        )}`
                                      },
                                      '&:disabled': {
                                        background: color === 'success' ? theme.palette.success.main : 
                                                    color === 'warning' ? theme.palette.warning.main : 
                                                    theme.palette.action.disabledBackground
                                      }
                                    }}
                                  >
                                    {label}
                                  </Button>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        </Slide>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grow>

        <Dialog 
          open={assignDialog.open} 
          onClose={closeAssignDialog} 
          fullWidth 
          maxWidth="xs"
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
                  p: 1,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white'
                }}>
                  <PersonAddIcon />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Assign Lead to Counselor
                </Typography>
              </Box>
              <IconButton 
                onClick={closeAssignDialog}
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
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{
              p: 2,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              mb: 3
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                Lead Information
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                {assignDialog.lead?.name || '-'}
              </Typography>
              {assignDialog.lead?.contactNumber && (
                <Typography variant="body2" color="text.secondary">
                  {assignDialog.lead.contactNumber}
                </Typography>
              )}
            </Box>
            <FormControl fullWidth>
              <InputLabel id="assign-counselor-select-label">Counselor</InputLabel>
              <Select
                labelId="assign-counselor-select-label"
                label="Counselor"
                value={assignDialog.counselorId}
                onChange={(event) =>
                  setAssignDialog((prev) => ({
                    ...prev,
                    counselorId: event.target.value
                  }))
                }
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                {counselors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Button 
              onClick={closeAssignDialog}
              sx={{
                borderRadius: 2,
                px: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: alpha(theme.palette.action.hover, 0.5)
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAssignSubmit}
              disabled={!assignDialog.counselorId}
              sx={{
                borderRadius: 2,
                px: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                },
                '&:disabled': {
                  background: theme.palette.action.disabledBackground
                }
              }}
            >
              Assign
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default TelecallerDashboardAdmin;


