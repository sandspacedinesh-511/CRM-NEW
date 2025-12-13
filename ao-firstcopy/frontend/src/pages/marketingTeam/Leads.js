import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  PersonOutline as PersonOutlineIcon,
  EmailOutlined as EmailOutlinedIcon,
  PhoneOutlined as PhoneOutlinedIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';

import { fetchMarketingLeads, exportMarketingLeads } from '../../services/marketingService';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR_MAP = {
  ACTIVE: 'info',
  COMPLETED: 'success',
  DEFERRED: 'warning',
  REJECTED: 'error'
};

const StatBadge = ({ icon, title, value, color }) => {
  const theme = useTheme();
  const paletteColor = theme.palette[color] || theme.palette.primary;
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${alpha(paletteColor.main, 0.18)}`,
        background: `linear-gradient(135deg, ${alpha(paletteColor.main, 0.12)} 0%, ${alpha(paletteColor.main, 0.04)} 100%)`
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(paletteColor.main, 0.18),
              color: paletteColor.main,
              boxShadow: `0 6px 16px ${alpha(paletteColor.main, 0.35)}`,
              border: `2px solid ${alpha(paletteColor.main, 0.25)}`
            }}
          >
            {icon}
          </Avatar>
          <Chip label={title} color={color === 'primary' ? 'primary' : 'default'} variant="outlined" size="small" />
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800, color: paletteColor.main }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

function MarketingLeads() {
  const theme = useTheme();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase?.() || user?.role || '';
  const isB2B = userRole === 'b2b_marketing';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [leadsData, setLeadsData] = useState({ leads: [], stats: {}, filters: { statuses: [], phases: [] } });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const [leadForm, setLeadForm] = useState({
    studentName: '',
    consultancyName: '',
    branch: '',
    yearOfStudy: '',
    completionYear: '',
    countries: [],
    universityName: '',
    mobile: '',
    email: '',
    parentsAnnualIncome: ''
  });
  const [leadFormErrors, setLeadFormErrors] = useState({});
  const [creatingLead, setCreatingLead] = useState(false);

  const loadLeads = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const response = await fetchMarketingLeads({
          status: statusFilter,
          phase: phaseFilter,
          sort: sortOrder,
          search: debouncedSearch
        });
        const payload = response?.data ?? response;
        setLeadsData({
          leads: payload?.leads ?? [],
          stats: payload?.stats ?? {},
          filters: {
            statuses: payload?.filters?.statuses ?? [],
            phases: payload?.filters?.phases ?? []
          }
        });
      } catch (apiError) {
        console.error('Failed to fetch marketing leads:', apiError);
        setError(apiError.response?.data?.message || 'Unable to load leads. Please try again.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [statusFilter, phaseFilter, sortOrder, debouncedSearch]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    loadLeads({ showLoader: true });
  }, [loadLeads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeads({ showLoader: false });
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportMarketingLeads({
        status: statusFilter,
        phase: phaseFilter,
        search: debouncedSearch
      });
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marketing_leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, severity: 'success', message: 'Leads export generated successfully.' });
    } catch (apiError) {
      console.error('Failed to export marketing leads:', apiError);
      setSnackbar({
        open: true,
        severity: 'error',
        message: apiError.response?.data?.message || 'Failed to export leads. Please try again.'
      });
    }
  };

  const leads = leadsData.leads ?? [];
  const stats = leadsData.stats ?? {};
  const statusOptions = ['ALL', ...(leadsData.filters?.statuses ?? [])];
  const phaseOptions = ['ALL', ...(leadsData.filters?.phases ?? [])];

  const emptyState = !loading && leads.length === 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
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
            Lead Intelligence
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Track prospect engagement, prioritize follow-ups, and export marketing-ready lists.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

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
            minHeight: '60vh',
            gap: 3
          }}
        >
          <CircularProgress size={56} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Loading real marketing leads…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching student records, counselor assignments, and recent activity
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatBadge icon={<PeopleIcon />} title="Total Leads" value={stats.total ?? 0} color="primary" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatBadge icon={<TimelineIcon />} title="Active" value={stats.active ?? 0} color="info" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatBadge icon={<TimelineIcon />} title="Converted" value={stats.completed ?? 0} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatBadge
                icon={<TimelineIcon />}
                title="Avg Lead Age"
                value={`${stats.averageAgingDays ?? 0} days`}
                color="warning"
              />
            </Grid>
          </Grid>

          <Card
            sx={{
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`
            }}
          >
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Create New Lead
                </Typography>
              }
              subheader="Capture a new prospect for your marketing pipeline"
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Row 1: core identity */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Student Name"
                      placeholder="Enter full name"
                      fullWidth
                      required
                      value={leadForm.studentName}
                      onChange={(e) => setLeadForm({ ...leadForm, studentName: e.target.value })}
                      error={!!leadFormErrors.studentName}
                      helperText={leadFormErrors.studentName}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {isB2B ? (
                      <TextField
                        label="Consultancy Name"
                        placeholder="Enter consultancy name"
                        fullWidth
                        required
                        value={leadForm.consultancyName}
                        onChange={(e) =>
                          setLeadForm((prev) => ({
                            ...prev,
                            consultancyName: e.target.value.toUpperCase()
                          }))
                        }
                        error={!!leadFormErrors.consultancyName}
                        helperText={leadFormErrors.consultancyName}
                      />
                    ) : (
                      <TextField
                        label="Branch"
                        placeholder="e.g., Computer Science"
                        fullWidth
                        required
                        value={leadForm.branch}
                        onChange={(e) => setLeadForm({ ...leadForm, branch: e.target.value })}
                        error={!!leadFormErrors.branch}
                        helperText={leadFormErrors.branch}
                      />
                    )}
                  </Grid>
                </Grid>

                {/* Row 2: academic timeline */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Year of Study"
                      placeholder="e.g., 2"
                      fullWidth
                      required
                      type="number"
                      inputProps={{ maxLength: 1, min: 0, max: 9 }}
                      value={leadForm.yearOfStudy}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow single digit (0-9)
                        if (value === '' || (value.length <= 1 && /^[0-9]$/.test(value))) {
                          setLeadForm({ ...leadForm, yearOfStudy: value });
                        }
                      }}
                      error={!!leadFormErrors.yearOfStudy}
                      helperText={leadFormErrors.yearOfStudy}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Completion Year"
                      placeholder="e.g., 2027"
                      fullWidth
                      required
                      type="number"
                      value={leadForm.completionYear}
                      onChange={(e) => setLeadForm({ ...leadForm, completionYear: e.target.value })}
                      error={!!leadFormErrors.completionYear}
                      helperText={leadFormErrors.completionYear}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!leadFormErrors.countries}>
                      <InputLabel id="lead-countries-label">Target Countries</InputLabel>
                      <Select
                        labelId="lead-countries-label"
                        multiple
                        label="Target Countries"
                        value={leadForm.countries}
                        onChange={(e) =>
                          setLeadForm({ ...leadForm, countries: e.target.value })
                        }
                        renderValue={(selected) => selected.join(', ')}
                      >
                        {['USA', 'UK', 'Germany', 'Canada', 'Australia', 'Ireland', 'Greece', 'Denmark', 'Italy', 'France', 'Finland', 'Singapore', 'Dubai', 'Malta'].map((country) => (
                          <MenuItem key={country} value={country}>
                            {country}
                          </MenuItem>
                        ))}
                      </Select>
                      {leadFormErrors.countries && (
                        <Typography variant="caption" color="error">
                          {leadFormErrors.countries}
                        </Typography>
                      )}
                    </FormControl>
                    {leadForm.countries.length > 0 && (
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        {leadForm.countries.map((country) => (
                          <Chip key={country} label={country} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>

                {/* Row 3: university + contact */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="College Name"
                      placeholder="e.g., college of Toronto"
                      fullWidth
                      required
                      value={leadForm.universityName}
                      onChange={(e) => setLeadForm({ ...leadForm, universityName: e.target.value })}
                      error={!!leadFormErrors.universityName}
                      helperText={leadFormErrors.universityName}
                    />
                  </Grid>
                  {!isB2B && (
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Mobile Number"
                        placeholder="Enter contact number"
                        fullWidth
                        required
                        value={leadForm.mobile}
                        onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                        error={!!leadFormErrors.mobile}
                        helperText={leadFormErrors.mobile}
                      />
                    </Grid>
                  )}
                  {isB2B && (
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Mobile Number"
                        placeholder="Enter contact number (Optional)"
                        fullWidth
                        value={leadForm.mobile}
                        onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                        error={!!leadFormErrors.mobile}
                        helperText={leadFormErrors.mobile}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={isB2B ? 6 : 3}>
                    <TextField
                      label="Email"
                      placeholder="Optional email"
                      fullWidth
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      error={!!leadFormErrors.email}
                      helperText={leadFormErrors.email}
                    />
                  </Grid>
                </Grid>

                {/* Row 4: financials */}
                {!isB2B && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Parents Annual Income"
                        placeholder="e.g., 800000 (Optional)"
                        fullWidth
                        type="number"
                        value={leadForm.parentsAnnualIncome}
                        onChange={(e) => setLeadForm({ ...leadForm, parentsAnnualIncome: e.target.value })}
                        error={!!leadFormErrors.parentsAnnualIncome}
                        helperText={leadFormErrors.parentsAnnualIncome}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Submit button at bottom */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 3
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.2,
                      borderRadius: 999,
                      fontWeight: 600
                    }}
                    onClick={async () => {
                      const errors = {};
                      if (!leadForm.studentName.trim()) errors.studentName = 'Student name is required';
                      if (!isB2B && !leadForm.branch.trim()) errors.branch = 'Branch is required';
                      if (isB2B && !leadForm.consultancyName.trim()) errors.consultancyName = 'Consultancy name is required';
                      if (!leadForm.yearOfStudy) errors.yearOfStudy = 'Year of study is required';
                      if (!leadForm.completionYear) errors.completionYear = 'Completion year is required';
                      if (!leadForm.countries.length) errors.countries = 'Select at least one country';
                      if (!leadForm.universityName.trim()) errors.universityName = 'University name is required';
                      // Mobile number is required for regular marketing, optional for B2B marketing
                      if (!isB2B && (!leadForm.mobile || !leadForm.mobile.trim())) errors.mobile = 'Mobile number is required';

                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (leadForm.email && !emailRegex.test(leadForm.email)) {
                        errors.email = 'Enter a valid email address';
                      }

                      if (Object.keys(errors).length) {
                        setLeadFormErrors(errors);
                        setSnackbar({
                          open: true,
                          severity: 'error',
                          message: 'Please fill in all required fields correctly.'
                        });
                        return;
                      }

                      setLeadFormErrors({});
                      try {
                        setCreatingLead(true);

                        // Prepare clean data for submission
                        const submitData = {
                          studentName: leadForm.studentName.trim(),
                          branch: isB2B ? undefined : leadForm.branch.trim(),
                          consultancyName: isB2B ? leadForm.consultancyName.trim() : undefined,
                          yearOfStudy: leadForm.yearOfStudy ? parseInt(leadForm.yearOfStudy, 10) : undefined,
                          completionYear: leadForm.completionYear ? parseInt(leadForm.completionYear, 10) : undefined,
                          countries: leadForm.countries,
                          universityName: leadForm.universityName.trim(),
                          mobile: leadForm.mobile ? leadForm.mobile.trim() : undefined,
                          email: leadForm.email ? leadForm.email.trim() : undefined,
                          parentsAnnualIncome: leadForm.parentsAnnualIncome ? parseInt(leadForm.parentsAnnualIncome, 10) : undefined
                        };

                        const response = await axiosInstance.post('/marketing/leads', submitData);
                        setSnackbar({
                          open: true,
                          severity: 'success',
                          message: response.data?.message || 'Lead created successfully.'
                        });
                        setLeadForm({
                          studentName: '',
                          consultancyName: '',
                          branch: '',
                          yearOfStudy: '',
                          completionYear: '',
                          countries: [],
                          universityName: '',
                          mobile: '',
                          email: '',
                          parentsAnnualIncome: ''
                        });
                        await loadLeads({ showLoader: false });
                      } catch (apiError) {
                        console.error('Failed to create lead:', apiError);
                        const errorMessage = apiError.response?.data?.message ||
                          (apiError.response?.data?.errors?.join('. ') || 'Failed to create lead. Please try again.');
                        setSnackbar({
                          open: true,
                          severity: 'error',
                          message: errorMessage
                        });

                        // Display field-specific errors if provided
                        if (apiError.response?.data?.errors) {
                          const fieldErrors = {};
                          apiError.response.data.errors.forEach((err, index) => {
                            // Try to match error to field
                            if (err.includes('Student name')) fieldErrors.studentName = err;
                            else if (err.includes('Branch')) fieldErrors.branch = err;
                            else if (err.includes('Consultancy')) fieldErrors.consultancyName = err;
                            else if (err.includes('Year of study')) fieldErrors.yearOfStudy = err;
                            else if (err.includes('Completion year')) fieldErrors.completionYear = err;
                            else if (err.includes('country')) fieldErrors.countries = err;
                            else if (err.includes('University') || err.includes('College')) fieldErrors.universityName = err;
                            else if (err.includes('Mobile')) fieldErrors.mobile = err;
                            else if (err.includes('email') || err.includes('Email')) fieldErrors.email = err;
                          });
                          if (Object.keys(fieldErrors).length > 0) {
                            setLeadFormErrors(fieldErrors);
                          }
                        }
                      } finally {
                        setCreatingLead(false);
                      }
                    }}
                    disabled={creatingLead}
                  >
                    {creatingLead ? 'Creating Lead…' : 'Create Lead'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Lead list removed per requirements */}
        </Stack>
      )}

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

export default MarketingLeads;
