// src/pages/marketing/components/Features.js
import { Grid, Box, Typography } from '@mui/material';
import {
  Assignment, Checklist, Timeline, Lock, Analytics, Group
} from '@mui/icons-material';

const features = [
  {
    icon: <Assignment fontSize="large" />,
    title: "Phase Tracking",
    description: "Monitor each student's progress through 8 defined application phases"
  },
  {
    icon: <Checklist fontSize="large" />,
    title: "Document Management",
    description: "Securely store and organize all student documents in one place"
  },
  {
    icon: <Timeline fontSize="large" />,
    title: "Progress Analytics",
    description: "Visual reports to track application timelines and success rates"
  },
  {
    icon: <Lock fontSize="large" />,
    title: "Secure Access",
    description: "Role-based permissions ensure data privacy and security"
  },
  {
    icon: <Analytics fontSize="large" />,
    title: "Performance Metrics",
    description: "Track counselor productivity and application conversion rates"
  },
  {
    icon: <Group fontSize="large" />,
    title: "Student Management",
    description: "Easily manage up to 50 students per counselor with custom notes"
  }
];

function Features() {
  return (
    <Box sx={{ my: 8 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        Key Features
      </Typography>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box textAlign="center" sx={{ p: 3 }}>
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h5" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body1">
                {feature.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Features;