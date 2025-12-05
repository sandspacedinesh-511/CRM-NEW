import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Container,
  Paper,
  Grid,
  Divider,
  useTheme,
  alpha,
  Fade,
  Grow,
  Stack,
  Chip,
  Avatar,
  Card,
  Slide,
  Zoom,
  Tooltip,
  LinearProgress,
  Backdrop,
  Modal
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  School as SchoolIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedUserIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import MarketingNavbar from '../../components/marketing/Navbar';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'
    )
    .required('Password is required')
});

const features = [
  {
    icon: <SecurityIcon />,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and secure data transmission',
    color: '#2196f3',
    gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
  },
  {
    icon: <AnalyticsIcon />,
    title: 'Smart Analytics',
    description: 'AI-powered insights and real-time performance tracking',
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
  },
  {
    icon: <AssignmentIcon />,
    title: 'Application Management',
    description: 'Streamlined workflow for managing student applications',
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
  },
  {
    icon: <SpeedIcon />,
    title: 'Lightning Fast',
    description: 'Optimized performance for seamless user experience',
    color: '#9c27b0',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
  },
  {
    icon: <VerifiedUserIcon />,
    title: 'Trusted Platform',
    description: 'Used by leading educational institutions worldwide',
    color: '#00bcd4',
    gradient: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)'
  },
  {
    icon: <SupportIcon />,
    title: '24/7 Support',
    description: 'Round-the-clock assistance and technical support',
    color: '#e91e63',
    gradient: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)'
  }
];

