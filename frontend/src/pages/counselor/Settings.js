import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axios';

function CounselorSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    notifications: user?.preferences?.notifications ?? true,
    emailAlerts: user?.preferences?.emailAlerts ?? true,
    theme: user?.preferences?.theme || 'light'
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.put('/auth/me', {
        preferences: settings
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Settings
        </Button>
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
          Settings updated successfully!
        </Alert>
      </Snackbar>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SettingsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              General Settings
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')}
                  color="primary"
                />
              }
              label="Enable in-app notifications"
              sx={{ ml: 0 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 5, mt: 0.5 }}>
              Receive notifications about students, applications, and updates
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Email Alerts
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailAlerts}
                  onChange={() => handleToggle('emailAlerts')}
                  color="primary"
                />
              }
              label="Enable email alerts"
              sx={{ ml: 0 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 5, mt: 0.5 }}>
              Receive email notifications for important updates
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CounselorSettings;

