import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Fade,
  Zoom,
  Grow,
  Slide,
  Badge,
  Avatar,
  IconButton,
  Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  ArrowBack as ArrowBackIcon, 
  People as PeopleIcon, 
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import axiosInstance from '../../utils/axios';
import { assignLeadToCounselor, fetchMarketingMemberLeads } from '../../services/adminTeamService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

function MarketingMemberLeadsAdmin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { isConnected, onEvent } = useWebSocket();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [member, setMember] = useState(location.state?.member || null);
  const [leads, setLeads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [counselors, setCounselors] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [pulseAnimation, setPulseAnimation] = useState(0);

  // Pulse animation for real-time indicators
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 2);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

  const loadLeads = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMarketingMemberLeads(id, filters);
      const payload = response?.data ?? response;
      const data = payload?.data ?? payload;

      setMember(data?.member || null);
      setLeads(Array.isArray(data?.leads) ? data.leads : []);
    } catch (apiError) {
      console.error('Failed to fetch marketing member leads (admin):', apiError);
      setError(
        apiError.response?.data?.message ||
        'Unable to load leads for this marketing member. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Initial load without filters
    loadLeads();
  }, [loadLeads]);

  // WebSocket listener for real-time lead status updates
  useEffect(() => {
    if (!isConnected || !user) return;

    const cleanup = onEvent('lead_status_update', (data) => {
      console.log('Lead status update received:', data);
      
      // Update the lead status in the leads list
      setLeads((prevLeads) =>
        prevLeads.map((lead) => {
          // Check if this update is for this lead
          if (lead.id === data.studentId || lead.studentId === data.studentId) {
            return {
              ...lead,
              sharingStatus: data.status === 'accepted' ? 'accepted' : lead.sharingStatus,
              assigned: data.status === 'accepted' ? true : lead.assigned
            };
          }
          return lead;
        })
      );
    });

    return cleanup;
  }, [isConnected, user, onEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeads({
      dateRange: dateRange === 'ALL' ? undefined : dateRange,
      startDate: dateRange === 'custom' && startDate ? startDate : undefined,
      endDate: dateRange === 'custom' && endDate ? endDate : undefined,
      name: nameFilter.trim() || undefined,
      email: emailFilter.trim() || undefined,
      phone: phoneFilter.trim() || undefined
    });
    setRefreshing(false);
  };

  const loadCounselors = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/admin/counselors', {
        params: { _t: Date.now() }
      });
      const counselorsData = response.data.data || response.data || [];
      setCounselors(counselorsData);
    } catch (err) {
      console.error('Failed to load counselors:', err);
      setCounselors([]);
    }
  }, []);

  const handleOpenAssignDialog = async (lead) => {
    setSelectedLead(lead);
    setSelectedCounselorId('');
    setAssignDialogOpen(true);
    if (!counselors.length) {
      await loadCounselors();
    }
  };

  const handleCloseAssignDialog = () => {
    if (assigning) return;
    setAssignDialogOpen(false);
    setSelectedLead(null);
    setSelectedCounselorId('');
  };

  const handleAssignLead = async () => {
    if (!selectedLead || !selectedCounselorId) {
      return;
    }
    setAssigning(true);
    try {
      // response.data will contain { success: true, message: '...', data: { sharedLeadId, status: 'pending' } }
      const response = await assignLeadToCounselor(selectedLead.id, selectedCounselorId);

      const responseData = response.data || {};

      // Optimistically update the leads list to show 'Share Pending'
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === selectedLead.id
            ? { ...lead, sharingStatus: 'pending', sharedLeadId: responseData.sharedLeadId }
            : lead
        )
      );

      handleCloseAssignDialog();
    } catch (err) {
      console.error('Failed to assign lead to counselor:', err);
      alert(err.response?.data?.message || 'Failed to assign lead. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const totalLeads = leads.length;

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
              onClick={() => navigate('/admin/marketing-team')}
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
              Back to Marketing Team
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
                    <PeopleIcon sx={{ color: 'white', fontSize: 28 }} />
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
                      {member?.name || 'Marketing Member'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Leads owned by this marketing team member
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`Total leads: ${totalLeads}`}
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
            <CardContent sx={{ p: 3 }}>
              {member && (
                <Box sx={{ 
                  mb: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                          Email
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{member.email || '-'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                          Phone
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{member.phone || '-'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                          Status
                        </Typography>
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
                            size="medium"
                            label={member.active ? 'Active' : 'Inactive'}
                            color={member.active ? 'success' : 'default'}
                            sx={{
                              fontWeight: 600,
                              boxShadow: member.active ? `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}` : 'none'
                            }}
                          />
                        </Badge>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    boxShadow: `0 6px 30px ${alpha(theme.palette.primary.main, 0.12)}`
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
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
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Date Range</InputLabel>
                      <Select
                        label="Date Range"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        sx={{
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }}
                      >
                        <MenuItem value="ALL">All time</MenuItem>
                        <MenuItem value="last_week">Last week</MenuItem>
                        <MenuItem value="last_month">Last month</MenuItem>
                        <MenuItem value="last_6_months">Last 6 months</MenuItem>
                        <MenuItem value="last_year">Last year</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {dateRange === 'custom' && (
                    <>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          type="date"
                          size="small"
                          label="Start date"
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          type="date"
                          size="small"
                          label="End date"
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                              }
                            }
                          }}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      size="small"
                      label="Name"
                      fullWidth
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      size="small"
                      label="Email"
                      fullWidth
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      size="small"
                      label="Phone"
                      fullWidth
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={3}
                    sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center' }}
                  >
                    <Button
                      variant="contained"
                      startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={refreshing}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        py: 1.5,
                        fontSize: '0.95rem',
                        minWidth: 180,
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
                      {refreshing ? 'Refreshing…' : 'Apply Filters'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
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

        {loading ? (
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
                Loading leads…
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Grow in={true} timeout={1000}>
            <Card
              sx={{
                borderRadius: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                overflow: 'hidden'
              }}
            >
              <Box sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                p: 2.5
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Leads
                </Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                {leads.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      No leads found for this member.
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
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Current Phase</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Documents</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.map((lead, index) => (
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
                                    {lead.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {lead.email || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {lead.phone || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  size="small" 
                                  label={lead.status || '-'}
                                  sx={{
                                    fontWeight: 600,
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {lead.currentPhase || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadIcon />}
                                  disabled={!lead.documentCount || lead.documentCount === 0}
                                  onClick={async () => {
                                    if (lead.documentCount > 0) {
                                      try {
                                        const response = await axiosInstance.get(`/admin/leads/${lead.id}/documents/download`, {
                                          responseType: 'blob'
                                        });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `lead-${lead.id}-documents.zip`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        window.URL.revokeObjectURL(url);
                                      } catch (err) {
                                        console.error('Error downloading documents:', err);
                                        alert('Failed to download documents. Please try again.');
                                      }
                                    }
                                  }}
                                  sx={{ 
                                    textTransform: 'none', 
                                    borderRadius: 2,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                                    }
                                  }}
                                >
                                  Download ({lead.documentCount || 0})
                                </Button>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const isAssigned = lead.assigned;
                                  const isPending = lead.sharingStatus === 'pending';

                                  if (isAssigned) {
                                    return (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircleIcon fontSize="small" />}
                                        sx={{ 
                                          textTransform: 'none', 
                                          borderRadius: 2,
                                          fontWeight: 600,
                                          boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.5)}`
                                          }
                                        }}
                                        disabled
                                      >
                                        Assigned successfully
                                      </Button>
                                    );
                                  } else if (isPending) {
                                    return (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        startIcon={<PendingIcon fontSize="small" />}
                                        sx={{ 
                                          textTransform: 'none', 
                                          borderRadius: 2,
                                          fontWeight: 600,
                                          boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.5)}`
                                          }
                                        }}
                                        disabled
                                      >
                                        Share Pending
                                      </Button>
                                    );
                                  } else {
                                    return (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<PersonAddIcon fontSize="small" />}
                                        sx={{ 
                                          textTransform: 'none', 
                                          borderRadius: 2,
                                          fontWeight: 600,
                                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                                          transition: 'all 0.3s ease',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.5)}`
                                          }
                                        }}
                                        onClick={() => handleOpenAssignDialog(lead)}
                                      >
                                        Assign
                                      </Button>
                                    );
                                  }
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
        )}
        <Dialog
          open={assignDialogOpen}
          onClose={handleCloseAssignDialog}
          fullWidth
          maxWidth="sm"
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
                onClick={handleCloseAssignDialog}
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
                Lead Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {selectedLead?.name || '-'}
              </Typography>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Counselor</InputLabel>
              <Select
                label="Counselor"
                value={selectedCounselorId}
                onChange={(e) => setSelectedCounselorId(e.target.value)}
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
                    {c.name} ({c.email})
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
              onClick={handleCloseAssignDialog} 
              disabled={assigning}
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
              onClick={handleAssignLead}
              disabled={assigning || !selectedCounselorId}
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
              {assigning ? 'Assigning…' : 'Proceed'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default MarketingMemberLeadsAdmin;