const stats = [
  { number: '10,000+', label: 'Students Managed', icon: <PeopleIcon /> },
  { number: '98%', label: 'Success Rate', icon: <TrendingUpIcon /> },
  { number: '500+', label: 'Institutions', icon: <SchoolIcon /> },
  { number: '24/7', label: 'Support', icon: <SupportIcon /> }
];

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  useEffect(() => {
    setAnimate(true);
    console.log('Login component mounted');
    console.log('Current user:', user);
    console.log('Current location:', location);
  }, [user, location]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        console.log('Attempting login with:', values.email);
        setError(null);
        setLoginProgress(0);
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setLoginProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);
        
        const user = await login(values.email, values.password);
        console.log('Login successful, user:', user);
        
        setLoginProgress(100);
        clearInterval(progressInterval);
        
        // Show welcome modal briefly before redirect
        setShowWelcomeModal(true);
        
        setTimeout(() => {
          const roleRedirectMap = {
            admin: '/admin/dashboard',
            counselor: '/counselor/dashboard',
            telecaller: '/telecaller/dashboard',
            marketing: '/marketing/dashboard',
            b2b_marketing: '/b2b-marketing/dashboard'
          };
          const redirectPath = roleRedirectMap[user.role] || '/';
          console.log('Redirecting to:', redirectPath);
          navigate(redirectPath);
        }, 1500);
        
      } catch (error) {
        console.error('Login error:', error);
        setLoginProgress(0);
        
        // Handle specific error types
        const errorType = error.response?.data?.errorType;
        const errorMessage = error.response?.data?.message;
        
        if (errorType === 'ACCOUNT_NOT_FOUND') {
          setError('Account not found. Please check your email address or contact your administrator to create an account.');
        } else if (errorType === 'INVALID_PASSWORD') {
          setError('Incorrect password. Please try again.');
        } else if (error.response?.status === 429) {
          setError('Too many login attempts. Please wait a moment before trying again.');
        } else {
          setError(errorMessage || 'Failed to login. Please try again.');
        }
      }
    }
  });

  return (
    <>
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      position: 'relative',
      overflow: 'auto'
    }}>
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${alpha(theme.palette.info.main, 0.05)} 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />
      
      <MarketingNavbar />
      
      <Container maxWidth="xl" sx={{ 
        py: { xs: 2, md: 3 },
        px: { xs: 1, sm: 2, md: 3 },
        position: 'relative',
        zIndex: 1,
        minHeight: 'calc(100vh - 80px)', // Adjust for navbar height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent="center" sx={{ minHeight: '100%' }}>
          {/* Left Side - Features and Information */}
          <Grid item xs={12} lg={7} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Fade in={animate} timeout={1000}>
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                {/* Header Section */}
                <Box sx={{ 
                  mb: { xs: 2, md: 3 }, 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                  backdropFilter: 'blur(15px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative background */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 70%)`,
                      zIndex: 0
                    }}
                  />
                  
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Chip
                      icon={<SchoolIcon sx={{ fontSize: 12 }} />}
                      label="Welcome to AO Counsellor HUB"
                      color="primary"
                      variant="filled"
                      sx={{
                        mb: { xs: 0.5, md: 1 },
                        fontWeight: 500,
                        fontSize: { xs: '0.55rem', md: '0.65rem' },
                        py: { xs: 0.25, md: 0.5 },
                        px: { xs: 0.75, md: 1 },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                        animation: animate ? 'float 3s ease-in-out infinite' : 'none',
                        '@keyframes float': {
                          '0%, 100%': { transform: 'translateY(0px)' },
                          '50%': { transform: 'translateY(-2px)' }
                        }
                      }}
                    />
                    
                    <Typography
                      variant="h1"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem', lg: '3rem' },
                        lineHeight: 1.2,
                        mb: { xs: 1, md: 1.5 },
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Streamline Your
                      <br />
                      <span style={{ 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        Student Applications
                      </span>
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{
                        fontWeight: 400,
                        lineHeight: 1.5,
                        maxWidth: '100%',
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        mb: { xs: 1, md: 2 }
                      }}
                    >
                      The comprehensive CRM platform designed specifically for educational counselors. 
                      Manage applications, track progress, and boost your success rates with powerful analytics.
                    </Typography>
                  </Box>
                </Box>

                {/* Features Grid - Only show on larger screens */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {features.slice(0, 3).map((feature, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Grow in={animate} timeout={1200 + index * 150}>
                          <Card
                            sx={{
                              height: '100%',
                              p: 2,
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                              backdropFilter: 'blur(15px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              borderRadius: 2,
                              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                              '&:hover': {
                                transform: 'translateY(-4px) scale(1.02)',
                                boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.15)}`,
                                '& .feature-icon': {
                                  transform: 'scale(1.1) rotate(5deg)',
                                  background: feature.gradient
                                }
                              }
                            }}
                          >
                            <Box
                              className="feature-icon"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(feature.color, 0.15)} 0%, ${alpha(feature.color, 0.08)} 100%)`,
                                color: feature.color,
                                mb: 1.5,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 4px 15px ${alpha(feature.color, 0.2)}`
                              }}
                            >
                              {React.cloneElement(feature.icon, { sx: { fontSize: 20 } })}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                              {feature.description}
                            </Typography>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Stats Section */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(15px)',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`
                  }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, textAlign: 'center', color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                      Trusted by Industry Leaders
                    </Typography>
                    <Grid container spacing={2}>
                      {stats.map((stat, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <Grow in={animate} timeout={1500 + index * 200}>
                            <Box textAlign="center">
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                                  color: theme.palette.primary.main,
                                  mb: 1,
                                  animation: animate ? `pulse 2s ease-in-out infinite ${index * 0.5}s` : 'none',
                                  '@keyframes pulse': {
                                    '0%, 100%': { transform: 'scale(1)' },
                                    '50%': { transform: 'scale(1.05)' }
                                  }
                                }}
                              >
                                {React.cloneElement(stat.icon, { sx: { fontSize: 16 } })}
                              </Box>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '1.2rem', mb: 0.5 }}>
                                {stat.number}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                                {stat.label}
                              </Typography>
                            </Box>
                          </Grow>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} lg={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Fade in={animate} timeout={1500}>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', px: { xs: 0.25, sm: 0 } }}>
                <Paper
                  elevation={12}
                  sx={{
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: 1.5,
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 320, md: 350 },
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    position: 'relative',
                    overflow: 'visible',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.1)}`
                  }}
                >
                  {/* Floating success indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
                      display: { xs: 'none', sm: 'flex' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: animate ? 'float 3s ease-in-out infinite' : 'none',
                      '@keyframes float': {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                        '50%': { transform: 'translateY(-4px) rotate(2deg)' }
                      },
                      boxShadow: `0 4px 15px ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 12 }} />
                  </Box>

                  {/* Form Header */}
                  <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                    <Zoom in={animate} timeout={1000}>
                      <Avatar
                        sx={{
                          width: { xs: 48, sm: 56 },
                          height: { xs: 48, sm: 56 },
                          mx: 'auto',
                          mb: 1.5,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                          animation: animate ? 'float 3s ease-in-out infinite' : 'none',
                          '@keyframes float': {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-4px)' }
                          }
                        }}
                      >
                        <LoginIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </Avatar>
                    </Zoom>
                    <Slide in={animate} direction="down" timeout={1200}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 0.5, 
                          fontSize: { xs: '1.2rem', sm: '1.4rem' },
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        Welcome Back
                      </Typography>
                    </Slide>
                    <Slide in={animate} direction="up" timeout={1400}>
                      <Typography 
                        variant="h6" 
                        color="text.secondary" 
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.8rem' }, 
                          fontWeight: 400,
                          opacity: 0.8
                        }}
                      >
                        Sign in to access your dashboard
                      </Typography>
                    </Slide>
                  </Box>

                  {/* Error Alert */}
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 1.5,
                        '& .MuiAlert-icon': {
                          alignItems: 'center'
                        },
                        boxShadow: `0 6px 15px ${alpha(theme.palette.error.main, 0.2)}`
                      }}
                      action={
                        error.includes('Account not found') && (
                          <Button 
                            color="inherit" 
                            size="small" 
                            onClick={() => {
                              console.log('Contact administrator clicked');
                            }}
                            sx={{ fontWeight: 600 }}
                          >
                            Contact Admin
                          </Button>
                        )
                      }
                    >
                      {error}
                    </Alert>
                  )}

                  {/* Login Progress */}
                  {formik.isSubmitting && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={loginProgress} 
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                        Signing you in...
                      </Typography>
                    </Box>
                  )}

                  {/* Login Form */}
                  <form onSubmit={formik.handleSubmit}>
                    <Stack spacing={2}>
                      <Slide in={animate} direction="right" timeout={1600}>
                        <TextField
                          fullWidth
                          id="email"
                          name="email"
                          label="Email Address"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.email && Boolean(formik.errors.email)}
                          helperText={formik.touched.email && formik.errors.email}
                          disabled={formik.isSubmitting}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" sx={{ fontSize: 16 }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease',
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      </Slide>

                      <Slide in={animate} direction="left" timeout={1800}>
                        <TextField
                          fullWidth
                          id="password"
                          name="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          value={formik.values.password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.password && Boolean(formik.errors.password)}
                          helperText={formik.touched.password && formik.errors.password}
                          disabled={formik.isSubmitting}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <KeyIcon color="action" sx={{ fontSize: 16 }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                                  <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    size="small"
                                    sx={{ 
                                      color: theme.palette.action.active,
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                      }
                                    }}
                                  >
                                    {showPassword ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1,
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease',
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: 2,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      </Slide>

                      <Zoom in={animate} timeout={2000}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={formik.isSubmitting}
                          endIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            py: 1.2,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                              '&::before': {
                                transform: 'translateX(100%)'
                              }
                            },
                            '&:active': {
                              transform: 'translateY(0px)'
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'transform 0.6s'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {formik.isSubmitting ? 'Signing In...' : 'Sign In to Dashboard'}
                        </Button>
                      </Zoom>
                    </Stack>
                  </form>

                  {/* Divider */}
                  <Divider sx={{ my: 1.5 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.65rem' }}>
                      or
                    </Typography>
                  </Divider>

                  {/* Additional Links */}
                  <Stack spacing={0.75}>
                    <Button
                      component={Link}
                      to="/"
                      variant="outlined"
                      fullWidth
                      startIcon={<HomeIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        py: 0.75,
                        borderRadius: 0.75,
                        textTransform: 'none',
                        fontWeight: 400,
                        fontSize: '0.65rem',
                        borderWidth: 1,
                        '&:hover': {
                          borderWidth: 1,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.12)}`
                        },
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      Back to Home
                    </Button>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.6rem' }}>
                        Need assistance?{' '}
                        <Button
                          component={Link}
                          to="/contact"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            p: 0,
                            minWidth: 'auto',
                            fontSize: '0.6rem',
                            color: theme.palette.primary.main,
                            '&:hover': {
                              background: 'transparent',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Contact Support
                        </Button>
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>

    {/* Welcome Modal */}
    <Modal
      open={showWelcomeModal}
      onClose={() => setShowWelcomeModal(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: {
          backgroundColor: alpha(theme.palette.primary.main, 0.8),
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <Fade in={showWelcomeModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
            p: 4,
            textAlign: 'center'
          }}
        >
          <Zoom in={showWelcomeModal} timeout={800}>
            <Box>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: theme.palette.success.main }}>
                Welcome!
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Login successful. Redirecting to your dashboard...
              </Typography>
              <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
            </Box>
          </Zoom>
        </Box>
      </Fade>
    </Modal>
    
    </>
  );
}

export default Login;