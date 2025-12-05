import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  useTheme,
  Fade,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ProgressAlerts = ({ students = [], onStudentClick }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(true);

  const generateAlerts = () => {
    const alerts = [];

    students.forEach(student => {
      // Check for stuck students
      if (student.status === 'DEFERRED' || student.status === 'REJECTED') {
        alerts.push({
          type: 'error',
          title: 'Student Stuck',
          message: `${student.firstName} ${student.lastName} is stuck in ${student.status.toLowerCase()} status`,
          student,
          priority: 'high',
          action: 'Review Status'
        });
      }

      // Check for students in same phase for too long (more than 30 days)
      const daysInPhase = student.updatedAt ? 
        Math.floor((new Date() - new Date(student.updatedAt)) / (1000 * 60 * 60 * 24)) : 0;
      
      if (daysInPhase > 30 && student.status === 'ACTIVE') {
        alerts.push({
          type: 'warning',
          title: 'Long Phase Duration',
          message: `${student.firstName} ${student.lastName} has been in ${student.currentPhase.replace(/_/g, ' ')} for ${daysInPhase} days`,
          student,
          priority: 'medium',
          action: 'Check Progress'
        });
      }

      // Check for students near deadlines
      if (student.applicationDeadline) {
        const daysToDeadline = Math.floor((new Date(student.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysToDeadline <= 7 && daysToDeadline > 0) {
          alerts.push({
            type: 'warning',
            title: 'Approaching Deadline',
            message: `${student.firstName} ${student.lastName} has ${daysToDeadline} days until application deadline`,
            student,
            priority: 'high',
            action: 'Review Application'
          });
        } else if (daysToDeadline < 0) {
          alerts.push({
            type: 'error',
            title: 'Deadline Passed',
            message: `${student.firstName} ${student.lastName} application deadline has passed`,
            student,
            priority: 'critical',
            action: 'Urgent Review'
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const alerts = generateAlerts();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  if (alerts.length === 0) {
    return (
      <Fade in={true} timeout={800}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Clear
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              No alerts or issues detected. All students are progressing well!
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progress Alerts
              </Typography>
              <Chip 
                label={alerts.length} 
                size="small" 
                color="warning" 
                sx={{ ml: 1 }}
              />
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'text.secondary' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <List sx={{ p: 0 }}>
              {alerts.map((alert, index) => (
                <ListItem
                  key={`${alert.student.id}-${index}`}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor: `${getAlertColor(alert.type)}.50`,
                    border: `1px solid ${theme.palette[getAlertColor(alert.type)].main}20`,
                    '&:hover': {
                      backgroundColor: `${getAlertColor(alert.type)}.100`,
                    }
                  }}
                >
                  <ListItemIcon>
                    {getAlertIcon(alert.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.priority.toUpperCase()}
                          size="small"
                          color={getPriorityColor(alert.priority)}
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={alert.student.currentPhase.replace(/_/g, ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Updated: {format(new Date(alert.student.updatedAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onStudentClick(alert.student.id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.7rem',
                      px: 2,
                      py: 0.5
                    }}
                  >
                    {alert.action}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default ProgressAlerts; 