import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  Typography,
  Grid,
  Card,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Stack,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Fade,
  Grow
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Analytics as AnalyticsIcon,
  Cloud as CloudIcon,
  MobileFriendly as MobileIcon,
  Verified as VerifiedIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import HeroSection from '../../components/HeroSection';
import GoToTopButton from '../../components/common/GoToTopButton';
import AnimatedSection from '../../components/common/AnimatedSection';

const stats = [
  { number: '10,000+', label: 'Students Managed', icon: <PeopleIcon />, color: '#2196f3' },
  { number: '98%', label: 'Success Rate', icon: <TrendingUpIcon />, color: '#4caf50' },
  { number: '500+', label: 'Institutions', icon: <AnalyticsIcon />, color: '#ff9800' },
  { number: '24/7', label: 'Support', icon: <SupportIcon />, color: '#9c27b0' }
];

const features = [
  {
    icon: <AnalyticsIcon />,
    title: 'Advanced Analytics',
    description: 'Comprehensive insights and reporting to track student progress and counselor performance.',
    color: '#2196f3',
    gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
  },
  {
    icon: <SecurityIcon />,
    title: 'Secure & Compliant',
    description: 'Enterprise-grade security with GDPR compliance and data protection measures.',
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
  },
  {
    icon: <SpeedIcon />,
    title: 'Lightning Fast',
    description: 'Optimized performance with real-time updates and instant notifications.',
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
  },
  {
    icon: <MobileIcon />,
    title: 'Mobile Responsive',
    description: 'Access your CRM from anywhere with our mobile-optimized interface.',
    color: '#9c27b0',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
  },
  {
    icon: <CloudIcon />,
    title: 'Cloud-Based',
    description: 'No installation required. Access your data securely from any device.',
    color: '#607d8b',
    gradient: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
  },
  {
    icon: <VerifiedIcon />,
    title: 'Trusted Platform',
    description: 'Used by leading educational institutions worldwide.',
    color: '#e91e63',
    gradient: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Senior Counselor',
    company: 'Global Education Services',
    avatar: 'SJ',
    rating: 5,
    text: 'This CRM has revolutionized how we manage student applications. The automation features save us hours every week.',
    color: '#2196f3'
  },
  {
    name: 'Michael Chen',
    role: 'Director of Admissions',
    company: 'International University',
    avatar: 'MC',
    rating: 5,
    text: 'The analytics and reporting capabilities are outstanding. We can now make data-driven decisions with confidence.',
    color: '#4caf50'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Student Advisor',
    company: 'Study Abroad Center',
    avatar: 'ER',
    rating: 5,
    text: 'The user interface is intuitive and the customer support is exceptional. Highly recommended!',
    color: '#ff9800'
  }
];


