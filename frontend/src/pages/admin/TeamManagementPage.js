import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Campaign as CampaignIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  updateTeamMember,
  updateTeamMemberStatus
} from '../../services/adminTeamService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultFormValues = {
  name: '',
  email: '',
  phone: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
};

const roleIconMap = {
  telecaller: <PhoneIcon fontSize="small" />,
  marketing: <CampaignIcon fontSize="small" />,
};

import {
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { InputAdornment, Chip } from '@mui/material';

const TeamManagementPage = ({
  role,
  title,
  description,
  addButtonLabel,
  emptyStateMessage
}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formError, setFormError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const fetchMembers = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await fetchTeamMembers(role);
      const payload = response?.data ?? response;
      setMembers(Array.isArray(payload) ? payload : []);
      setError(null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        `Failed to load ${title.toLowerCase()}`;
      setError(message);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [role, title]);

  useEffect(() => {
    fetchMembers(true);
  }, [fetchMembers]);

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setFormValues(defaultFormValues);
    setFormError(null);
    setSelectedMember(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (member) => {
    setDialogMode('edit');
    setSelectedMember(member);
    setFormValues({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '',
      confirmPassword: ''
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setFormValues(defaultFormValues);
    setFormError(null);
    setSelectedMember(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDialogSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = formValues.name.trim();
    const trimmedEmail = formValues.email.trim();
    const trimmedPhone = formValues.phone.trim();
    const trimmedPassword = formValues.password.trim();

    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (dialogMode === 'add') {
      if (!trimmedPassword) {
        setFormError('Password is required for new accounts.');
        return;
      }
      if (trimmedPassword.length < 8) {
        setFormError('Password must be at least 8 characters.');
        return;
      }
      if (trimmedPassword !== formValues.confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    } else {
      // Edit mode validation
      if (trimmedPassword) {
        if (trimmedPassword.length < 8) {
          setFormError('Password must be at least 8 characters.');
          return;
        }
        if (trimmedPassword !== formValues.confirmPassword) {
          setFormError('Passwords do not match.');
          return;
        }
      }
    }

    const payload = {
      name: trimmedName,
      email: trimmedEmail
    };

    if (trimmedPhone) {
      payload.phone = trimmedPhone;
    }

    if (dialogMode === 'add') {
      payload.password = trimmedPassword;
    } else if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

    setSaving(true);
    try {
      const response = dialogMode === 'add'
        ? await createTeamMember(role, payload)
        : await updateTeamMember(role, selectedMember.id, payload);

      await fetchMembers(false);
      closeDialog();
      showSnackbar(response?.message || `${dialogMode === 'add' ? 'Created' : 'Updated'} successfully`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${dialogMode === 'add' ? 'create' : 'update'} ${title.toLowerCase()}`;
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = !member.active;
    setStatusUpdatingId(member.id);
    try {
      const response = await updateTeamMemberStatus(role, member.id, newStatus);
      await fetchMembers(false);
      showSnackbar(response?.message || 'Status updated successfully');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update status';
      showSnackbar(message, 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleOpenDeleteDialog = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deletingId) return;
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeletingId(memberToDelete.id);
    try {
      const response = await deleteTeamMember(role, memberToDelete.id);
      await fetchMembers(false);
      closeDeleteDialog();
      showSnackbar(response?.message || 'Deleted successfully');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete account';
      showSnackbar(message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewMember = (member) => {
    if (role === 'marketing') {
      navigate(`/admin/marketing-team/${member.id}/leads`, { state: { member } });
    } else if (role === 'b2b_marketing') {
      navigate(`/admin/b2b-marketing-team/${member.id}/leads`, { state: { member } });
    } else if (role === 'telecaller') {
      navigate(`/admin/telecallers/${member.id}/dashboard`, { state: { member } });
    }
  };

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading {title.toLowerCase()}...
          </Typography>
        </Box>
      );
    }

    if (members.length === 0) {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            color: 'text.secondary'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {emptyStateMessage}
          </Typography>
          <Typography variant="body2">
            Use the &ldquo;{addButtonLabel}&rdquo; button to add your first member.
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} hover>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone || '—'}</TableCell>
                <TableCell align="center">
                  <Switch
                    color="primary"
                    checked={Boolean(member.active)}
                    onChange={() => handleToggleStatus(member)}
                    disabled={statusUpdatingId === member.id}
                  />
                </TableCell>
                <TableCell>
                  {member.createdAt ? format(new Date(member.createdAt), 'PP') : '—'}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {(role === 'marketing' || role === 'b2b_marketing' || role === 'telecaller') && (
                      <Tooltip title={role === 'telecaller' ? 'View Telecaller' : 'View Leads'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleViewMember(member)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(member)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(member)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [loading, members, title, emptyStateMessage, addButtonLabel, statusUpdatingId]);

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              {roleIconMap[role]}
              <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            </Stack>
          }
          subheader={description}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              {addButtonLabel}
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {renderContent}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === 'add' ? `Add ${title}` : `Edit ${title}`}</DialogTitle>
        <DialogContent dividers>
          <Stack component="form" spacing={2} sx={{ mt: 1 }} onSubmit={handleDialogSubmit}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Full Name"
              value={formValues.name}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formValues.email}
              onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Phone"
              value={formValues.phone}
              onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 1 }}>
              <Chip label="Security" size="small" />
            </Divider>

            <TextField
              label={dialogMode === 'add' ? "Password" : "New Password"}
              type="password"
              value={formValues.password}
              onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
              required={dialogMode === 'add'}
              helperText={dialogMode === 'edit' ? 'Leave blank to keep the current password.' : 'Min 8 chars'}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={formValues.confirmPassword}
              onChange={(event) => setFormValues((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required={dialogMode === 'add' || !!formValues.password}
              disabled={dialogMode === 'edit' && !formValues.password}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDialogSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete {title}</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{memberToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={Boolean(deletingId)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={Boolean(deletingId)}
          >
            {deletingId ? 'Deleting...' : 'Delete'}
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
    </>
  );
};

export default TeamManagementPage;

