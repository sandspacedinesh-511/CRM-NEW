import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  useTheme,
  Fade,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const PHASES = [
  { key: 'DOCUMENT_COLLECTION', label: 'Document Collection', color: '#2196f3' },
  { key: 'UNIVERSITY_SHORTLISTING', label: 'University Shortlisting', color: '#ff9800' },
  { key: 'APPLICATION_SUBMISSION', label: 'Application Submission', color: '#9c27b0' },
  { key: 'OFFER_RECEIVED', label: 'Offer Received', color: '#4caf50' },
  { key: 'INITIAL_PAYMENT', label: 'Initial Payment', color: '#795548' },
  { key: 'INTERVIEW', label: 'Interview', color: '#607d8b' },
  { key: 'FINANCIAL_TB_TEST', label: 'Financial & TB Test', color: '#ff5722' },
  { key: 'CAS_VISA', label: 'CAS Process', color: '#8bc34a' },
  { key: 'VISA_APPLICATION', label: 'Visa Process', color: '#ffc107' },
  { key: 'ENROLLMENT', label: 'Enrollment', color: '#03a9f4' }
];

// Helper function to get phase label or handle unknown phases
const getPhaseLabel = (phaseKey) => {
  const phase = PHASES.find(p => p.key === phaseKey);
  if (phase) {
    return phase.label;
  }
  // Handle unknown phases gracefully
  if (phaseKey) {
    return phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Not Started';
};

// Helper function to get phase color or default
const getPhaseColor = (phaseKey) => {
  const phase = PHASES.find(p => p.key === phaseKey);
  return phase ? phase.color : '#9e9e9e'; // Default gray for unknown phases
};

const ProgressOverview = ({ students = [] }) => {
  const theme = useTheme();
  
  // Debug: Log student phases to console (removed to prevent infinite loop)

  const calculateStats = () => {
    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageProgress: 0,
        phaseDistribution: [],
        completionRates: [],
        stuckStudents: 0,
        activeStudents: 0,
        completedStudents: 0
      };
    }

    // Calculate phase distribution
    const phaseCounts = {};
    const unknownPhases = {};
    
    // Initialize known phases
    PHASES.forEach(phase => {
      phaseCounts[phase.key] = 0;
    });

    // Count students by phase
    students.forEach(student => {
      if (phaseCounts[student.currentPhase] !== undefined) {
        phaseCounts[student.currentPhase]++;
      } else if (student.currentPhase) {
        // Handle unknown phases
        unknownPhases[student.currentPhase] = (unknownPhases[student.currentPhase] || 0) + 1;
      }
    });

    // Create phase distribution including unknown phases
    const phaseDistribution = [
      ...PHASES.map(phase => ({
        ...phase,
        count: phaseCounts[phase.key] || 0,
        percentage: ((phaseCounts[phase.key] || 0) / totalStudents) * 100
      })),
      ...Object.entries(unknownPhases).map(([phaseKey, count]) => ({
        key: phaseKey,
        label: getPhaseLabel(phaseKey),
        color: getPhaseColor(phaseKey),
        count: count,
        percentage: (count / totalStudents) * 100
      }))
    ];

    // Calculate average progress
    const totalProgress = students.reduce((sum, student) => {
      const phaseIndex = PHASES.findIndex(phase => phase.key === student.currentPhase);
      if (phaseIndex >= 0) {
        return sum + ((phaseIndex + 1) / PHASES.length) * 100;
      } else if (student.currentPhase) {
        // For unknown phases, assume they're in the middle of the process
        return sum + 50; // 50% progress for unknown phases
      }
      return sum + 0; // 0% for students without a phase
    }, 0);
    const averageProgress = totalProgress / totalStudents;

    // Calculate completion rates
    const completionRates = PHASES.map((phase, index) => {
      const studentsInPhase = phaseCounts[phase.key] || 0;
      const studentsCompleted = students.filter(student => {
        const studentPhaseIndex = PHASES.findIndex(p => p.key === student.currentPhase);
        return studentPhaseIndex > index;
      }).length;
      
      return {
        ...phase,
        completed: studentsCompleted,
        inPhase: studentsInPhase,
        completionRate: studentsInPhase > 0 ? (studentsCompleted / studentsInPhase) * 100 : 0
      };
    });

    // Add completion rates for unknown phases
    Object.entries(unknownPhases).forEach(([phaseKey, count]) => {
      completionRates.push({
        key: phaseKey,
        label: getPhaseLabel(phaseKey),
        color: getPhaseColor(phaseKey),
        completed: 0, // Unknown phases don't contribute to completion
        inPhase: count,
        completionRate: 0
      });
    });

    // Count students by status
    const stuckStudents = students.filter(student => student.status === 'DEFERRED' || student.status === 'REJECTED').length;
    const activeStudents = students.filter(student => student.status === 'ACTIVE').length;
    const completedStudents = students.filter(student => student.currentPhase === 'ENROLLMENT').length;

    return {
      totalStudents,
      averageProgress,
      phaseDistribution,
      completionRates,
      stuckStudents,
      activeStudents,
      completedStudents
    };
  };

  const stats = calculateStats();

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    if (progress >= 40) return 'info';
    return 'error';
  };

  return (
    <Fade in={true} timeout={1000}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Progress Overview
          </Typography>

          {/* Summary Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'primary.50' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {stats.totalStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'success.50' }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {stats.activeStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'warning.50' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {stats.stuckStudents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stuck Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'info.50' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {Math.round(stats.averageProgress)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Progress
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Overall Progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Overall Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={stats.averageProgress}
              color={getProgressColor(stats.averageProgress)}
              sx={{
                height: 12,
                borderRadius: 6,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Average completion across all students
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {Math.round(stats.averageProgress)}%
              </Typography>
            </Box>
          </Box>

          {/* Phase Distribution */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Phase Distribution
            </Typography>
            <Grid container spacing={2}>
              {stats.phaseDistribution.map((phase) => (
                <Grid item xs={12} sm={6} md={4} key={phase.key}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: phase.count > 0 ? `${phase.color}10` : 'transparent'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {phase.label}
                      </Typography>
                      <Chip
                        label={phase.count}
                        size="small"
                        sx={{
                          backgroundColor: phase.color,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={phase.percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${phase.color}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: phase.color,
                          borderRadius: 3
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {Math.round(phase.percentage)}% of students
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Completion Rates */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Phase Completion Rates
            </Typography>
            <Grid container spacing={2}>
              {stats.completionRates.map((phase) => (
                <Grid item xs={12} sm={6} md={4} key={phase.key}>
                  <Tooltip title={`${phase.completed} students completed this phase`}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: `${phase.color}10`,
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {phase.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {phase.inPhase}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            →
                          </Typography>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            {phase.completed}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={phase.completionRate}
                        color={phase.completionRate >= 80 ? 'success' : phase.completionRate >= 50 ? 'warning' : 'error'}
                        sx={{
                          height: 6,
                          borderRadius: 3
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {Math.round(phase.completionRate)}% completion rate
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ProgressOverview; 