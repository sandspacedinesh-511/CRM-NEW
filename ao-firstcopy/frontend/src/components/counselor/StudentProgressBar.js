import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Fade
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Description as DocumentIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Flight as FlightIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PHASES = [
  {
    key: 'DOCUMENT_COLLECTION',
    label: 'Document Collection',
    icon: <DocumentIcon />,
    color: '#2196f3',
    requiredDocs: []
  },
  {
    key: 'UNIVERSITY_SHORTLISTING',
    label: 'University Shortlisting',
    icon: <SchoolIcon />,
    color: '#ff9800',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT']
  },
  {
    key: 'APPLICATION_SUBMISSION',
    label: 'Application Submission',
    icon: <AssignmentIcon />,
    color: '#9c27b0',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']
  },
  {
    key: 'OFFER_RECEIVED',
    label: 'Offer Received',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']
  },
  {
    key: 'INITIAL_PAYMENT',
    label: 'Initial Payment',
    icon: <PaymentIcon />,
    color: '#795548',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    icon: <PersonIcon />,
    color: '#607d8b',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']
  },
  {
    key: 'FINANCIAL_TB_TEST',
    label: 'Financial & TB Test',
    icon: <EventIcon />,
    color: '#ff5722',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'CAS_VISA',
    label: 'CAS & Visa',
    icon: <TrendingUpIcon />,
    color: '#8bc34a',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'VISA_APPLICATION',
    label: 'Visa Application',
    icon: <FlightIcon />,
    color: '#ffc107',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'ENROLLMENT',
    label: 'Enrollment',
    icon: <SchoolIcon />,
    color: '#03a9f4',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  }
];

