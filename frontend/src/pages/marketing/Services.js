// src/pages/marketing/Services.js
import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Stack,
  Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Cloud as CloudIcon,
  MobileFriendly as MobileIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: <AssignmentIcon />,
    title: "Application Phase Tracking",
    description: "Our system breaks down the complex application process into 8 clear phases, from document collection to visa approval, giving you complete visibility into each student's journey.",
    features: [
      "8-phase application tracking system",
      "Real-time status updates",
      "Automated deadline reminders",
      "Progress visualization",
      "Phase-specific task management"
    ],
    color: '#2196f3',
    price: "Included in all plans"
  },
  {
    icon: <SecurityIcon />,
    title: "Document Management",
    description: "Securely upload, store, and organize all student documents in one centralized location with version control and easy retrieval.",
    features: [
      "Secure cloud storage",
      "Version control system",
      "Document categorization",
      "Easy search and retrieval",
      "Access control and permissions"
    ],
    color: '#4caf50',
    price: "Included in all plans"
  },
  {
    icon: <AnalyticsIcon />,
    title: "Counselor Performance Analytics",
    description: "Track key metrics like application completion rates, time-per-phase, and success rates to optimize your team's performance.",
    features: [
      "Performance dashboards",
      "Success rate tracking",
      "Time analysis per phase",
      "Team productivity metrics",
      "Custom report generation"
    ],
    color: '#ff9800',
    price: "Professional & Enterprise"
  },
  {
    icon: <TrendingUpIcon />,
    title: "Deferral & Rejection Management",
    description: "Easily flag deferred applications for the next intake and analyze rejection reasons to improve future outcomes.",
    features: [
      "Deferral tracking system",
      "Rejection reason analysis",
      "Next intake planning",
      "Success rate improvement",
      "Historical data insights"
    ],
    color: '#9c27b0',
    price: "Professional & Enterprise"
  },
  {
    icon: <BusinessIcon />,
    title: "Custom Reporting",
    description: "Generate tailored reports for university partners, students, or internal reviews with just a few clicks.",
    features: [
      "Custom report builder",
      "University partner reports",
      "Student progress reports",
      "Internal analytics",
      "Export to multiple formats"
    ],
    color: '#607d8b',
    price: "Professional & Enterprise"
  },
  {
    icon: <SupportIcon />,
    title: "24/7 Support & Training",
    description: "Comprehensive support and training to ensure your team gets the most out of our platform.",
    features: [
      "24/7 technical support",
      "Onboarding training",
      "Regular webinars",
      "Knowledge base access",
      "Dedicated account manager"
    ],
    color: '#e91e63',
    price: "Enterprise only"
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small counseling centers',
    features: [
      'Up to 50 students',
      'Basic analytics',
      'Email support',
      'Document management',
      'Mobile access',
      'Application tracking'
    ],
    popular: false,
    color: '#2196f3',
    buttonText: 'Get Started',
    buttonVariant: 'outlined'
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/month',
    description: 'Ideal for growing organizations',
    features: [
      'Up to 200 students',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'API access',
      'White-label options',
      'Performance tracking',
      'Custom reporting'
    ],
    popular: true,
    color: '#4caf50',
    buttonText: 'Start Free Trial',
    buttonVariant: 'contained'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large institutions',
    features: [
      'Unlimited students',
      'Custom development',
      'Dedicated support',
      'On-premise option',
      'Advanced security',
      'SLA guarantee',
      '24/7 phone support',
      'Custom training'
    ],
    popular: false,
    color: '#9c27b0',
    buttonText: 'Contact Sales',
    buttonVariant: 'outlined'
  }
];

const benefits = [
  {
    icon: <SpeedIcon />,
    title: 'Increased Efficiency',
    description: 'Reduce administrative time by 60% with automated workflows and streamlined processes.',
    color: '#2196f3'
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Higher Success Rates',
    description: 'Improve application success rates by 25% with data-driven insights and better tracking.',
    color: '#4caf50'
  },
  {
    icon: <PeopleIcon />,
    title: 'Better Student Experience',
    description: 'Provide transparent communication and real-time updates to enhance student satisfaction.',
    color: '#ff9800'
  },
  {
    icon: <SecurityIcon />,
    title: 'Enhanced Security',
    description: 'Enterprise-grade security with GDPR compliance and data protection measures.',
    color: '#9c27b0'
  }
];

