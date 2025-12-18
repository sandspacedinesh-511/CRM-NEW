import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Grid,
  Button,
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  PriorityHigh as PriorityHighIcon,
  Warning as WarningIcon,
  LowPriority as LowPriorityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';

const ApplicationCardView = ({ 
  applications, 
  onEdit, 
  onDelete, 
  onView, 
  getApplicationStatusColor, 
  getApplicationStatusIcon,
  getPriorityColor,
  getPriorityIcon
}) => {
  const getDeadlineStatus = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = differenceInDays(deadlineDate, now);
    
    if (isAfter(now, deadlineDate)) {
      return { status: 'overdue', color: 'error', text: 'Overdue' };
    } else if (daysUntilDeadline <= 7) {
      return { status: 'urgent', color: 'warning', text: `${daysUntilDeadline} days left` };
    } else if (daysUntilDeadline <= 30) {
      return { status: 'approaching', color: 'info', text: `${daysUntilDeadline} days left` };
    } else {
      return { status: 'safe', color: 'success', text: `${daysUntilDeadline} days left` };
    }
  };

  const getProgressPercentage = (application) => {
    // Calculate progress based on application status
    const statusProgress = {
      'PENDING': 20,
      'SUBMITTED': 40,
      'UNDER_REVIEW': 60,
      'ACCEPTED': 100,
      'REJECTED': 100,
      'DEFERRED': 80
    };
    return statusProgress[application.applicationStatus] || 0;
  };

  return (
    <Grid container spacing={3}>
      {applications.map((application) => {
        const deadlineStatus = getDeadlineStatus(application.deadline);
        const progressPercentage = getProgressPercentage(application);
        
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={application.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                },
                border: deadlineStatus.status === 'overdue' ? '2px solid #f44336' : '1px solid #e0e0e0'
              }}
            >
              {/* Header with Status */}
              <Box sx={{ 
                p: 2, 
                background: `linear-gradient(135deg, ${getApplicationStatusColor(application.applicationStatus) === 'success' ? '#4caf50' : 
                  getApplicationStatusColor(application.applicationStatus) === 'error' ? '#f44336' : 
                  getApplicationStatusColor(application.applicationStatus) === 'warning' ? '#ff9800' : '#2196f3'}20 0%, 
                  ${getApplicationStatusColor(application.applicationStatus) === 'success' ? '#4caf50' : 
                  getApplicationStatusColor(application.applicationStatus) === 'error' ? '#f44336' : 
                  getApplicationStatusColor(application.applicationStatus) === 'warning' ? '#ff9800' : '#2196f3'}10 100%)`,
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    icon={getApplicationStatusIcon(application.applicationStatus)}
                    label={application.applicationStatus}
                    color={getApplicationStatusColor(application.applicationStatus)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => onView(application)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Application">
                      <IconButton size="small" onClick={() => onEdit(application)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Application">
                      <IconButton size="small" onClick={() => onDelete(application)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* Progress Bar */}
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="textSecondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {progressPercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${getApplicationStatusColor(application.applicationStatus) === 'success' ? '#4caf50' : 
                          getApplicationStatusColor(application.applicationStatus) === 'error' ? '#f44336' : 
                          getApplicationStatusColor(application.applicationStatus) === 'warning' ? '#ff9800' : '#2196f3'} 0%, 
                          ${getApplicationStatusColor(application.applicationStatus) === 'success' ? '#66bb6a' : 
                          getApplicationStatusColor(application.applicationStatus) === 'error' ? '#ef5350' : 
                          getApplicationStatusColor(application.applicationStatus) === 'warning' ? '#ffb74d' : '#42a5f5'} 100%)`
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Content */}
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Student Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {application.student?.name || 'Unknown Student'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {application.student?.email || 'No email'}
                    </Typography>
                  </Box>
                </Box>

                {/* University Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {application.university?.name || 'Unknown University'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="textSecondary">
                        {application.university?.country || 'Unknown Country'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Course Info */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <BookIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {application.courseName || 'No Course'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {application.courseLevel || 'No Level'} • {application.intakeTerm || 'No Intake'}
                  </Typography>
                </Box>

                {/* Priority and Fee */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    icon={getPriorityIcon(application.priority)}
                    label={application.priority || 'No Priority'}
                    color={getPriorityColor(application.priority)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    ${application.applicationFee || 0}
                  </Typography>
                </Box>

                {/* Deadline */}
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: deadlineStatus.status === 'overdue' ? '#ffebee' : 
                           deadlineStatus.status === 'urgent' ? '#fff3e0' : 
                           deadlineStatus.status === 'approaching' ? '#e3f2fd' : '#f1f8e9',
                  border: `1px solid ${deadlineStatus.status === 'overdue' ? '#f44336' : 
                                   deadlineStatus.status === 'urgent' ? '#ff9800' : 
                                   deadlineStatus.status === 'approaching' ? '#2196f3' : '#4caf50'}20`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, fontSize: 16, color: deadlineStatus.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Deadline
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: deadlineStatus.color }}>
                      {deadlineStatus.text}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(application.deadline), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              </CardContent>

              {/* Footer Actions */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Updated: {format(new Date(application.updatedAt || application.createdAt), 'MMM dd')}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onView(application)}
                    sx={{ textTransform: 'none' }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ApplicationCardView;
