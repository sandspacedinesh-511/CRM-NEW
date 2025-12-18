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
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Call as CallIcon,
  PendingActions as PendingActionsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import {
  fetchTelecallerDashboardAdmin,
  fetchCounselors,
  assignTelecallerImportedLeadToCounselor
} from '../../services/adminTeamService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.02)} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alpha(color, 0.15),
              color: color
            }}
          >
            {icon}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Loading telecaller dashboard…
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/telecallers')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Telecaller Team
        </Button>
      </Stack>

      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.98
          )} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.primary.main
                }}
              >
                <PhoneIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {titleMemberName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Telecaller performance and follow-up overview
                </Typography>
              </Box>
            </Stack>
          }
          action={
            member && (
              <Stack spacing={1} alignItems="flex-end">
                <Chip
                  label={member.active ? 'Active' : 'Inactive'}
                  color={member.active ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {member.email}
                  {member.phone ? ` • ${member.phone}` : ''}
                </Typography>
              </Stack>
            )
          }
        />
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CallIcon />}
            label="Total Follow-ups"
            value={importedFollowUps.length}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<TodayIcon />}
            label="Scheduled Today"
            value={scheduledToday}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<PendingActionsIcon />}
            label="Pending Calls (Today)"
            value={pendingCalls}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<WarningIcon />}
            label="Total Pending Calls"
            value={totalPendingCalls}
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Leads from Telecaller Tasks
                  </Typography>
                  <Chip
                    label={`${importedLeads.length} lead${importedLeads.length === 1 ? '' : 's'}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              }
              subheader="Leads marked by the telecaller from imported call lists"
            />
            <CardContent>
              {importedLeads.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No leads have been marked yet on this telecaller&apos;s task list.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Contact</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Call Status</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Lead Status</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Interested Country</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Services</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Comments</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td style={{ padding: '8px' }}>{lead.name || '-'}</td>
                          <td style={{ padding: '8px' }}>
                            {lead.contactNumber ? (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<CallIcon />}
                                component="a"
                                href={`tel:${lead.contactNumber}`}
                              >
                                Call
                              </Button>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>{lead.emailId || '-'}</td>
                          <td style={{ padding: '8px' }}>{lead.callStatus || '-'}</td>
                          <td style={{ padding: '8px' }}>{lead.leadStatus || '-'}</td>
                          <td style={{ padding: '8px' }}>{lead.interestedCountry || '-'}</td>
                          <td style={{ padding: '8px' }}>{lead.services || '-'}</td>
                          <td style={{ padding: '8px' }}>{lead.comments || '-'}</td>
                          <td style={{ padding: '8px' }}>
                            {(() => {
                              const isSharePending = lead.sharingStatus === 'pending';
                              const isAssignedSuccessfully = lead.sharingStatus === 'accepted';
                              
                              let label = 'Assign';
                              let variant = 'outlined';
                              let color = 'primary';
                              let disabled = false;
                              
                              if (isSharePending) {
                                label = 'Share pending';
                                variant = 'contained';
                                color = 'warning';
                                disabled = true;
                              } else if (isAssignedSuccessfully) {
                                label = 'Assigned successfully';
                                variant = 'contained';
                                color = 'success';
                                disabled = true;
                              }
                              
                              return (
                                <Button
                                  size="small"
                                  variant={variant}
                                  color={color}
                                  onClick={() => {
                                    if (!disabled) {
                                      openAssignDialog(lead);
                                    }
                                  }}
                                  disabled={disabled || !counselors.length}
                                >
                                  {label}
                                </Button>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={assignDialog.open} onClose={closeAssignDialog} fullWidth maxWidth="xs">
        <DialogTitle>Assign Lead to Counselor</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Lead: <strong>{assignDialog.lead?.name || '-'}</strong>
              {assignDialog.lead?.contactNumber ? ` • ${assignDialog.lead.contactNumber}` : ''}
            </Typography>
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
              >
                {counselors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignSubmit}
            disabled={!assignDialog.counselorId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TelecallerDashboardAdmin;