function Services() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box sx={{ 
        py: { xs: 6, md: 12 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderRadius: { xs: 0, md: 4 },
        mx: { xs: 0, md: 2 },
        my: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="lg">
          <Box textAlign="center" sx={{ mb: 8 }}>
            <Chip
              icon={<VerifiedIcon />}
              label="Comprehensive Solutions"
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
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Our Services
            </Typography>
            <Typography 
              variant="h5" 
              color="text.secondary"
              sx={{ 
                maxWidth: 800, 
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.25rem' }
              }}
            >
              Comprehensive tools designed specifically for educational consultants to streamline their operations and boost success rates
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Services Grid */}
        <Box sx={{ mb: 12 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Core Services
          </Typography>
          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12],
                      backgroundColor: alpha(service.color, 0.02)
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        backgroundColor: alpha(service.color, 0.1),
                        color: service.color,
                        mb: 3
                      }}
                    >
                      {service.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      {service.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {service.description}
                    </Typography>
                    <List dense sx={{ mb: 3 }}>
                      {service.features.map((feature, featureIndex) => (
                        <ListItem key={featureIndex} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ color: service.color, fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              sx: { fontWeight: 500 }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Chip
                      label={service.price}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ mb: 12 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Why Choose Our Services?
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: alpha(benefit.color, 0.1),
                      color: benefit.color,
                      mb: 3,
                      boxShadow: `0 4px 12px ${alpha(benefit.color, 0.2)}`
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {benefit.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pricing Section */}
        <Box sx={{ mb: 12, pt: 4 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Choose Your Plan
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box sx={{ position: 'relative', mt: plan.popular ? 2 : 0 }}>
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      overflow: 'visible',
                      transition: 'all 0.3s ease-in-out',
                      border: plan.popular ? `2px solid ${plan.color}` : 'none',
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
                          top: -16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontWeight: 600,
                          zIndex: 2,
                          boxShadow: theme.shadows[4]
                        }}
                      />
                    )}
                  <CardContent sx={{ p: 4, pt: plan.popular ? 6 : 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: plan.color }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                      {plan.price}
                      <span style={{ fontSize: '1rem', fontWeight: 400, color: theme.palette.text.secondary }}>
                        {plan.period}
                      </span>
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      {plan.description}
                    </Typography>
                    <List dense sx={{ mb: 4 }}>
                      {plan.features.map((feature, featureIndex) => (
                        <ListItem key={featureIndex} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ color: plan.color, fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={feature} 
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              sx: { fontWeight: 500 }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant={plan.buttonVariant}
                      fullWidth
                      size="large"
                      component={Link}
                      to={plan.name === 'Enterprise' ? '/contact' : '/login'}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        backgroundColor: plan.popular ? plan.color : 'transparent',
                        '&:hover': {
                          backgroundColor: plan.popular ? alpha(plan.color, 0.8) : alpha(plan.color, 0.1)
                        }
                      }}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Frequently Asked Questions
          </Typography>
          <Paper elevation={2} sx={{ borderRadius: 3 }}>
            {[
              {
                question: "How does the application tracking system work?",
                answer: "Our system divides the application process into 8 distinct phases, from initial document collection to final visa approval. Each phase has specific tasks and deadlines that are automatically tracked and updated in real-time."
              },
              {
                question: "Is my data secure?",
                answer: "Absolutely. We use enterprise-grade security measures including end-to-end encryption, GDPR compliance, and regular security audits. Your data is stored securely in the cloud with multiple backup systems."
              },
              {
                question: "Can I customize the platform for my specific needs?",
                answer: "Yes! Professional and Enterprise plans include customization options, API access, and white-label solutions. We can tailor the platform to match your specific workflows and branding requirements."
              },
              {
                question: "What kind of support do you provide?",
                answer: "We offer comprehensive support including 24/7 technical assistance, onboarding training, regular webinars, and a detailed knowledge base. Enterprise customers also get a dedicated account manager."
              },
              {
                question: "How quickly can I get started?",
                answer: "You can start using our platform immediately after signing up. We provide quick setup guides and onboarding support to get you up and running within hours, not days."
              }
            ].map((faq, index) => (
              <Accordion key={index} sx={{ 
                '&:first-of-type': { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
                '&:last-of-type': { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Box>

        {/* CTA Section */}
        <Box sx={{ 
          py: 8, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Transform Your Counseling Practice?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join hundreds of educational consultants who have already improved their efficiency and success rates with our platform.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/login"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600
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
                py: 1.5,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              Contact Sales
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Services;