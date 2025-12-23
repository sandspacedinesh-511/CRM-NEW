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
  Typography,
  useTheme,
  Fade,
  Zoom,
  Grow,
  Slide,
  Badge,
  Avatar,
  Container
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Campaign as CampaignIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
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
  const theme = useTheme();
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
  const [pulseAnimation, setPulseAnimation] = useState(0);
  const navigate = useNavigate();

  // Pulse animation for real-time indicators
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 2);
    }, 2000);
    return () => clearInterval(pulseInterval);
  }, []);

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
        <Fade in={true} timeout={600}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
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
            <Typography variant="body1" sx={{ 
              fontWeight: 500,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Loading {title.toLowerCase()}...
            </Typography>
          </Box>
        </Fade>
      );
    }

    if (members.length === 0) {
      return (
        <Zoom in={true} timeout={800}>
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4
            }}
          >
            <Box sx={{
              display: 'inline-flex',
              p: 3,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              mb: 3
            }}>
              {roleIconMap[role]}
            </Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {emptyStateMessage}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Use the &ldquo;{addButtonLabel}&rdquo; button to add your first member.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                }
              }}
            >
              {addButtonLabel}
            </Button>
          </Box>
        </Zoom>
      );
    }

    return (
      <TableContainer sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
            }}>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Phone</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Created</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member, index) => (
              <Slide direction="left" in={true} timeout={300 + (index * 50)} key={member.id}>
                <TableRow 
                  hover
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
                        width: 36,
                        height: 36,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}>
                        {member.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.phone || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
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
                      <Switch
                        color="primary"
                        checked={Boolean(member.active)}
                        onChange={() => handleToggleStatus(member)}
                        disabled={statusUpdatingId === member.id}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.success.main,
                            '& + .MuiSwitch-track': {
                              backgroundColor: theme.palette.success.main,
                            },
                          },
                          '& .MuiSwitch-thumb': {
                            boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.3)}`
                          }
                        }}
                      />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {member.createdAt ? format(new Date(member.createdAt), 'PP') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {(role === 'marketing' || role === 'b2b_marketing' || role === 'telecaller') && (
                        <Tooltip title={role === 'telecaller' ? 'View Telecaller' : 'View Leads'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleViewMember(member)}
                              sx={{
                                color: 'primary.main',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  background: alpha(theme.palette.primary.main, 0.1),
                                  transform: 'scale(1.2) rotate(5deg)'
                                }
                              }}
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
                            sx={{
                              color: 'info.main',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: alpha(theme.palette.info.main, 0.1),
                                transform: 'scale(1.2) rotate(-5deg)'
                              }
                            }}
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
                            sx={{
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                background: alpha(theme.palette.error.main, 0.1),
                                transform: 'scale(1.2) rotate(5deg)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              </Slide>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [loading, members, title, emptyStateMessage, addButtonLabel, statusUpdatingId, theme, pulseAnimation, role]);

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
              p: 3
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    {roleIconMap[role]}
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
                      {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                    }
                  }}
                >
                  {addButtonLabel}
                </Button>
              </Box>
            </Box>
            <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            <CardContent sx={{ p: 3 }}>
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
              {renderContent}
            </CardContent>
          </Card>
        </Fade>

      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog} 
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
                {dialogMode === 'add' ? <AddIcon /> : <EditIcon />}
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {dialogMode === 'add' ? `Add ${title}` : `Edit ${title}`}
              </Typography>
            </Box>
            <IconButton 
              onClick={closeDialog}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'primary.main' }} />
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Phone"
              value={formValues.phone}
              onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ 
              my: 2,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              borderWidth: 1
            }}>
              <Chip 
                label="Security" 
                size="small"
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  fontWeight: 600
                }}
              />
            </Divider>

            <TextField
              label={dialogMode === 'add' ? "Password" : "New Password"}
              type="password"
              value={formValues.password}
              onChange={(event) => setFormValues((prev) => ({ ...prev, password: event.target.value }))}
              required={dialogMode === 'add'}
              helperText={dialogMode === 'edit' ? 'Leave blank to keep the current password.' : 'Min 8 chars'}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}>
          <Button 
            onClick={closeDialog} 
            disabled={saving}
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
            onClick={handleDialogSubmit}
            disabled={saving}
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
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={closeDeleteDialog} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 20px 60px ${alpha(theme.palette.error.main, 0.2)}`,
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(theme.palette.error.main, 0.8)} 100%)`,
              color: 'white'
            }}>
              <DeleteIcon />
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: 'error.main'
            }}>
              Delete {title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body1">
            Are you sure you want to delete{' '}
            <Box component="strong" sx={{ color: 'error.main', fontWeight: 600 }}>
              {memberToDelete?.name}
            </Box>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
          borderTop: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
        }}>
          <Button 
            onClick={closeDeleteDialog} 
            disabled={Boolean(deletingId)}
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
            color="error"
            onClick={handleConfirmDelete}
            disabled={Boolean(deletingId)}
            sx={{
              borderRadius: 2,
              px: 4,
              boxShadow: `0 4px 15px ${alpha(theme.palette.error.main, 0.3)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 25px ${alpha(theme.palette.error.main, 0.5)}`
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground
              }
            }}
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
        TransitionComponent={Slide}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: `0 8px 32px ${alpha(
              snackbar.severity === 'error' ? theme.palette.error.main : 
              snackbar.severity === 'warning' ? theme.palette.warning.main : 
              theme.palette.success.main, 
              0.3
            )}`,
            border: `1px solid ${alpha(
              snackbar.severity === 'error' ? theme.palette.error.main : 
              snackbar.severity === 'warning' ? theme.palette.warning.main : 
              theme.palette.success.main, 
              0.2
            )}`
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};

export default TeamManagementPage;

