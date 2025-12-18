import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  Button, 
  IconButton, 
  Divider,
  useTheme,
  alpha,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Facebook, 
  Twitter, 
  LinkedIn, 
  Email, 
  Phone, 
  LocationOn, 
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  Instagram,
  YouTube,
  WhatsApp
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

function Footer() {
  const theme = useTheme();

  const footerLinks = {
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Our Mission', path: '/mission' },
      { label: 'Team', path: '/team' },
      { label: 'Careers', path: '/careers' }
    ],
    services: [
      { label: 'Student Management', path: '/services/student-management' },
      { label: 'Application Tracking', path: '/services/tracking' },
      { label: 'Analytics Dashboard', path: '/services/analytics' },
      { label: 'Support', path: '/support' }
    ],
    resources: [
      { label: 'Help Center', path: '/help' },
      { label: 'Documentation', path: '/docs' },
      { label: 'API Reference', path: '/api' },
      { label: 'Blog', path: '/blog' }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'GDPR', path: '/gdpr' }
    ]
  };

  const socialLinks = [
    { icon: <Facebook />, href: '#', label: 'Facebook' },
    { icon: <Twitter />, href: '#', label: 'Twitter' },
    { icon: <LinkedIn />, href: '#', label: 'LinkedIn' },
    { icon: <Instagram />, href: '#', label: 'Instagram' },
    { icon: <YouTube />, href: '#', label: 'YouTube' },
    { icon: <WhatsApp />, href: '#', label: 'WhatsApp' }
  ];

  return (
    <Box 
      component="footer" 
      sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Content */}
        <Box sx={{ py: { xs: 4, md: 6 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* Company Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar
                    src="/ao-logo.png"
                    alt="AO Counsellor HUB"
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'transparent',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1.1
                      }}
                    >
                      AO Counsellor HUB
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      Student Management Platform
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6, color: theme.palette.text.secondary }}>
                  Empowering educational counselors with comprehensive CRM solutions. 
                  Streamline your student applications, track progress, and boost success rates 
                  with our powerful analytics and management tools.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      color: theme.palette.text.secondary,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {footerLinks.services.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      color: theme.palette.text.secondary,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {footerLinks.resources.map((link) => (
                  <Link
                    key={link.label}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      color: theme.palette.text.secondary,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Grid>

            {/* Contact Info */}
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
                Contact
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    info@aocounsellor.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    +91 9874563210
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Mumbai, India
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.2) }} />

        {/* Bottom Section */}
        <Box sx={{ py: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  © {new Date().getFullYear()} AO Counsellor HUB. All rights reserved.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {footerLinks.legal.map((link) => (
                    <Link
                      key={link.label}
                      component={RouterLink}
                      to={link.path}
                      sx={{
                        color: theme.palette.text.secondary,
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        '&:hover': {
                          color: theme.palette.primary.main
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                {socialLinks.map((social) => (
                  <IconButton
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: theme.palette.text.secondary,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      width: 36,
                      height: 36,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      }
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;