import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    TextField,
    Button,
    Alert,
    Avatar,
    Divider,
    IconButton,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    useTheme,
    Fade,
    Grow,
    Skeleton,
    Chip,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Tooltip,
    InputAdornment,
    Snackbar
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CalendarToday as JoinDateIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Settings as SettingsIcon,
    CheckCircle as CheckCircleIcon,
    Upload as UploadIcon,
    LocationOn as LocationIcon,
    AdminPanelSettings as AdminIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';

function Profile() {
    const theme = useTheme();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editing, setEditing] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        createdAt: null,
        avatar: null,
        location: '',
        lastLogin: null,
        preferences: {
            notifications: true,
            emailAlerts: true,
            theme: 'light'
        }
    });

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        location: ''
    });

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get('/auth/me');

            setProfileData(response.data);

            setFormData({
                name: response.data.name || '',
                phone: response.data.phone || '',
                bio: response.data.bio || '',
                location: response.data.location || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError(null);
            setSuccess(null);

            const updateData = {
                name: formData.name,
                phone: formData.phone,
                bio: formData.bio,
                location: formData.location
            };

            await axiosInstance.put('/auth/me', updateData);

            setSuccess('Profile updated successfully');
            setEditing(false);
            fetchProfileData();
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.message || error.message || 'Failed to update profile');
        }
    };

    const handlePreferenceChange = async (key, value) => {
        try {
            const newPreferences = {
                ...profileData.preferences,
                [key]: value
            };

            // Optimistic update
            setProfileData(prev => ({
                ...prev,
                preferences: newPreferences
            }));

            await axiosInstance.put('/auth/me', {
                preferences: newPreferences
            });

            showSnackbar('Preferences updated successfully', 'success');
        } catch (error) {
            console.error('Error updating preferences:', error);
            showSnackbar('Failed to update preferences', 'error');
            // Revert on error
            fetchProfileData();
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            await axiosInstance.post('/auth/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSuccess('Avatar updated successfully');
            fetchProfileData();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setError('Failed to upload avatar. Please try again.');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            await axiosInstance.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setSuccess('Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.response?.data?.message || 'Failed to change password');
        }
    };

    const LoadingSkeleton = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={8}>
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
        </Grid>
    );

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <LoadingSkeleton />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                {/* Header */}
                <Fade in={true} timeout={600}>
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1
                            }}
                        >
                            Admin Profile
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Manage your administrator account and security settings
                        </Typography>
                    </Box>
                </Fade>

                {error && (
                    <Fade in={true} timeout={800}>
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 2
                            }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    </Fade>
                )}

                {success && (
                    <Fade in={true} timeout={800}>
                        <Alert
                            severity="success"
                            sx={{
                                mb: 3,
                                borderRadius: 2
                            }}
                            onClose={() => setSuccess(null)}
                        >
                            {success}
                        </Alert>
                    </Fade>
                )}

                <Grid container spacing={3}>
                    {/* Profile Overview */}
                    <Fade in={true} timeout={800}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                                border: `1px solid ${theme.palette.divider}`
                            }}>
                                <CardContent sx={{ textAlign: 'center', pb: 0 }}>
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        <Avatar
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                mx: 'auto',
                                                mb: 2,
                                                bgcolor: theme.palette.primary.main,
                                                fontSize: '3rem',
                                                border: `4px solid ${theme.palette.background.paper}`,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            src={profileData.avatar}
                                        >
                                            {profileData.name?.charAt(0)}
                                        </Avatar>
                                        <input
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="avatar-upload"
                                            type="file"
                                            onChange={handleAvatarUpload}
                                        />
                                        <label htmlFor="avatar-upload">
                                            <Tooltip title="Change Avatar">
                                                <IconButton
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 8,
                                                        right: 8,
                                                        bgcolor: theme.palette.primary.main,
                                                        color: 'white',
                                                        '&:hover': {
                                                            bgcolor: theme.palette.primary.dark
                                                        }
                                                    }}
                                                    component="span"
                                                >
                                                    <UploadIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </label>
                                    </Box>

                                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                                        {profileData.name}
                                    </Typography>
                                    <Chip
                                        label="Administrator"
                                        color="primary"
                                        icon={<AdminIcon />}
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        {profileData.bio || 'No bio available'}
                                    </Typography>
                                </CardContent>

                                <Divider />

                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <EmailIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Email"
                                            secondary={profileData.email}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Phone"
                                            secondary={profileData.phone || 'Not provided'}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        />
                                    </ListItem>
                                    {profileData.location && (
                                        <ListItem>
                                            <ListItemIcon>
                                                <LocationIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Location"
                                                secondary={profileData.location}
                                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                            />
                                        </ListItem>
                                    )}
                                    <ListItem>
                                        <ListItemIcon>
                                            <JoinDateIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Member Since"
                                            secondary={profileData.createdAt ? format(new Date(profileData.createdAt), 'MMM d, yyyy') : 'N/A'}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        />
                                    </ListItem>
                                </List>
                            </Card>
                        </Grid>
                    </Fade>

                    {/* Main Content */}
                    <Grow in={true} timeout={1000}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                                border: `1px solid ${theme.palette.divider}`
                            }}>
                                <CardContent>
                                    <Tabs
                                        value={tabValue}
                                        onChange={(e, newValue) => setTabValue(newValue)}
                                        sx={{ mb: 3 }}
                                    >
                                        <Tab label="Profile" icon={<PersonIcon />} />
                                        <Tab label="Security" icon={<SecurityIcon />} />
                                        <Tab label="Settings" icon={<SettingsIcon />} />
                                    </Tabs>

                                    {/* Profile Tab */}
                                    {tabValue === 0 && (
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    Personal Information
                                                </Typography>
                                                <Button
                                                    variant={editing ? "outlined" : "contained"}
                                                    startIcon={editing ? <CancelIcon /> : <EditIcon />}
                                                    onClick={() => setEditing(!editing)}
                                                >
                                                    {editing ? 'Cancel' : 'Edit Profile'}
                                                </Button>
                                            </Box>

                                            <Box component="form" onSubmit={handleSubmit}>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            fullWidth
                                                            label="Full Name"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            disabled={!editing}
                                                            required
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            fullWidth
                                                            label="Phone Number"
                                                            value={formData.phone}
                                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                            disabled={!editing}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            fullWidth
                                                            label="Location"
                                                            value={formData.location}
                                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                            disabled={!editing}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            label="Bio"
                                                            value={formData.bio}
                                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                            disabled={!editing}
                                                            multiline
                                                            rows={4}
                                                        />
                                                    </Grid>
                                                    {editing && (
                                                        <Grid item xs={12}>
                                                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={() => setEditing(false)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    variant="contained"
                                                                    startIcon={<SaveIcon />}
                                                                >
                                                                    Save Changes
                                                                </Button>
                                                            </Box>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Security Tab */}
                                    {tabValue === 1 && (
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                                Change Password
                                            </Typography>

                                            <Box component="form" onSubmit={handlePasswordChange}>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            type={showPassword ? 'text' : 'password'}
                                                            label="Current Password"
                                                            value={passwordData.currentPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                            required
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <InputAdornment position="start">
                                                                        <LockIcon color="action" />
                                                                    </InputAdornment>
                                                                ),
                                                                endAdornment: (
                                                                    <InputAdornment position="end">
                                                                        <IconButton
                                                                            onClick={() => setShowPassword(!showPassword)}
                                                                            edge="end"
                                                                        >
                                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                )
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            fullWidth
                                                            type={showPassword ? 'text' : 'password'}
                                                            label="New Password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            required
                                                            helperText="At least 8 characters, with uppercase, lowercase, number, and special char"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            fullWidth
                                                            type={showPassword ? 'text' : 'password'}
                                                            label="Confirm New Password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            required
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Button
                                                            type="submit"
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<SaveIcon />}
                                                        >
                                                            Update Password
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Settings Tab */}
                                    {tabValue === 2 && (
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                                Preferences & Settings
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid item xs={12}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={profileData.preferences?.notifications || false}
                                                                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                                                            />
                                                        }
                                                        label="Enable Notifications"
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={profileData.preferences?.emailAlerts || false}
                                                                onChange={(e) => handlePreferenceChange('emailAlerts', e.target.checked)}
                                                            />
                                                        }
                                                        label="Email Alerts"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grow>
                </Grid>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default Profile;
