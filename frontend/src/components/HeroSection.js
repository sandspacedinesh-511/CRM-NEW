import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Fade,
  Grow,
  Stack,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const features = [
  { icon: <PeopleIcon />, text: 'Student Management', color: '#2196f3' },
  { icon: <AssignmentIcon />, text: 'Application Tracking', color: '#4caf50' },
  { icon: <SecurityIcon />, text: 'Secure & Compliant', color: '#ff9800' }
  // { icon: <SpeedIcon />, text: 'Lightning Fast', color: '#9c27b0' }
];

const stats = [
  { number: '500+', label: 'Students Enrolled' },
  { number: '95%', label: 'Success Rate' },
  { number: '24/7', label: 'Support Available' }
];

function HeroSection() {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <Box
      sx={{
        minHeight: { xs: 'auto', sm: '100vh' },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {/* Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '5%', sm: '10%' },
          right: { xs: '5%', sm: '10%' },
          width: { xs: 150, sm: 200, md: 300 },
          height: { xs: 150, sm: 200, md: 300 },
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          animation: animate ? 'float 6s ease-in-out infinite' : 'none',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: '10%', sm: '20%' },
          left: { xs: '2%', sm: '5%' },
          width: { xs: 100, sm: 150, md: 200 },
          height: { xs: 100, sm: 150, md: 200 },
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
          animation: animate ? 'float 8s ease-in-out infinite reverse' : 'none'
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} lg={6}>
            <Fade in={animate} timeout={1000}>
              <Box>
                {/* Badge */}
                <Chip
                  icon={<StarIcon />}
                  label="Trusted by 500+ Institutions"
                  color="primary"
                  variant="filled"
                  sx={{
                    mb: { xs: 2, sm: 3 },
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    py: { xs: 0.5, sm: 1 },
                    px: { xs: 1.5, sm: 2 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                />

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: { xs: 1.3, sm: 1.2 },
                    mb: { xs: 2, sm: 3 },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Streamline Your
                  <br />
                  <span style={{ color: theme.palette.text.primary }}>
                    Student Applications
                  </span>
                </Typography>

                {/* Subtitle */}
                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{
                    mb: { xs: 3, sm: 4 },
                    fontWeight: 400,
                    lineHeight: 1.6,
                    maxWidth: { xs: '100%', sm: 500 },
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                  }}
                >
                  The comprehensive CRM platform designed specifically for educational counselors. 
                  Manage applications, track progress, and boost your success rates with powerful analytics.
                </Typography>

                {/* CTA Buttons */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 2, sm: 3 }} 
                  sx={{ mb: { xs: 4, sm: 6 } }}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 3, sm: 4 },
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 3, sm: 4 },
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>

                {/* Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, sm: 3, md: 4 }, 
                  mb: { xs: 3, sm: 4 },
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'space-between', sm: 'flex-start' }
                }}>
                  {stats.map((stat, index) => (
                    <Grow in={animate} timeout={1200 + index * 200} key={index}>
                      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 800, 
                            color: theme.palette.primary.main,
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                          }}
                        >
                          {stat.number}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grow>
                  ))}
                </Box>

                {/* Feature Pills */}
                <Stack 
                  direction="row" 
                  spacing={{ xs: 1, sm: 2 }} 
                  flexWrap="wrap"
                  sx={{ gap: { xs: 1, sm: 2 } }}
                >
                  {features.map((feature, index) => (
                    <Grow in={animate} timeout={1400 + index * 100} key={index}>
                      <Chip
                        icon={feature.icon}
                        label={feature.text}
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          borderColor: alpha(feature.color, 0.3),
                          color: feature.color,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          height: { xs: 28, sm: 32 },
                          '&:hover': {
                            backgroundColor: alpha(feature.color, 0.1)
                          }
                        }}
                      />
                    </Grow>
                  ))}
                </Stack>
              </Box>
            </Fade>
          </Grid>

          {/* Right Content - Dashboard Preview */}
          <Grid item xs={12} lg={6}>
            <Fade in={animate} timeout={1500}>
              <Box sx={{ position: 'relative', mt: { xs: 4, lg: 0 } }}>
                {/* Main Dashboard Card */}
                <Card
                  sx={{
                    borderRadius: { xs: 2, sm: 3, md: 4 },
                    boxShadow: { xs: theme.shadows[8], sm: theme.shadows[12], md: theme.shadows[20] },
                    overflow: 'visible',
                    position: 'relative',
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  {/* Card Header */}
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                      <Box
                        component="img"
                        src="/ao-logo.png"
                        alt="AO Counsellor HUB Logo"
                        sx={{
                          width: { xs: 32, sm: 40 },
                          height: { xs: 32, sm: 40 },
                          borderRadius: 1,
                          objectFit: 'contain'
                        }}
                      />
                      <Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          Counsellor Dashboard
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Real-time overview of your applications
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Stats Grid */}
                    <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 800, 
                              color: theme.palette.primary.main,
                              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                            }}
                          >
                            127
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Active Students
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 800, 
                              color: theme.palette.success.main,
                              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                            }}
                          >
                            89
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Applications
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 800, 
                              color: theme.palette.warning.main,
                              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                            }}
                          >
                            23
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Pending Docs
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              fontWeight: 800, 
                              color: theme.palette.error.main,
                              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                            }}
                          >
                            94%
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Success Rate
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Progress Bars */}
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: { xs: 1.5, sm: 2 },
                          fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                      >
                        Application Progress
                      </Typography>
                      <Stack spacing={{ xs: 1.5, sm: 2 }}>
                        {[
                          { label: 'Document Collection', progress: 85, color: theme.palette.primary.main },
                          { label: 'Application Review', progress: 72, color: theme.palette.success.main },
                          { label: 'University Selection', progress: 68, color: theme.palette.warning.main }
                        ].map((item, index) => (
                          <Box key={index}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                              >
                                {item.label}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {item.progress}%
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: '100%',
                                height: { xs: 6, sm: 8 },
                                backgroundColor: alpha(item.color, 0.2),
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${item.progress}%`,
                                  height: '100%',
                                  backgroundColor: item.color,
                                  borderRadius: 4,
                                  transition: 'width 1s ease-in-out'
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    {/* Recent Activity */}
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: { xs: 1.5, sm: 2 },
                          fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                      >
                        Recent Activity
                      </Typography>
                      <Stack spacing={{ xs: 1, sm: 1.5 }}>
                        {[
                          { text: 'Sarah Johnson uploaded passport', time: '2 min ago', color: theme.palette.primary.main },
                          { text: 'Application submitted to Oxford', time: '15 min ago', color: theme.palette.success.main },
                          { text: 'Document approved by admin', time: '1 hour ago', color: theme.palette.warning.main }
                        ].map((activity, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                            <Box
                              sx={{
                                width: { xs: 6, sm: 8 },
                                height: { xs: 6, sm: 8 },
                                borderRadius: '50%',
                                backgroundColor: activity.color,
                                flexShrink: 0
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                flex: 1,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}
                            >
                              {activity.text}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                flexShrink: 0
                              }}
                            >
                              {activity.time}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                {/* Floating Elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: -10, sm: -15, md: -20 },
                    right: { xs: -10, sm: -15, md: -20 },
                    width: { xs: 50, sm: 60, md: 80 },
                    height: { xs: 50, sm: 60, md: 80 },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: animate ? 'pulse 2s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' }
                    }
                  }}
                >
                  <CheckCircleIcon sx={{ 
                    color: theme.palette.success.main, 
                    fontSize: { xs: 20, sm: 24, md: 32 } 
                  }} />
                </Box>

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: -15, sm: -20, md: -30 },
                    left: { xs: -15, sm: -20, md: -30 },
                    width: { xs: 60, sm: 80, md: 100 },
                    height: { xs: 60, sm: 80, md: 100 },
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.2)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: animate ? 'float 4s ease-in-out infinite' : 'none'
                  }}
                >
                  <TrendingUpIcon sx={{ 
                    color: theme.palette.warning.main, 
                    fontSize: { xs: 24, sm: 32, md: 40 } 
                  }} />
                </Box>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default HeroSection;