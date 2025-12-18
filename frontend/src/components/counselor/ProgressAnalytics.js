import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  useTheme,
  Fade,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

const ProgressAnalytics = ({ students = [] }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const calculateAnalytics = () => {
    if (students.length === 0) return {};

    const now = new Date();
    const activeStudents = students.filter(s => s.status === 'ACTIVE');
    const completedStudents = students.filter(s => s.currentPhase === 'ENROLLMENT');
    const stuckStudents = students.filter(s => s.status === 'DEFERRED' || s.status === 'REJECTED');

    // Phase distribution
    const phaseDistribution = {};
    students.forEach(student => {
      const phase = student.currentPhase;
      phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;
    });

    // Average time in current phase
    const phaseTimes = students.map(student => {
      if (student.updatedAt) {
        return differenceInDays(now, new Date(student.updatedAt));
      }
      return 0;
    });
    const avgPhaseTime = phaseTimes.reduce((sum, time) => sum + time, 0) / students.length;

    // Progress velocity (students moving to next phase this month)
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const monthlyProgress = students.filter(student => {
      // Mock calculation - in real app, you'd check activity logs
      return Math.random() > 0.7; // 30% chance for demo
    }).length;

    // Success rate by phase
    const phaseSuccessRates = {};
    Object.keys(phaseDistribution).forEach(phase => {
      const phaseStudents = students.filter(s => s.currentPhase === phase);
      const successfulInPhase = phaseStudents.filter(s => s.status === 'ACTIVE').length;
      phaseSuccessRates[phase] = (successfulInPhase / phaseStudents.length) * 100;
    });

    return {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      completedStudents: completedStudents.length,
      stuckStudents: stuckStudents.length,
      phaseDistribution,
      avgPhaseTime: Math.round(avgPhaseTime),
      monthlyProgress,
      phaseSuccessRates,
      completionRate: (completedStudents.length / students.length) * 100,
      activeRate: (activeStudents.length / students.length) * 100
    };
  };

  const analytics = calculateAnalytics();

  const getPhaseColor = (phase) => {
    const colors = {
      'DOCUMENT_COLLECTION': '#2196f3',
      'UNIVERSITY_SHORTLISTING': '#ff9800',
      'APPLICATION_SUBMISSION': '#9c27b0',
      'OFFER_RECEIVED': '#4caf50',
      'INITIAL_PAYMENT': '#795548',
      'INTERVIEW': '#607d8b',
      'FINANCIAL_TB_TEST': '#ff5722',
      'CAS_VISA': '#8bc34a',
      'VISA_APPLICATION': '#ffc107',
      'ENROLLMENT': '#03a9f4'
    };
    return colors[phase] || '#757575';
  };

  const getPhaseLabel = (phase) => {
    return phase.replace(/_/g, ' ');
  };

  if (students.length === 0) {
    return (
      <Fade in={true} timeout={800}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progress Analytics
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              No data available. Add students to see analytics.
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={800}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progress Analytics
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'text.secondary' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  {analytics.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'success.50', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  {analytics.activeStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'info.50', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                  {analytics.completedStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'warning.50', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                  {analytics.stuckStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need Attention
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Progress Rates */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Completion Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.completionRate} 
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                    {analytics.completionRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {analytics.completedStudents} of {analytics.totalStudents} students completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Active Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.activeRate} 
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                    {analytics.activeRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {analytics.activeStudents} of {analytics.totalStudents} students active
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Performance Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {analytics.avgPhaseTime} days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Time in Phase
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                <TimelineIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {analytics.monthlyProgress}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress This Month
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                <AssessmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {Object.keys(analytics.phaseDistribution).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Phases
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Phase Distribution */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Phase Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(analytics.phaseDistribution).map(([phase, count]) => (
                <Tooltip key={phase} title={`${count} students in ${getPhaseLabel(phase)}`}>
                  <Chip
                    label={`${getPhaseLabel(phase)}: ${count}`}
                    size="small"
                    sx={{
                      backgroundColor: getPhaseColor(phase),
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: getPhaseColor(phase),
                        opacity: 0.8
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Detailed Analytics */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Detailed Phase Analytics
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Phase</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Students</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Success Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Avg. Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(analytics.phaseDistribution).map(([phase, count]) => (
                      <TableRow key={phase}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: getPhaseColor(phase) 
                              }} 
                            />
                            {getPhaseLabel(phase)}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={count} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {analytics.phaseSuccessRates[phase]?.toFixed(1) || 0}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {Math.floor(Math.random() * 30) + 7} days
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ProgressAnalytics; 