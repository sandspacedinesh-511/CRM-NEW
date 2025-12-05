import { 
  Container, 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  useTheme,
  alpha,
  Paper,
  Divider,
  Stack
} from '@mui/material';

import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Lightbulb as LightbulbIcon,
  EmojiEvents as TrophyIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Support as SupportIcon,
  Verified as VerifiedIcon,
  Star as StarIcon
} from '@mui/icons-material';
import TeamSection from '../../components/marketing/TeamSection';

const values = [
  {
    icon: <SecurityIcon />,
    title: 'Trust & Security',
    description: 'We prioritize data security and build trust through transparent practices and robust protection measures.',
    color: '#2196f3'
  },
  {
    icon: <PeopleIcon />,
    title: 'Student Success',
    description: 'Every feature is designed with student outcomes in mind, ensuring better educational opportunities.',
    color: '#4caf50'
  },
  {
    icon: <LightbulbIcon />,
    title: 'Innovation',
    description: 'We continuously innovate to provide cutting-edge solutions that adapt to changing educational needs.',
    color: '#ff9800'
  },
  {
    icon: <SupportIcon />,
    title: 'Excellence',
    description: 'We strive for excellence in every interaction, from product development to customer support.',
    color: '#9c27b0'
  }
];

const timeline = [
  {
    year: '2022',
    title: 'Foundation',
    description: 'AO Counsellor HUB was founded by a team of former educational consultants and software developers.',
    icon: <BusinessIcon />
  },
  {
    year: '2023',
    title: 'First Launch',
    description: 'Successfully launched our first version with core application tracking features.',
    icon: <SchoolIcon />
  },
  {
    year: '2024',
    title: 'Growth & Expansion',
    description: 'Expanded to serve 50+ universities and 500+ students with advanced analytics.',
    icon: <TrendingUpIcon />
  },
  {
    year: '2025',
    title: 'Future Vision',
    description: 'Continuing to innovate with AI-powered insights and global expansion.',
    icon: <TrophyIcon />
  }
];

const achievements = [
  { number: '500+', label: 'Students Enrolled', icon: <PeopleIcon /> },
  { number: '50+', label: 'University Partners', icon: <SchoolIcon /> },
  { number: '95%', label: 'Success Rate', icon: <TrendingUpIcon /> },
  { number: '24/7', label: 'Support Available', icon: <SupportIcon /> }
];

function About() {
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
              label="Trusted Platform"
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
              About AO Counsellor HUB
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
              Revolutionizing the way educational consultants manage student applications with innovative technology and proven expertise
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Our Story Section */}
        <Box sx={{ mb: 12 }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                  Our Story
                </Typography>
                <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
                  Founded in 2022, AO Counsellor HUB was born out of a need to simplify the complex process 
                  of managing master's degree applications. Our team of former educational consultants 
                  and software developers came together to create a solution that eliminates the chaos 
                  of spreadsheets and email threads.
                </Typography>
                <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                  We understand the challenges faced by educational consultants firsthand, having worked 
                  in the industry for years. This deep understanding drives our commitment to creating 
                  tools that truly serve the needs of the education community.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                      opacity: 0.6
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, position: 'relative', zIndex: 1 }}>
                    "We believe every student deserves the best chance at their dream education"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
                    Our mission is to empower educational consultants with the tools they need to make this vision a reality.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

        {/* Mission Section */}
        <Box sx={{ mb: 12 }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6} sx={{ order: { xs: 2, md: 1 } }}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: theme.palette.success.main }}>
                    Our Mission
                  </Typography>
                  <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
                    To empower educational consultants with intuitive tools that streamline application 
                    tracking, reduce administrative overhead, and improve student outcomes through 
                    data-driven decision making.
                  </Typography>
                  <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                    We're committed to building a platform that not only simplifies workflows but also 
                    enhances the quality of guidance provided to students pursuing their educational dreams.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ order: { xs: 1, md: 2 } }}>
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
                  Our Vision
                </Typography>
                <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, mb: 3 }}>
                  To become the leading platform that transforms how educational consulting is conducted, 
                  making quality education accessible to students worldwide through technology-driven solutions.
                </Typography>
                <Typography paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                  We envision a future where every educational consultant has access to powerful tools 
                  that enable them to provide exceptional guidance and support to their students.
                </Typography>
              </Grid>
            </Grid>
          </Box>

        {/* Values Section */}
        <Box sx={{ mb: 12 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Our Core Values
          </Typography>
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[12],
                      backgroundColor: alpha(value.color, 0.02)
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
                      borderRadius: 2,
                      backgroundColor: alpha(value.color, 0.1),
                      color: value.color,
                      mb: 3
                    }}
                  >
                    {value.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Timeline Section */}
        <Box sx={{ mb: 12 }}>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Our Journey
          </Typography>
          <Box sx={{ position: 'relative' }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
                transform: 'translateX(-50%)',
                display: { xs: 'none', md: 'block' }
              }}
            />
            
            {timeline.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 4,
                  flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' }
                }}
              >
                {/* Content */}
                <Box
                  sx={{
                    flex: 1,
                    textAlign: { xs: 'center', md: index % 2 === 0 ? 'right' : 'left' },
                    pr: { xs: 0, md: index % 2 === 0 ? 4 : 0 },
                    pl: { xs: 0, md: index % 2 === 0 ? 0 : 4 },
                    mb: { xs: 2, md: 0 }
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      display: 'inline-block',
                      maxWidth: 400,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {item.description}
                    </Typography>
                  </Paper>
                </Box>

                {/* Timeline dot */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    zIndex: 1,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                    }
                  }}
                >
                  {item.icon}
                </Box>

                {/* Year */}
                <Box
                  sx={{
                    flex: 1,
                    textAlign: { xs: 'center', md: index % 2 === 0 ? 'left' : 'right' },
                    pl: { xs: 0, md: index % 2 === 0 ? 4 : 0 },
                    pr: { xs: 0, md: index % 2 === 0 ? 0 : 4 }
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: theme.palette.primary.main,
                      fontSize: { xs: '2rem', md: '2.5rem' }
                    }}
                  >
                    {item.year}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Achievements Section */}
        <Box sx={{ 
          py: 8, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 4,
          mb: 8
        }}>
          <Container maxWidth="lg">
            <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 6 }}>
              Our Achievements
            </Typography>
            <Grid container spacing={4}>
              {achievements.map((achievement, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <Box textAlign="center">
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        mb: 2,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      }}
                    >
                      {achievement.icon}
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                      {achievement.number}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {achievement.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Team Section */}
        <Box>
          <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 8 }}>
            Meet Our Team
          </Typography>
          <TeamSection />
        </Box>
      </Container>
    </Box>
  );
}

export default About;