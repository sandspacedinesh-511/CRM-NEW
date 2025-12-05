import React from 'react';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  useTheme,
  Fade,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Description as DocumentIcon,
  School as SchoolIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

const TaskList = ({ tasks }) => {
  const theme = useTheme();

  const getTaskIcon = (type) => {
    switch (type) {
      case 'Document':
        return <DocumentIcon sx={{ color: theme.palette.info.main }} />;
      case 'Application':
        return <SchoolIcon sx={{ color: theme.palette.primary.main }} />;
      case 'Interview':
        return <AssignmentIcon sx={{ color: theme.palette.warning.main }} />;
      default:
        return <EventIcon sx={{ color: theme.palette.text.secondary }} />;
    }
  };

  const getTaskPriority = (deadline) => {
    const date = new Date(deadline);
    const daysUntil = differenceInDays(date, new Date());
    
    if (isPast(date) && !isToday(date)) {
      return { level: 'high', color: 'error', label: 'Overdue' };
    }
    if (isToday(date)) {
      return { level: 'high', color: 'error', label: 'Today' };
    }
    if (isTomorrow(date)) {
      return { level: 'medium', color: 'warning', label: 'Tomorrow' };
    }
    if (daysUntil <= 3) {
      return { level: 'medium', color: 'warning', label: 'Urgent' };
    }
    if (daysUntil <= 7) {
      return { level: 'low', color: 'info', label: 'This Week' };
    }
    return { level: 'low', color: 'default', label: format(date, 'MMM d') };
  };

  const getProgressColor = (priority) => {
    switch (priority.color) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[400];
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityA = getTaskPriority(a.deadline);
    const priorityB = getTaskPriority(b.deadline);
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[priorityB.level] - priorityOrder[priorityA.level];
  });

  return (
    <Box sx={{ height: '100%' }}>
      <List sx={{ width: '100%', p: 0 }}>
        {sortedTasks.map((task, index) => {
          const priority = getTaskPriority(task.deadline);
          const isOverdue = priority.color === 'error';
          
          return (
            <Fade in={true} timeout={600 + (index * 100)} key={task.id}>
              <ListItem
                sx={{
                  p: 2,
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: isOverdue 
                    ? `${theme.palette.error[50]}`
                    : priority.level === 'high'
                    ? `${theme.palette.warning[50]}`
                    : 'transparent',
                  border: `1px solid ${
                    isOverdue 
                      ? theme.palette.error[200]
                      : priority.level === 'high'
                      ? theme.palette.warning[200]
                      : theme.palette.divider
                  }`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: isOverdue 
                      ? `${theme.palette.error[100]}`
                      : priority.level === 'high'
                      ? `${theme.palette.warning[100]}`
                      : theme.palette.action.hover,
                    transform: 'translateX(4px)',
                    boxShadow: theme.shadows[2],
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: isOverdue 
                        ? theme.palette.error[100]
                        : priority.level === 'high'
                        ? theme.palette.warning[100]
                        : theme.palette.grey[100],
                      color: isOverdue 
                        ? theme.palette.error.main
                        : priority.level === 'high'
                        ? theme.palette.warning.main
                        : theme.palette.text.secondary,
                    }}
                  >
                    {getTaskIcon(task.type)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: isOverdue ? theme.palette.error.main : theme.palette.text.primary
                        }}
                      >
                        {task.description}
                      </Typography>
                      {priority.level === 'high' && (
                        <PriorityHighIcon 
                          sx={{ 
                            fontSize: '1rem', 
                            color: isOverdue ? theme.palette.error.main : theme.palette.warning.main 
                          }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ScheduleIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary">
                          Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          size="small"
                          label={priority.label}
                          color={priority.color}
                          variant={isOverdue ? "filled" : "outlined"}
                          sx={{ 
                            fontSize: '0.7rem',
                            height: 20,
                            fontWeight: 600
                          }}
                        />
                        {task.student && (
                          <Typography variant="caption" color="textSecondary">
                            • {task.student.name}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Progress indicator for urgent tasks */}
                      {priority.level === 'high' && (
                        <LinearProgress
                          variant="determinate"
                          value={isOverdue ? 100 : 75}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: `${getProgressColor(priority)}20`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getProgressColor(priority),
                              borderRadius: 2,
                            }
                          }}
                        />
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Tooltip title="Task actions">
                    <IconButton 
                      edge="end" 
                      size="small"
                      sx={{
                        color: isOverdue ? theme.palette.error.main : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: isOverdue 
                            ? theme.palette.error[100]
                            : theme.palette.action.hover,
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            </Fade>
          );
        })}
        
        {tasks.length === 0 && (
          <Fade in={true} timeout={800}>
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: theme.palette.text.secondary
            }}>
              <EventIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.5 }} />
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                No upcoming tasks
              </Typography>
              <Typography variant="caption">
                You're all caught up! New tasks will appear here.
              </Typography>
            </Box>
          </Fade>
        )}
      </List>
    </Box>
  );
};

export default TaskList; 