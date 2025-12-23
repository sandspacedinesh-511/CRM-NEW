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
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { ArrowBack as ArrowBackIcon, People as PeopleIcon, Download as DownloadIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import axiosInstance from '../../utils/axios';
import { assignLeadToCounselor, fetchB2BMarketingMemberLeads } from '../../services/adminTeamService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

function B2BMarketingMemberLeadsAdmin() {
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

  const loadLeads = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchB2BMarketingMemberLeads(id, filters);
      const payload = response?.data ?? response;
      const data = payload?.data ?? payload;

      setMember(data?.member || null);
      setLeads(Array.isArray(data?.leads) ? data.leads : []);
    } catch (apiError) {
      console.error('Failed to fetch B2B marketing member leads (admin):', apiError);
      setError(
        apiError.response?.data?.message ||
          'Unable to load leads for this B2B marketing member. Please try again.'
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
      setLeads((prevLeads) => {
        const updated = prevLeads.map((lead) => {
          // Check if this update is for this lead (match by studentId)
          if (lead.id === data.studentId || lead.studentId === data.studentId) {
            console.log('Updating lead status:', lead.id, 'from', lead.sharingStatus, 'to', data.status);
            return {
              ...lead,
              sharingStatus: data.status === 'accepted' ? 'accepted' : lead.sharingStatus,
              assigned: data.status === 'accepted' ? true : lead.assigned
            };
          }
          return lead;
        });
        
        // If we updated a lead to 'accepted', refresh the list after a short delay
        // to ensure backend has persisted the changes
        const wasUpdated = updated.some((lead, idx) => {
          const prevLead = prevLeads[idx];
          return lead.id === data.studentId && 
                 data.status === 'accepted' &&
                 prevLead?.sharingStatus !== 'accepted';
        });
        
        if (wasUpdated) {
          console.log('Lead was accepted, refreshing list in 1 second...');
          setTimeout(() => {
            loadLeads({
              dateRange: dateRange === 'ALL' ? undefined : dateRange,
              startDate: dateRange === 'custom' && startDate ? startDate : undefined,
              endDate: dateRange === 'custom' && endDate ? endDate : undefined,
              name: nameFilter.trim() || undefined,
              email: emailFilter.trim() || undefined,
              phone: phoneFilter.trim() || undefined
            });
          }, 1000);
        }
        
        return updated;
      });
    });

    return cleanup;
  }, [isConnected, user, onEvent, dateRange, startDate, endDate, nameFilter, emailFilter, phoneFilter, loadLeads]);

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
      await assignLeadToCounselor(selectedLead.id, selectedCounselorId);
      handleCloseAssignDialog();
      // Refresh leads to show updated status
      await loadLeads({
        dateRange: dateRange === 'ALL' ? undefined : dateRange,
        startDate: dateRange === 'custom' && startDate ? startDate : undefined,
        endDate: dateRange === 'custom' && endDate ? endDate : undefined,
        name: nameFilter.trim() || undefined,
        email: emailFilter.trim() || undefined,
        phone: phoneFilter.trim() || undefined
      });
    } catch (err) {
      console.error('Failed to assign lead to counselor:', err);
      alert(err.response?.data?.message || 'Failed to assign lead. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const totalLeads = leads.length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/b2b-marketing-team')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Back to B2B Marketing Team
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
              <PeopleIcon color="primary" />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {member?.name || 'B2B Marketing Member'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leads owned by this B2B marketing team member
                </Typography>
              </Box>
            </Stack>
          }
          action={
            <Chip
              label={`Total leads: ${totalLeads}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          }
        />
        <CardContent>
          {member && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{member.email || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{member.phone || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    size="small"
                    label={member.active ? 'Active' : 'Inactive'}
                    color={member.active ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.grey[100], 0.7),
              border: `1px dashed ${alpha(theme.palette.divider, 0.6)}`
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.8 }}>
              Filters
            </Typography>
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    label="Date Range"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
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
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  size="small"
                  label="Email"
                  fullWidth
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  size="small"
                  label="Phone"
                  fullWidth
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 5,
                    py: 1.2,
                    fontSize: '0.95rem',
                    minWidth: 180,
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  {refreshing ? 'Refreshing…' : 'Apply Filters'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
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
            Loading leads…
          </Typography>
        </Box>
      ) : (
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.05)}`
          }}
        >
          <CardHeader title="Leads" sx={{ pb: 0.5 }} />
          <CardContent>
            {leads.length === 0 ? (
              <Typography color="text.secondary">
                No leads found for this member.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Current Phase</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.email || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={lead.status || '-'} />
                      </TableCell>
                      <TableCell>{lead.currentPhase || '-'}</TableCell>
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
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Download ({lead.documentCount || 0})
                        </Button>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const isSharePending = lead.sharingStatus === 'pending';
                          const isAssignedSuccessfully = lead.sharingStatus === 'accepted' || lead.assigned;
                          
                          let label = 'Assign';
                          let color = 'primary';
                          let disabled = false;
                          
                          if (isSharePending) {
                            label = 'Share pending';
                            color = 'warning';
                            disabled = true;
                          } else if (isAssignedSuccessfully) {
                            label = 'Assigned successfully';
                            color = 'success';
                            disabled = true;
                          }
                          
                          return (
                            <Button
                              size="small"
                              variant="contained"
                              color={color}
                              sx={{ textTransform: 'none', borderRadius: 2 }}
                              onClick={() => {
                                if (!disabled) {
                                  handleOpenAssignDialog(lead);
                                }
                              }}
                              disabled={disabled}
                            >
                              {label}
                            </Button>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={assignDialogOpen}
        onClose={handleCloseAssignDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Lead to Counselor</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Lead: <strong>{selectedLead?.name || '-'}</strong>
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Counselor</InputLabel>
            <Select
              label="Counselor"
              value={selectedCounselorId}
              onChange={(e) => setSelectedCounselorId(e.target.value)}
            >
              {counselors.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} disabled={assigning}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignLead}
            disabled={assigning || !selectedCounselorId}
          >
            {assigning ? 'Assigning…' : 'Proceed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default B2BMarketingMemberLeadsAdmin;


