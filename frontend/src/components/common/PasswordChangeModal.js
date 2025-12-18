import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axiosInstance from '../../utils/axios';

const validationSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your password')
});

const PasswordChangeModal = ({ open, onClose, onSuccess, isRequired = false }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        await axiosInstance.post('/auth/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });
        
        onSuccess?.();
        onClose();
        formik.resetForm();
      } catch (error) {
        console.error('Password change error:', error);
        setError(error.response?.data?.message || 'Failed to change password');
      } finally {
        setLoading(false);
      }
    }
  });

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'default' };
    
    let score = 0;
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    score = Object.values(requirements).filter(Boolean).length;
    
    if (score <= 2) return { score, label: 'Weak', color: 'error' };
    if (score <= 3) return { score, label: 'Fair', color: 'warning' };
    if (score <= 4) return { score, label: 'Good', color: 'info' };
    return { score, label: 'Strong', color: 'success' };
  };

  const passwordStrength = getPasswordStrength(formik.values.newPassword);

  return (
    <Dialog 
      open={open} 
      onClose={isRequired ? undefined : onClose}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={isRequired}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">
            {isRequired ? 'Password Change Required' : 'Change Password'}
          </Typography>
        </Box>
        {isRequired && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            For security reasons, you must change your password before continuing.
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
              helperText={formik.touched.currentPassword && formik.errors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              name="newPassword"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
              helperText={formik.touched.newPassword && formik.errors.newPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {formik.values.newPassword && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2">Password Strength:</Typography>
                  <Chip 
                    label={passwordStrength.label} 
                    color={passwordStrength.color}
                    size="small"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(passwordStrength.score / 5) * 100}
                  color={passwordStrength.color}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
            
            <TextField
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Password Requirements:
              </Typography>
              <Stack spacing={0.5}>
                {[
                  { label: 'At least 8 characters', met: formik.values.newPassword?.length >= 8 },
                  { label: 'One uppercase letter', met: /[A-Z]/.test(formik.values.newPassword || '') },
                  { label: 'One lowercase letter', met: /[a-z]/.test(formik.values.newPassword || '') },
                  { label: 'One number', met: /\d/.test(formik.values.newPassword || '') },
                  { label: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(formik.values.newPassword || '') }
                ].map((req, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={1}>
                    {req.met ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="body2" 
                      color={req.met ? 'success.main' : 'text.secondary'}
                    >
                      {req.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </form>
      </DialogContent>
      
      <DialogActions>
        {!isRequired && (
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          onClick={formik.handleSubmit}
          variant="contained"
          disabled={loading || !formik.isValid}
          startIcon={loading ? <LinearProgress size={20} /> : <SecurityIcon />}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeModal;
