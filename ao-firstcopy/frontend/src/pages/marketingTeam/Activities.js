import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';

import { fetchMarketingActivities } from '../../services/marketingService';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const TYPE_COLOR_MAP = {};

function MarketingActivities() {
  const theme = useTheme();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase?.() || user?.role || '';
  const isB2B = userRole === 'b2b_marketing';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activityData, setActivityData] = useState({ activities: [], meta: { availableTypes: [] } });
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(100);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });
  const [editingActivity, setEditingActivity] = useState(null);
  const [editForm, setEditForm] = useState({
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
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const loadActivities = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const response = await fetchMarketingActivities({
          type: typeFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: debouncedSearch,
          limit
        });
        const payload = response?.data ?? response;
        setActivityData({
          activities: payload?.activities ?? [],
          meta: payload?.meta ?? { availableTypes: [] }
        });
      } catch (apiError) {
        console.error('Failed to load marketing activities:', apiError);
        setError(apiError.response?.data?.message || 'Unable to load marketing activities. Please try again.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [typeFilter, startDate, endDate, debouncedSearch, limit]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    loadActivities({ showLoader: true });
  }, [loadActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities({ showLoader: false });
    setRefreshing(false);
    setSnackbar({ open: true, severity: 'success', message: 'Timeline refreshed with latest activity.' });
  };

  const activities = activityData.activities ?? [];
  const availableTypes = ['ALL', ...(activityData.meta?.availableTypes ?? [])];
  const emptyState = !loading && activities.length === 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
            Loading real activity logs…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pulling live marketing interactions, counselor notes, and automation events
          </Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {emptyState ? (
              <Box sx={{ py: 8, textAlign: 'center', px: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                  No activities found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  There are no marketing lead activities to display yet.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    {isB2B ? (
                      <TableCell>Consultancy Name</TableCell>
                    ) : (
                      <TableCell>Branch</TableCell>
                    )}
                    <TableCell>Year of Study</TableCell>
                    <TableCell>Completion Year</TableCell>
                    <TableCell>Countries</TableCell>
                    <TableCell>University</TableCell>
                    <TableCell>Email</TableCell>
                    {!isB2B && <TableCell>Parents Income</TableCell>}
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => {
                    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
                    const student = activity.student || {};
                    const countries = typeof student.countries === 'string'
                      ? student.countries.split(',').filter(Boolean)
                      : [];
                    const meta = activity.metadata || {};

                    const consultancyName =
                      meta.consultancyName ||
                      (student.name && student.name.toUpperCase && student.name.toUpperCase());

                    const email = student.email || meta.email || '-';

                    return (
                      <TableRow key={activity.id}>
                        <TableCell>{student.name || '-'}</TableCell>
                        {isB2B ? (
                          <TableCell>{consultancyName || '-'}</TableCell>
                        ) : (
                          <TableCell>{student.branch || '-'}</TableCell>
                        )}
                        <TableCell>{student.yearOfStudy ?? '-'}</TableCell>
                        <TableCell>{student.completionYear ?? '-'}</TableCell>
                        <TableCell>{countries.length ? countries.join(', ') : '-'}</TableCell>
                        <TableCell>{student.universityName || '-'}</TableCell>
                        <TableCell>{email}</TableCell>
                        {!isB2B && <TableCell>{student.parentsAnnualIncome ?? '-'}</TableCell>}
                        <TableCell>
                          {timestamp
                            ? `${format(timestamp, 'PPpp')} (${formatDistanceToNow(timestamp, { addSuffix: true })})`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const data = activity.metadata || {};
                              const student = activity.student || {};
                              setEditingActivity(activity);
                              setEditForm({
                                studentName: student.name || '',
                                consultancyName: data.consultancyName || '',
                                branch: student.branch || data.branch || '',
                                yearOfStudy: student.yearOfStudy || data.yearOfStudy || '',
                                completionYear: student.completionYear || data.completionYear || '',
                                countries:
                                  data.countries ||
                                  (typeof student.countries === 'string'
                                    ? student.countries.split(',').filter(Boolean)
                                    : []),
                                universityName: student.universityName || data.universityName || '',
                                mobile: student.phone || data.mobile || '',
                                email: data.email || '',
                                parentsAnnualIncome: student.parentsAnnualIncome || data.parentsAnnualIncome || ''
                              });
                              setEditErrors({});
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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

      {/* Edit Lead Dialog */}
      <Dialog
        open={!!editingActivity}
        onClose={() => setEditingActivity(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Lead Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Student Name"
              fullWidth
              required
              value={editForm.studentName}
              onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
              error={!!editErrors.studentName}
              helperText={editErrors.studentName}
            />
            {isB2B ? (
              <TextField
                label="Consultancy Name"
                fullWidth
                required
                value={editForm.consultancyName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    consultancyName: e.target.value.toUpperCase()
                  }))
                }
                error={!!editErrors.consultancyName}
                helperText={editErrors.consultancyName}
              />
            ) : (
              <TextField
                label="Branch"
                fullWidth
                required
                value={editForm.branch}
                onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                error={!!editErrors.branch}
                helperText={editErrors.branch}
              />
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Year of Study"
                type="number"
                fullWidth
                required
                value={editForm.yearOfStudy}
                onChange={(e) => setEditForm({ ...editForm, yearOfStudy: e.target.value })}
                error={!!editErrors.yearOfStudy}
                helperText={editErrors.yearOfStudy}
              />
              <TextField
                label="Completion Year"
                type="number"
                fullWidth
                required
                value={editForm.completionYear}
                onChange={(e) => setEditForm({ ...editForm, completionYear: e.target.value })}
                error={!!editErrors.completionYear}
                helperText={editErrors.completionYear}
              />
            </Stack>
            <FormControl fullWidth error={!!editErrors.countries}>
              <InputLabel id="edit-lead-countries-label">Target Countries</InputLabel>
              <Select
                labelId="edit-lead-countries-label"
                multiple
                label="Target Countries"
                value={editForm.countries}
                onChange={(e) => setEditForm({ ...editForm, countries: e.target.value })}
                renderValue={(selected) => selected.join(', ')}
              >
                {['Italy', 'France', 'Germany', 'USA', 'UK', 'Canada', 'Australia', 'Ireland'].map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="University Name"
              fullWidth
              required
              value={editForm.universityName}
              onChange={(e) => setEditForm({ ...editForm, universityName: e.target.value })}
              error={!!editErrors.universityName}
              helperText={editErrors.universityName}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Mobile Number"
                fullWidth
                required
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                error={!!editErrors.mobile}
                helperText={editErrors.mobile}
              />
              <TextField
                label="Email"
                fullWidth
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                error={!!editErrors.email}
                helperText={editErrors.email}
              />
            </Stack>
            {!isB2B && (
              <TextField
                label="Parents Annual Income"
                type="number"
                fullWidth
                placeholder="Optional"
                value={editForm.parentsAnnualIncome}
                onChange={(e) => setEditForm({ ...editForm, parentsAnnualIncome: e.target.value })}
                error={!!editErrors.parentsAnnualIncome}
                helperText={editErrors.parentsAnnualIncome}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingActivity(null)} disabled={savingEdit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!editingActivity?.student?.id) {
                setEditingActivity(null);
                return;
              }

              const errors = {};
              if (!editForm.studentName.trim()) errors.studentName = 'Student name is required';
              if (!isB2B && !editForm.branch.trim()) errors.branch = 'Branch is required';
              if (isB2B && !editForm.consultancyName.trim()) errors.consultancyName = 'Consultancy name is required';
              if (!editForm.yearOfStudy) errors.yearOfStudy = 'Year of study is required';
              if (!editForm.completionYear) errors.completionYear = 'Completion year is required';
              if (!editForm.countries.length) errors.countries = 'Select at least one country';
              if (!editForm.universityName.trim()) errors.universityName = 'University name is required';
              if (!editForm.mobile || !editForm.mobile.trim()) errors.mobile = 'Mobile number is required';

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (editForm.email && !emailRegex.test(editForm.email)) {
                errors.email = 'Enter a valid email address';
              }

              if (Object.keys(errors).length) {
                setEditErrors(errors);
                return;
              }

              setEditErrors({});
              try {
                setSavingEdit(true);
                await axiosInstance.put(`/marketing/leads/${editingActivity.student.id}`, editForm);
                setSnackbar({
                  open: true,
                  severity: 'success',
                  message: 'Lead updated successfully.'
                });
                setEditingActivity(null);
                await loadActivities({ showLoader: false });
              } catch (apiError) {
                console.error('Failed to update lead:', apiError);
                setSnackbar({
                  open: true,
                  severity: 'error',
                  message: apiError.response?.data?.message || 'Failed to update lead. Please try again.'
                });
              } finally {
                setSavingEdit(false);
              }
            }}
            disabled={savingEdit}
          >
            {savingEdit ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MarketingActivities;
