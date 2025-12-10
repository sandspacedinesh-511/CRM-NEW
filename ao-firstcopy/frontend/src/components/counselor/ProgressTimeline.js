import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Fade,
  Chip,
  Tooltip,
  Grid,
  Avatar,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Flight as FlightIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PHASES = [
  {
    key: 'DOCUMENT_COLLECTION',
    label: 'Document Collection',
    icon: <AssignmentIcon />,
    color: '#2196f3',
    description: 'Initial document gathering phase'
  },
  {
    key: 'UNIVERSITY_SHORTLISTING',
    label: 'University Shortlisting',
    icon: <SchoolIcon />,
    color: '#ff9800',
    description: 'Researching and selecting universities'
  },
  {
    key: 'APPLICATION_SUBMISSION',
    label: 'Application Submission',
    icon: <AssignmentIcon />,
    color: '#9c27b0',
    description: 'Submitting applications to universities'
  },
  {
    key: 'OFFER_RECEIVED',
    label: 'Offer Received',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    description: 'University offer received'
  },
  {
    key: 'INITIAL_PAYMENT',
    label: 'Initial Payment',
    icon: <PaymentIcon />,
    color: '#795548',
    description: 'Making initial payments'
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    icon: <PersonIcon />,
    color: '#607d8b',
    description: 'University interview process'
  },
  {
    key: 'FINANCIAL_TB_TEST',
    label: 'Financial & TB Test',
    icon: <EventIcon />,
    color: '#ff5722',
    description: 'Financial documents and medical tests'
  },
  {
    key: 'CAS_VISA',
    label: 'CAS Process',
    icon: <TrendingUpIcon />,
    color: '#8bc34a',
    description: 'CAS letter and visa preparation'
  },
  {
    key: 'VISA_APPLICATION',
    label: 'Visa Process',
    icon: <FlightIcon />,
    color: '#ffc107',
    description: 'Submitting visa process'
  },
  {
    key: 'ENROLLMENT',
    label: 'Enrollment',
    icon: <SchoolIcon />,
    color: '#03a9f4',
    description: 'Final enrollment at university'
  }
];

const ProgressTimeline = ({ student, activities = [] }) => {
  const theme = useTheme();

  const getPhaseStatus = (phaseKey) => {
    const currentPhaseIndex = PHASES.findIndex(phase => phase.key === student?.currentPhase);
    const phaseIndex = PHASES.findIndex(phase => phase.key === phaseKey);
    
    if (phaseIndex < currentPhaseIndex) {
      return 'completed';
    } else if (phaseIndex === currentPhaseIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const getPhaseIcon = (phaseKey) => {
    const status = getPhaseStatus(phaseKey);
    const phase = PHASES.find(p => p.key === phaseKey);
    
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'current':
        return phase?.icon || <TrendingUpIcon />;
      case 'pending':
        return <ScheduleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getPhaseColor = (phaseKey) => {
    const status = getPhaseStatus(phaseKey);
    const phase = PHASES.find(p => p.key === phaseKey);
    
    switch (status) {
      case 'completed':
        return 'success';
      case 'current':
        return 'primary';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPhaseActivities = (phaseKey) => {
    return activities.filter(activity => 
      activity.type === 'PHASE_CHANGE' && 
      activity.metadata?.newPhase === phaseKey
    );
  };

  const getPhaseDate = (phaseKey) => {
    const phaseActivities = getPhaseActivities(phaseKey);
    if (phaseActivities.length > 0) {
      return new Date(phaseActivities[0].createdAt);
    }
    return null;
  };

  const getEstimatedDate = (phaseKey) => {
    const currentPhaseIndex = PHASES.findIndex(phase => phase.key === student?.currentPhase);
    const phaseIndex = PHASES.findIndex(phase => phase.key === phaseKey);
    
    if (phaseIndex <= currentPhaseIndex) {
      return null; // Already completed or current
    }
    
    // Estimate 2 weeks per phase
    const weeksToPhase = (phaseIndex - currentPhaseIndex) * 2;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (weeksToPhase * 7));
    
    return estimatedDate;
  };

  return (
    <Fade in={true} timeout={1000}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Application Timeline
          </Typography>

          <Box sx={{ position: 'relative' }}>
            {/* Timeline Line */}
            <Box
              sx={{
                position: 'absolute',
                left: 24,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: theme.palette.divider,
                zIndex: 0
              }}
            />

            {PHASES.map((phase, index) => {
              const status = getPhaseStatus(phase.key);
              const phaseDate = getPhaseDate(phase.key);
              const estimatedDate = getEstimatedDate(phase.key);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              const isPending = status === 'pending';

              return (
                <Box key={phase.key} sx={{ position: 'relative', mb: 3 }}>
                  {/* Timeline Dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: 8,
                      zIndex: 1,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? phase.color : 
                                   isCompleted ? theme.palette.success.main : 
                                   theme.palette.grey[400],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: `0 0 0 2px ${theme.palette.divider}`
                    }}
                  >
                    <Box sx={{ color: 'white', fontSize: '0.8rem' }}>
                      {getPhaseIcon(phase.key)}
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ ml: 8 }}>
                    <Card sx={{ 
                      backgroundColor: isCurrent ? `${phase.color}10` : 'transparent',
                      border: isCurrent ? `1px solid ${phase.color}30` : '1px solid',
                      borderColor: isCurrent ? `${phase.color}30` : theme.palette.divider
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box sx={{ color: isCurrent ? phase.color : 'text.secondary' }}>
                                {phase.icon}
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {phase.label}
                              </Typography>
                              <Chip
                                label={status.toUpperCase()}
                                size="small"
                                color={getPhaseColor(phase.key)}
                                variant={isCurrent ? 'filled' : 'outlined'}
                                sx={{ fontSize: '0.6rem', height: 20 }}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary">
                              {phase.description}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                              {phaseDate ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {format(phaseDate, 'MMM d, yyyy')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Completed
                                  </Typography>
                                </Box>
                              ) : estimatedDate ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {format(estimatedDate, 'MMM d, yyyy')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Estimated
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {isCurrent ? 'In Progress' : 'Pending'}
                                </Typography>
                              )}

                              {isCurrent && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                    Current Phase
                                  </Typography>
                                </Box>
                              )}

                              {isCompleted && phaseDate && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                    Completed on {format(phaseDate, 'MMM d, yyyy')}
                                  </Typography>
                                </Box>
                              )}

                              {isPending && estimatedDate && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Estimated: {format(estimatedDate, 'MMM d, yyyy')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Timeline Legend */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Timeline Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main
                  }}
                />
                <Typography variant="caption">Completed</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main
                  }}
                />
                <Typography variant="caption">Current</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.grey[400]
                  }}
                />
                <Typography variant="caption">Pending</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ProgressTimeline; 