function Home() {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  const StatsSection = () => (
    <AnimatedSection direction="up" delay={0.2}>
      <Box sx={{ 
        py: { xs: 6, sm: 8, md: 12 }, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        position: 'relative',
        overflow: 'hidden'
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
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={animate} timeout={1000}>
          <Box textAlign="center" sx={{ mb: { xs: 6, sm: 8 } }}>
            <Chip
              icon={<TrendingUpIcon />}
              label="Trusted by Industry Leaders"
              color="primary"
              variant="filled"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                py: { xs: 0.5, sm: 1, md: 1.5 },
                px: { xs: 1.5, sm: 2, md: 3 },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                animation: animate ? 'float 3s ease-in-out infinite' : 'none',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-8px)' }
                }
              }}
            />
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                mb: { xs: 2, sm: 3 }, 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Trusted by Leading Institutions
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 6, sm: 8 }, 
                maxWidth: { xs: '100%', sm: 600, md: 700 }, 
                mx: 'auto',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                px: { xs: 2, sm: 0 }
              }}
            >
              Join hundreds of educational consultants who have transformed their practice with our platform
            </Typography>
          </Box>
        </Fade>
        
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <AnimatedSection direction="scale" delay={0.3 + index * 0.1}>
                <Grow in={animate} timeout={1200 + index * 200}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 50, sm: 60, md: 70, lg: 90 },
                      height: { xs: 50, sm: 60, md: 70, lg: 90 },
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(stat.color, 0.15)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                      color: stat.color,
                      mb: { xs: 2, sm: 3 },
                      boxShadow: `0 8px 25px ${alpha(stat.color, 0.3)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      '&:hover': {
                        transform: 'scale(1.15) rotate(5deg)',
                        boxShadow: `0 15px 35px ${alpha(stat.color, 0.4)}`,
                        '& .stat-icon': {
                          transform: 'scale(1.2)'
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.7)})`,
                        zIndex: -1,
                        opacity: 0,
                        transition: 'opacity 0.4s ease-in-out'
                      },
                      '&:hover::before': {
                        opacity: 1
                      }
                    }}
                  >
                    <Box 
                      className="stat-icon"
                      sx={{ 
                        transition: 'transform 0.4s ease-in-out',
                        fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem', lg: '2.5rem' }
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 900, 
                      mb: { xs: 1, sm: 2 }, 
                      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem', lg: '3.5rem' },
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.7)} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: animate ? `pulse 2s ease-in-out infinite ${index * 0.5}s` : 'none',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' }
                      }
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem', lg: '1.1rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
                </Grow>
              </AnimatedSection>
            </Grid>
          ))}
        </Grid>
      </Container>
      </Box>
    </AnimatedSection>
  );

  const FeaturesSection = () => (
    <AnimatedSection direction="up" delay={0.4}>
      <Box sx={{ py: { xs: 6, sm: 8, md: 12 } }}>
        <Container maxWidth="lg">
        <Fade in={animate} timeout={1000}>
          <Box textAlign="center" sx={{ mb: { xs: 6, sm: 8 } }}>
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Advanced Features"
              color="primary"
              variant="filled"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                py: { xs: 0.5, sm: 1, md: 1.5 },
                px: { xs: 1.5, sm: 2, md: 3 },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                animation: animate ? 'float 3s ease-in-out infinite' : 'none',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-8px)' }
                }
              }}
            />
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 900, 
                mb: { xs: 2, sm: 3 }, 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Powerful Features for Modern Education
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: { xs: '100%', sm: 600, md: 700 }, 
                mx: 'auto', 
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                lineHeight: 1.6,
                px: { xs: 2, sm: 0 }
              }}
            >
              Everything you need to streamline your student application process and boost your success rates with cutting-edge technology.
            </Typography>
          </Box>
        </Fade>
        
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={index}>
              <AnimatedSection direction="up" delay={0.5 + index * 0.1}>
                <Grow in={animate} timeout={1200 + index * 150}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    p: { xs: 2.5, sm: 3, md: 4 },
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: { xs: 2, sm: 3 },
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                      backgroundColor: alpha(feature.color, 0.02),
                      borderColor: alpha(feature.color, 0.3),
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
                      width: { xs: 50, sm: 60, md: 70 },
                      height: { xs: 50, sm: 60, md: 70 },
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha(feature.color, 0.15)} 0%, ${alpha(feature.color, 0.05)} 100%)`,
                      color: feature.color,
                      mb: { xs: 2, sm: 3 },
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 8px 20px ${alpha(feature.color, 0.3)}`,
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: { xs: 1.5, sm: 2 }, 
                      fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.4rem' },
                      color: theme.palette.text.primary
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      lineHeight: 1.7, 
                      fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Card>
                </Grow>
              </AnimatedSection>
            </Grid>
          ))}
        </Grid>
        </Container>
      </Box>
    </AnimatedSection>
  );

  const TestimonialsSection = () => (
    <AnimatedSection direction="up" delay={0.6}>
      <Box sx={{ 
        py: 8, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[100], 0.5)} 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`
      }}>
        <Container maxWidth="lg">
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            What Our Clients Say
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Join thousands of satisfied counselors and institutions worldwide.
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ 
                height: '100%', 
                p: 4,
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', mr: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} sx={{ color: '#ffc107', fontSize: 20 }} />
                    ))}
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: alpha(testimonial.color, 0.1),
                      color: testimonial.color,
                      mr: 2
                    }}
                  >
                    {testimonial.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role} at {testimonial.company}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
        </Container>
      </Box>
    </AnimatedSection>
  );

  const PricingSection = () => (
    <Box sx={{ py: 8 }}>
      {/* <Container maxWidth="lg">
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Flexible pricing options to grow with your business.
          </Typography>
        </Box>
        <Grid container spacing={4} justifyContent="center">
          {pricingPlans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Grow in={true} timeout={600 + index * 200}>
                <Card 
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    border: plan.popular ? `2px solid ${plan.color}` : '1px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12]
                    }
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {plan.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 2 }}>
                      <Typography variant="h2" sx={{ fontWeight: 800 }}>
                        {plan.price}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {plan.period}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      {plan.description}
                    </Typography>
                    <List sx={{ mb: 4 }}>
                      {plan.features.map((feature, featureIndex) => (
                        <ListItem key={featureIndex} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ color: plan.color }} />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      size="large"
                      fullWidth
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2
                      }}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </Container> */}
    </Box>
  );

  const WorkflowSection = () => (
    <AnimatedSection direction="up" delay={0.8}>
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Chip
            icon={<TrendingUpIcon />}
            label="Streamlined Process"
            color="primary"
            variant="filled"
            sx={{
              mb: 3,
              fontWeight: 600,
              fontSize: '1rem',
              py: 1,
              px: 2
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '2rem', md: '3rem' } }}>
            How It Works
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Our 8-phase application tracking system ensures no student falls through the cracks
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {[
            { phase: '1', title: 'Document Collection', description: 'Upload and organize all required documents in one secure location', icon: <AssignmentIcon /> },
            { phase: '2', title: 'Application Review', description: 'Review and validate all application materials before submission', icon: <VerifiedIcon /> },
            { phase: '3', title: 'University Submission', description: 'Submit applications to universities with tracking confirmation', icon: <AssignmentIcon /> },
            { phase: '4', title: 'Status Monitoring', description: 'Track application status and receive real-time updates', icon: <AnalyticsIcon /> },
            { phase: '5', title: 'Interview Preparation', description: 'Prepare students for interviews with comprehensive resources', icon: <PeopleIcon /> },
            { phase: '6', title: 'Offer Management', description: 'Manage and track all university offers and responses', icon: <CheckCircleIcon /> },
            { phase: '7', title: 'Visa Application', description: 'Guide students through the visa application process', icon: <SecurityIcon /> },
            { phase: '8', title: 'Pre-Departure', description: 'Final preparations and departure coordination', icon: <TrendingUpIcon /> }
          ].map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <AnimatedSection direction="up" delay={0.9 + index * 0.1}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  textAlign: 'center',
                  transition: 'all 0.3s ease-in-out',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor: alpha(theme.palette.primary.main, 0.3)
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    mb: 3,
                    position: 'relative'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {step.phase}
                  </Typography>
                  {step.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </Card>
              </AnimatedSection>
            </Grid>
          ))}
        </Grid>
        </Container>
      </Box>
    </AnimatedSection>
  );

  const CTASection = () => (
    <AnimatedSection direction="scale" delay={1.0}>
      <Box sx={{ 
        py: { xs: 6, sm: 8, md: 12 }, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha('#fff', 0.1)} 0%, ${alpha('#fff', 0.05)} 100%)`,
          opacity: 0.6
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha('#fff', 0.08)} 0%, ${alpha('#fff', 0.03)} 100%)`,
          opacity: 0.4
        }}
      />
      
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Box>
          <Chip
            icon={<StarIcon />}
            label="Join the Revolution"
            sx={{
              mb: { xs: 2, sm: 3 },
              fontWeight: 600,
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              py: { xs: 0.5, sm: 1 },
              px: { xs: 1.5, sm: 2 },
              backgroundColor: alpha('#fff', 0.2),
              color: 'white',
              border: `1px solid ${alpha('#fff', 0.3)}`
            }}
          />
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              mb: { xs: 2, sm: 3 }, 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem' } 
            }}
          >
            Ready to Transform Your Application Process?
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: { xs: 4, sm: 6 }, 
              opacity: 0.9, 
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }, 
              lineHeight: 1.6 
            }}
          >
            Join thousands of counselors who have already streamlined their workflow and increased their success rates with our powerful CRM platform.
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }} 
            justifyContent="center" 
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 600,
                px: { xs: 3, sm: 4 },
                py: { xs: 1.2, sm: 1.5 },
                textTransform: 'none',
                borderRadius: 2,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.9),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/contact"
              sx={{
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                px: { xs: 3, sm: 4 },
                py: { xs: 1.2, sm: 1.5 },
                textTransform: 'none',
                borderRadius: 2,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: alpha('#fff', 0.1),
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Schedule Demo
            </Button>
          </Stack>
          
          {/* Trust indicators */}
          <Box sx={{ 
            mt: { xs: 6, sm: 8 }, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: { xs: 2, sm: 3, md: 4 },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
              <CheckCircleIcon sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                No credit card required
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
              <CheckCircleIcon sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                14-day free trial
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
              <CheckCircleIcon sx={{ mr: 1, fontSize: { xs: 16, sm: 20 } }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Cancel anytime
              </Typography>
            </Box>
          </Box>
        </Box>
        </Container>
      </Box>
    </AnimatedSection>
  );

  const Footer = () => (
    <AnimatedSection direction="up" delay={1.2}>
      <Box sx={{ 
        py: 6, 
        backgroundColor: theme.palette.grey[900],
        color: 'white'
      }}>
        <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Counsellor CRM
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
              The leading platform for educational counselors to manage student applications, 
              track progress, and achieve higher success rates.
            </Typography>
            <Stack direction="row" spacing={2}>
              <IconButton sx={{ color: 'white' }}>
                <LinkedInIcon />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <FacebookIcon />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <YouTubeIcon />
              </IconButton>
            </Stack>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Product
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Features" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Pricing" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="API" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Support
            </Typography>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Help Center" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Contact Us" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
              <ListItem sx={{ p: 0, mb: 1 }}>
                <ListItemText primary="Status" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', opacity: 0.8 } }} />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Contact Info
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 2, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  study@academicoverseas.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 2, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  +91 8142643333
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 2, opacity: 0.8 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  NCK Plaza SBI Bank building, Vijayawada.
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: alpha('#fff', 0.2) }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © 2024 Counsellor CRM. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Privacy Policy
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Terms of Service
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Cookie Policy
            </Typography>
          </Stack>
        </Box>
        </Container>
      </Box>
    </AnimatedSection>
  );

  return (
    <Box>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <WorkflowSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
      <GoToTopButton />
    </Box>
  );
}

export default Home;