const StudentProgressBar = ({ student, documents = [], applications = [], onPhaseClick }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    calculateProgress();
  }, [student, documents, applications]);

  const calculateProgress = () => {
    const currentPhaseIndex = PHASES.findIndex(phase => phase.key === student?.currentPhase);
    const progress = PHASES.map((phase, index) => {
      const isCompleted = index < currentPhaseIndex;
      const isCurrent = index === currentPhaseIndex;
      const isPending = index > currentPhaseIndex;
      const isNextPhase = index === currentPhaseIndex + 1; // Only check next immediate phase
      
      // Only check document completion for current phase and next immediate phase
      let requiredDocs = [];
      let uploadedDocs = [];
      let docCompletion = 100;
      let isReady = true;
      let missingDocs = [];
      
      if (isCurrent || isNextPhase) {
        requiredDocs = phase.requiredDocs;
        uploadedDocs = documents.filter(doc => 
          requiredDocs.includes(doc.type) && ['PENDING', 'APPROVED'].includes(doc.status)
        );
        
        // Check if all required document types are present (not just count)
        const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
        missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
        
        // Phase is ready if no documents are required OR all required document types are present
        isReady = requiredDocs.length === 0 || missingDocs.length === 0;
        
        // Calculate completion percentage based on required document types present
        docCompletion = requiredDocs.length > 0 ? 
          ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100 : 100;
      }
      
      // Calculate overall phase completion
      let phaseCompletion = 0;
      if (isCompleted) {
        phaseCompletion = 100;
      } else if (isCurrent) {
        phaseCompletion = docCompletion;
      } else if (isPending) {
        phaseCompletion = 0;
      }

      return {
        ...phase,
        isCompleted,
        isCurrent,
        isPending,
        isNextPhase,
        isReady,
        docCompletion,
        phaseCompletion,
        uploadedDocs,
        missingDocs
      };
    });

    setProgressData(progress);
  };

  const getOverallProgress = () => {
    const completedPhases = progressData.filter(phase => phase.isCompleted).length;
    const currentPhaseProgress = progressData.find(phase => phase.isCurrent)?.phaseCompletion || 0;
    return ((completedPhases + (currentPhaseProgress / 100)) / PHASES.length) * 100;
  };

  const getStatusIcon = (phase) => {
    if (phase.isCompleted) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (phase.isCurrent) {
      if (phase.isReady) {
        return <CheckCircleIcon sx={{ color: 'warning.main' }} />;
      } else {
        return <WarningIcon sx={{ color: 'error.main' }} />;
      }
    } else if (phase.isNextPhase) {
      // For next phase, only show warning if it's not ready
      if (!phase.isReady) {
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      } else {
        return <PendingIcon sx={{ color: 'text.disabled' }} />;
      }
    } else {
      return <PendingIcon sx={{ color: 'text.disabled' }} />;
    }
  };

  const getStatusColor = (phase) => {
    if (phase.isCompleted) {
      return 'success';
    } else if (phase.isCurrent) {
      return phase.isReady ? 'warning' : 'error';
    } else if (phase.isNextPhase) {
      return phase.isReady ? 'default' : 'warning';
    } else {
      return 'default';
    }
  };

  const handlePhaseClick = (phase) => {
    if (onPhaseClick) {
      onPhaseClick(phase);
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Application Progress
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round(getOverallProgress())}% Complete
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ color: 'text.secondary' }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Overall Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            />
          </Box>

          {/* Phase Progress */}
          <Grid container spacing={2}>
            {progressData.map((phase, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={phase.key}>
                <Card
                  sx={{
                    cursor: phase.isNextPhase ? 'pointer' : 'default',
                    transition: 'all 0.2s ease-in-out',
                    border: phase.isCurrent ? `2px solid ${phase.color}` : '1px solid',
                    borderColor: phase.isCurrent ? phase.color : theme.palette.divider,
                    backgroundColor: phase.isCurrent ? `${phase.color}10` : 'transparent',
                    opacity: phase.isNextPhase ? 1 : 0.7,
                    '&:hover': {
                      transform: phase.isNextPhase ? 'translateY(-2px)' : 'none',
                      boxShadow: phase.isNextPhase ? theme.shadows[4] : 'none',
                      borderColor: phase.isNextPhase ? phase.color : theme.palette.divider
                    }
                  }}
                  onClick={() => phase.isNextPhase ? handlePhaseClick(phase) : null}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: phase.color }}>
                          {phase.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {phase.label}
                        </Typography>
                      </Box>
                      {getStatusIcon(phase)}
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={phase.phaseCompletion}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: `${phase.color}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: phase.color,
                          borderRadius: 2
                        }
                      }}
                    />

                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(phase.phaseCompletion)}%
                      </Typography>
                      <Chip
                        label={phase.isCompleted ? 'Completed' : phase.isCurrent ? 'Current' : 'Pending'}
                        size="small"
                        color={getStatusColor(phase)}
                        variant={phase.isCurrent ? 'filled' : 'outlined'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>

                                         {/* Document Status - Only show for current and next phase */}
                     {(phase.isCurrent || phase.isNextPhase) && phase.requiredDocs.length > 0 && (
                       <Box sx={{ mt: 1 }}>
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                           Documents: {phase.requiredDocs.length - phase.missingDocs.length}/{phase.requiredDocs.length}
                         </Typography>
                         {phase.missingDocs.length > 0 && (
                           <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                             Missing: {phase.missingDocs.join(', ')}
                           </Typography>
                         )}
                       </Box>
                     )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Detailed View */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Detailed Progress
            </Typography>
            
            <List>
              {progressData.map((phase, index) => (
                <React.Fragment key={phase.key}>
                  <ListItem sx={{ 
                    backgroundColor: phase.isCurrent ? `${phase.color}10` : 'transparent',
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <ListItemIcon sx={{ color: phase.color }}>
                      {phase.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {phase.label}
                          </Typography>
                          {getStatusIcon(phase)}
                        </Box>
                      }
                    />
                    <Box sx={{ mt: 1, ml: 7 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress: {Math.round(phase.phaseCompletion)}%
                      </Typography>
                      {(phase.isCurrent || phase.isNextPhase) && phase.requiredDocs.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Required Documents:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {phase.requiredDocs.map(docType => {
                              const isUploaded = phase.uploadedDocs.some(doc => doc.type === docType);
                              return (
                                <Chip
                                  key={docType}
                                  label={docType.replace(/_/g, ' ')}
                                  size="small"
                                  color={isUploaded ? 'success' : 'default'}
                                  variant={isUploaded ? 'filled' : 'outlined'}
                                  icon={isUploaded ? <CheckCircleIcon /> : <PendingIcon />}
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      {(phase.isCurrent || phase.isNextPhase) && phase.missingDocs.length > 0 && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          ⚠️ Missing: {phase.missingDocs.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                  {index < progressData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default StudentProgressBar; 