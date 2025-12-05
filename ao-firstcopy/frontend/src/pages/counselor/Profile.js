import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
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
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarToday as JoinDateIcon,
  School as StudentsIcon,
  Assignment as ApplicationsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Work as WorkIcon,
  Education as EducationIcon,
  Psychology as PsychologyIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function Profile() {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    totalStudents: 0,
    activeApplications: 0,
    successfulApplications: 0,
    createdAt: null,
    avatar: null,
    location: '',
    experience: '',
    education: '',
    certifications: [],
    languages: [],
    isActive: true,
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
    specialization: '',
    bio: '',
    location: '',
    experience: '',
    education: ''
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/profile');
      
      if (response.data.success) {
        setProfileData(response.data.data || response.data);
      } else {
        setProfileData(response.data);
      }
      
      setFormData({
        name: response.data.name || response.data.data?.name || '',
        phone: response.data.phone || response.data.data?.phone || '',
        specialization: response.data.specialization || response.data.data?.specialization || '',
        bio: response.data.bio || response.data.data?.bio || '',
        location: response.data.location || response.data.data?.location || '',
        experience: response.data.experience || response.data.data?.experience || '',
        education: response.data.education || response.data.data?.education || ''
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
        specialization: formData.specialization,
        bio: formData.bio,
        location: formData.location,
        experience: formData.experience,
        education: formData.education
      };

      await axiosInstance.put('/counselor/profile', updateData);
      
      setSuccess('Profile updated successfully');
      setEditing(false);
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await axiosInstance.post('/counselor/profile/avatar', formData, {
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

  const getPerformanceStats = () => {
    const total = profileData.totalStudents || 0;
    const active = profileData.activeApplications || 0;
    const successful = profileData.successfulApplications || 0;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    return { total, active, successful, successRate };
  };

  const stats = getPerformanceStats();

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
              Profile & Settings
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage your profile information and preferences
            </Typography>
          </Box>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
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
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
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
                      {profileData.name.charAt(0)}
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
                    label="Counselor"
                    color="primary"
                    icon={<PsychologyIcon />}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {profileData.specialization || 'No specialization set'}
                  </Typography>
                  
                  <Chip
                    label={profileData.isActive ? 'Active' : 'Inactive'}
                    color={profileData.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mb: 2 }}
                  />
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
                  {profileData.lastLogin && (
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Login"
                        secondary={format(new Date(profileData.lastLogin), 'MMM d, yyyy HH:mm')}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                  )}
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
                    <Tab label="Performance" icon={<TrendingUpIcon />} />
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
                              label="Specialization"
                              value={formData.specialization}
                              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
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
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Experience (Years)"
                              value={formData.experience}
                              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                              disabled={!editing}
                              type="number"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Education"
                              value={formData.education}
                              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
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

                  {/* Performance Tab */}
                  {tabValue === 1 && (
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Performance Statistics
                      </Typography>
                      
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                            border: `1px solid ${theme.palette.primary[200]}`
                          }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                {stats.total}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Total Students
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.info[50]} 0%, ${theme.palette.info[100]} 100%)`,
                            border: `1px solid ${theme.palette.info[200]}`
                          }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                                {stats.active}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Active Applications
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
                            border: `1px solid ${theme.palette.success[200]}`
                          }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                {stats.successful}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Successful Applications
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
                            border: `1px solid ${theme.palette.warning[200]}`
                          }}>
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                                {stats.successRate}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Success Rate
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Recent Activity
                      </Typography>
                      
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Profile updated successfully"
                            secondary="2 hours ago"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AssignmentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="New application submitted"
                            secondary="1 day ago"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SchoolIcon color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Student added to your portfolio"
                            secondary="3 days ago"
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}

                  {/* Security Tab */}
                  {tabValue === 2 && (
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                        Security Settings
                      </Typography>
                      
                      <Alert 
                        severity="info" 
                        sx={{ mb: 3 }}
                        icon={<InfoIcon />}
                      >
                        <Typography variant="body2">
                          Password changes are managed by the system administrator. Please contact your administrator if you need to change your password.
                        </Typography>
                      </Alert>
                      
                      <Card sx={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        border: '1px solid #e2e8f0'
                      }}>
                        <CardContent>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            For security reasons, password changes are restricted for counselor accounts.
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            If you need to change your password, please contact your system administrator.
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* Settings Tab */}
                  {tabValue === 3 && (
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
                                onChange={(e) => {
                                  // Handle notification preference change
                                }}
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
                                onChange={(e) => {
                                  // Handle email alerts preference change
                                }}
                              />
                            }
                            label="Email Alerts"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Theme</InputLabel>
                            <Select
                              value={profileData.preferences?.theme || 'light'}
                              onChange={(e) => {
                                // Handle theme change
                              }}
                              label="Theme"
                            >
                              <MenuItem value="light">Light</MenuItem>
                              <MenuItem value="dark">Dark</MenuItem>
                              <MenuItem value="auto">Auto</MenuItem>
                            </Select>
                          </FormControl>
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
    </Container>
  );
}

export default Profile; 