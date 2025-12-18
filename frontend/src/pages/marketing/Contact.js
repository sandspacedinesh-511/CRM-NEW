// src/pages/marketing/Contact.js
import { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card,
  CardContent,
  useTheme,
  alpha,
  Chip,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Stack,
  IconButton
} from '@mui/material';
import { 
  Email, 
  Phone, 
  LocationOn, 
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Support as SupportIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name should be at least 2 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  subject: yup
    .string()
    .min(5, 'Subject should be at least 5 characters')
    .required('Subject is required'),
  message: yup
    .string()
    .min(10, 'Message should be at least 10 characters')
    .required('Message is required')
});

const contactInfo = [
  {
    icon: <LocationOn />,
    title: 'Our Office',
    details: [
      '123 Education Street, Suite 456',
      'Boston, MA 02108, USA'
    ],
    color: '#2196f3'
  },
  {
    icon: <Email />,
    title: 'Email Us',
    details: [
      'info@aohub.com',
      'support@aocouncellor.com'
    ],
    color: '#4caf50'
  },
  {
    icon: <Phone />,
    title: 'Call Us',
    details: [
      '+91 9874563210',
      'Mon-Sun, 9am-5pm IST'
    ],
    color: '#ff9800'
  }
];

const faqs = [
  {
    question: "How quickly do you respond to inquiries?",
    answer: "We typically respond to all inquiries within 24 hours during business days."
  },
  {
    question: "Do you offer free consultations?",
    answer: "Yes, we offer a free 30-minute consultation to discuss your specific needs."
  },
  {
    question: "What are your business hours?",
    answer: "We're available Monday through Sunday, 9 AM to 5 PM IST."
  },
  {
    question: "Do you provide technical support?",
    answer: "Yes, we offer comprehensive technical support for all our platform users."
  }
];

function Contact() {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        // Simulate form submission
        console.log('Form submitted:', values);
        setSnackbar({
          open: true,
          message: 'Thank you for your message! We\'ll get back to you soon.',
          severity: 'success'
        });
        formik.resetForm();
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Something went wrong. Please try again.',
          severity: 'error'
        });
      }
    }
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
                icon={<SupportIcon />}
                label="Get in Touch"
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
                Contact Us
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
                We'd love to hear from you. Get in touch with our team for any questions, support, or partnership opportunities.
              </Typography>
            </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Contact Information Cards */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Get in Touch
          </Typography>
          <Grid container spacing={4}>
            {contactInfo.map((info, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12],
                      borderColor: alpha(info.color, 0.3)
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: alpha(info.color, 0.1),
                      color: info.color,
                      mb: 3,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        backgroundColor: alpha(info.color, 0.2)
                      }
                    }}
                  >
                    {info.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {info.title}
                  </Typography>
                  {info.details.map((detail, detailIndex) => (
                    <Typography 
                      key={detailIndex} 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: detailIndex === 0 ? 1 : 0 }}
                    >
                      {detail}
                    </Typography>
                  ))}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Contact Form and Additional Info */}
        <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} lg={8}>
              <Card
                elevation={3}
                sx={{
                  p: { xs: 3, md: 6 },
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                  Send us a Message
                </Typography>
                <Box component="form" onSubmit={formik.handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="name"
                        name="name"
                        label="Your Name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.name && Boolean(formik.errors.name)}
                        helperText={formik.touched.name && formik.errors.name}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="email"
                        name="email"
                        label="Email Address"
                        type="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="subject"
                        name="subject"
                        label="Subject"
                        value={formik.values.subject}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.subject && Boolean(formik.errors.subject)}
                        helperText={formik.touched.subject && formik.errors.subject}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="message"
                        name="message"
                        label="Message"
                        multiline
                        rows={6}
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.message && Boolean(formik.errors.message)}
                        helperText={formik.touched.message && formik.errors.message}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: theme.palette.primary.main
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={formik.isSubmitting}
                        endIcon={formik.isSubmitting ? <CheckCircleIcon /> : <SendIcon />}
                        sx={{
                          py: 1.5,
                          px: 4,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
                          },
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        {formik.isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={4}>
                {/* Business Hours */}
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ color: theme.palette.success.main, mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Business Hours
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Monday - Friday: 9:00 AM - 6:00 PM IST
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Saturday: 10:00 AM - 4:00 PM IST
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sunday: Closed
                  </Typography>
                </Card>

                {/* FAQ Section */}
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Frequently Asked Questions
                  </Typography>
                  <Stack spacing={2}>
                    {faqs.map((faq, index) => (
                      <Box key={index}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {faq.question}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {faq.answer}
                        </Typography>
                        {index < faqs.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </Stack>
                </Card>

                {/* Social Media */}
                <Card sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Follow Us
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <IconButton
                      sx={{
                        backgroundColor: alpha('#0077b5', 0.1),
                        color: '#0077b5',
                        '&:hover': {
                          backgroundColor: alpha('#0077b5', 0.2)
                        }
                      }}
                    >
                      <LinkedInIcon />
                    </IconButton>
                    <IconButton
                      sx={{
                        backgroundColor: alpha('#1da1f2', 0.1),
                        color: '#1da1f2',
                        '&:hover': {
                          backgroundColor: alpha('#1da1f2', 0.2)
                        }
                      }}
                    >
                      <TwitterIcon />
                    </IconButton>
                    <IconButton
                      sx={{
                        backgroundColor: alpha('#4267b2', 0.1),
                        color: '#4267b2',
                        '&:hover': {
                          backgroundColor: alpha('#4267b2', 0.2)
                        }
                      }}
                    >
                      <FacebookIcon />
                    </IconButton>
                    <IconButton
                      sx={{
                        backgroundColor: alpha('#ff0000', 0.1),
                        color: '#ff0000',
                        '&:hover': {
                          backgroundColor: alpha('#ff0000', 0.2)
                        }
                      }}
                    >
                      <YouTubeIcon />
                    </IconButton>
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>

        {/* CTA Section */}
        <Box sx={{ 
          mt: 12, 
          py: 8, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join hundreds of educational consultants who have transformed their practice with our platform.
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            Start Free Trial
          </Button>
        </Box>
      </Container>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Contact;