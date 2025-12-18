import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';

function B2BMarketingProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        specialization: user.specialization || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.put('/auth/me', formData);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      specialization: user?.specialization || '',
      bio: user?.bio || ''
    });
    setEditing(false);
    setError(null);
  };

  const InfoItem = ({ icon, label, value, name, editable = false }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{
        mr: 2,
        p: 1,
        borderRadius: '50%',
        bgcolor: 'primary.light',
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {editing && editable ? (
          <TextField
            name={name}
            value={value}
            onChange={handleInputChange}
            variant="standard"
            fullWidth
            size="small"
            sx={{ mt: 0.5 }}
          />
        ) : (
          <Typography variant="body1">
            {value || 'Not provided'}
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          My Profile
        </Typography>
        {!editing ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Profile updated successfully!
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {user?.name?.charAt(0) || 'B'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formData.name || user?.name || 'User Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                B2B Marketing Team
              </Typography>

              <Divider sx={{ width: '100%', my: 2 }} />

              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Account Status
                </Typography>
                <Box sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'success.light',
                  color: 'success.dark',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}>
                  Active
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Personal Information
            </Typography>

            <InfoItem
              icon={<PersonIcon />}
              label="Full Name"
              value={formData.name}
              name="name"
              editable={true}
            />

            <InfoItem
              icon={<EmailIcon />}
              label="Email Address"
              value={formData.email}
              name="email"
              editable={false}
            />

            <InfoItem
              icon={<PhoneIcon />}
              label="Phone Number"
              value={formData.phone}
              name="phone"
              editable={true}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Professional Information
            </Typography>

            <InfoItem
              icon={<WorkIcon />}
              label="Specialization"
              value={formData.specialization}
              name="specialization"
              editable={true}
            />

            {editing ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Bio
                </Typography>
                <TextField
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  placeholder="Tell us about yourself..."
                />
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Bio
                </Typography>
                <Typography variant="body1">
                  {formData.bio || 'No bio provided'}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default B2BMarketingProfile;

