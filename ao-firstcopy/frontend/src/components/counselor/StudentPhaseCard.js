import React from 'react';
import {
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  useTheme,
  Fade,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format, isValid } from 'date-fns';

const PHASE_COLORS = {
  DOCUMENT_COLLECTION: '#2196f3',
  UNIVERSITY_SHORTLISTING: '#ff9800',
  APPLICATION_SUBMISSION: '#9c27b0',
  OFFER_RECEIVED: '#4caf50',
  INITIAL_PAYMENT: '#795548',
  INTERVIEW: '#607d8b',
  FINANCIAL_TB_TEST: '#ff5722',
  CAS_VISA: '#8bc34a',
  VISA_APPLICATION: '#ffc107',
  ENROLLMENT: '#03a9f4'
};

const PHASE_ORDER = [
  'DOCUMENT_COLLECTION',
  'UNIVERSITY_SHORTLISTING',
  'APPLICATION_SUBMISSION',
  'OFFER_RECEIVED',
  'INITIAL_PAYMENT',
  'INTERVIEW',
  'FINANCIAL_TB_TEST',
  'CAS_VISA',
  'VISA_APPLICATION',
  'ENROLLMENT'
];

const StudentPhaseCard = ({ 
  student, 
  onPhaseChange, 
  onViewDetails, 
  onEditStudent, 
  onViewDocuments, 
  onViewApplications,
  onShareLead
}) => {
  // Helper function to safely format dates
  const safeFormatDate = (dateString, formatString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isValid(date) ? format(date, formatString) : 'Invalid Date';
  };
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [phaseMenuAnchorEl, setPhaseMenuAnchorEl] = React.useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePhaseMenuClick = (event) => {
    setPhaseMenuAnchorEl(event.currentTarget);
  };

  const handlePhaseMenuClose = () => {
    setPhaseMenuAnchorEl(null);
  };

  const handlePhaseChange = (newPhase) => {
    onPhaseChange(student.id, newPhase);
    handlePhaseMenuClose();
  };

  const getNextPhases = () => {
    const currentIndex = PHASE_ORDER.indexOf(student.currentPhase);
    return PHASE_ORDER.filter((_, index) => index !== currentIndex);
  };

  const getPhaseProgress = () => {
    const currentIndex = PHASE_ORDER.indexOf(student.currentPhase);
    return ((currentIndex + 1) / PHASE_ORDER.length) * 100;
  };

  const getStatusIcon = () => {
    switch (student.status) {
      case 'ACTIVE':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'DEFERRED':
        return <ScheduleIcon sx={{ color: theme.palette.warning.main }} />;
      case 'REJECTED':
        return <WarningIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (student.status) {
      case 'ACTIVE':
        return theme.palette.success.main;
      case 'DEFERRED':
        return theme.palette.warning.main;
      case 'REJECTED':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const formatPhaseLabel = (phase) => {
    if (!phase || typeof phase !== 'string') {
      return 'Not Started';
    }
    return phase.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStudentInitials = () => {
    return `${student.firstName?.charAt(0) || ''}${student.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ 
        p: 3,
        borderRadius: 3,
        backgroundColor: 'white',
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${PHASE_COLORS[student.currentPhase]}, ${PHASE_COLORS[student.currentPhase]}80)`,
        },
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
          '&::before': {
            background: `linear-gradient(90deg, ${PHASE_COLORS[student.currentPhase]}, ${PHASE_COLORS[student.currentPhase]}CC)`,
          }
        }
      }}
      onClick={() => onViewDetails(student.id)}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${PHASE_COLORS[student.currentPhase]}, ${PHASE_COLORS[student.currentPhase]}CC)`,
                color: 'white',
                fontWeight: 700,
                fontSize: '1.2rem',
                boxShadow: `0 4px 16px ${PHASE_COLORS[student.currentPhase]}40`,
                border: '3px solid white'
              }}
            >
              {getStudentInitials()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {student.firstName} {student.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ fontSize: '0.875rem', color: 'text.secondary', opacity: 0.7 }} />
                <Typography variant="caption" color="textSecondary" sx={{ opacity: 0.8 }}>
                  {student.email}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={student.status}
              size="small"
              sx={{
                backgroundColor: `${getStatusColor()}15`,
                color: getStatusColor(),
                border: `1px solid ${getStatusColor()}30`,
                fontWeight: 600,
                fontSize: '0.7rem',
                borderRadius: 2,
                height: 24,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
            <Tooltip title="More actions">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClick(e);
                }}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Phase Information */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              Current Phase
            </Typography>
            <TrendingUpIcon sx={{ fontSize: '1rem', color: PHASE_COLORS[student.currentPhase] }} />
          </Box>
          <Chip
            label={formatPhaseLabel(student.currentPhase)}
            onClick={(e) => {
              e.stopPropagation();
              handlePhaseMenuClick(e);
            }}
            sx={{
              backgroundColor: `${PHASE_COLORS[student.currentPhase]}15`,
              color: PHASE_COLORS[student.currentPhase],
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${PHASE_COLORS[student.currentPhase]}30`,
              '&:hover': {
                backgroundColor: `${PHASE_COLORS[student.currentPhase]}25`,
              }
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              Application Progress
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
              {Math.round(getPhaseProgress())}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getPhaseProgress()}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: `${PHASE_COLORS[student.currentPhase]}15`,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${PHASE_COLORS[student.currentPhase]}, ${PHASE_COLORS[student.currentPhase]}CC)`,
                borderRadius: 5,
                boxShadow: `0 2px 8px ${PHASE_COLORS[student.currentPhase]}40`,
              }
            }}
          />
          
          {/* Phase Steps Indicator */}
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
            {PHASE_ORDER.map((phase, index) => {
              const isCompleted = index < PHASE_ORDER.indexOf(student.currentPhase);
              const isCurrent = phase === student.currentPhase;
              const isPending = index > PHASE_ORDER.indexOf(student.currentPhase);
              
              return (
                <Box
                  key={phase}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isCompleted ? PHASE_COLORS[phase] : 
                                   isCurrent ? PHASE_COLORS[phase] + '80' : 
                                   theme.palette.grey[300],
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isCompleted ? `0 2px 4px ${PHASE_COLORS[phase]}40` : 'none'
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Additional Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="textSecondary">
              Added: {safeFormatDate(student.createdAt, 'MMM d, yyyy')}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
            Phase {PHASE_ORDER.indexOf(student.currentPhase) + 1} of {PHASE_ORDER.length}
          </Typography>
        </Box>

        {/* Menus */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              borderRadius: 2,
              minWidth: 180,
            }
          }}
        >
          <MenuItem onClick={() => {
            onViewDetails(student.id);
            handleMenuClose();
          }}>
            <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} />
            View Details
          </MenuItem>
          <MenuItem onClick={() => {
            onEditStudent?.(student.id);
            handleMenuClose();
          }}>
            <SchoolIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Edit Information
          </MenuItem>
          <MenuItem onClick={() => {
            onShareLead?.(student);
            handleMenuClose();
          }}>
            <TrendingUpIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Share Lead
          </MenuItem>
          <MenuItem onClick={() => {
            onViewDocuments?.(student.id);
            handleMenuClose();
          }}>
            <CalendarIcon sx={{ mr: 1, fontSize: '1rem' }} />
            View Documents
          </MenuItem>
          <MenuItem onClick={() => {
            onViewApplications?.(student.id);
            handleMenuClose();
          }}>
            <TrendingUpIcon sx={{ mr: 1, fontSize: '1rem' }} />
            View Applications
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={phaseMenuAnchorEl}
          open={Boolean(phaseMenuAnchorEl)}
          onClose={handlePhaseMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              borderRadius: 2,
              minWidth: 200,
            }
          }}
        >
          {getNextPhases().map((phase) => (
            <MenuItem
              key={phase}
              onClick={() => handlePhaseChange(phase)}
              sx={{
                color: PHASE_COLORS[phase],
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: `${PHASE_COLORS[phase]}15`
                }
              }}
            >
              {formatPhaseLabel(phase)}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Fade>
  );
};

export default StudentPhaseCard; 