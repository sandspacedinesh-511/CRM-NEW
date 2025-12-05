import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Description as DocumentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import useWebSocket from '../../hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

const RealTimeActivityFeed = ({ maxItems = 10, title = 'Live Activity Feed', showHeader = true }) => {
  const theme = useTheme();
  const { isConnected, onEvent } = useWebSocket();
  const [activities, setActivities] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Listen for real-time activities
  useEffect(() => {
    if (!isConnected || !liveUpdates) return;

    const cleanupUserActivity = onEvent('user_activity_update', (data) => {
      addActivity({
        type: 'user_activity',
        description: `${data.action}: ${data.details || ''}`,
        timestamp: data.timestamp,
        icon: <PersonIcon />,
        color: theme.palette.primary.main
      });
    });

    const cleanupApplicationUpdate = onEvent('application_status_changed', (data) => {
      addActivity({
        type: 'application',
        description: `Application ${data.applicationId} status changed to ${data.status}`,
        timestamp: data.timestamp,
        icon: <AssignmentIcon />,
        color: theme.palette.info.main
      });
    });

    const cleanupDocumentUpload = onEvent('document_uploaded', (data) => {
      addActivity({
        type: 'document',
        description: `Document uploaded: ${data.fileName}`,
        timestamp: data.timestamp,
        icon: <DocumentIcon />,
        color: theme.palette.success.main
      });
    });

    const cleanupDashboardUpdate = onEvent('dashboard_update', (data) => {
      addActivity({
        type: 'system',
        description: 'Dashboard updated',
        timestamp: new Date().toISOString(),
        icon: <CheckCircleIcon />,
        color: theme.palette.success.main
      });
    });

    return () => {
      cleanupUserActivity?.();
      cleanupApplicationUpdate?.();
      cleanupDocumentUpload?.();
      cleanupDashboardUpdate?.();
    };
  }, [isConnected, liveUpdates, onEvent, theme]);

  const addActivity = (activity) => {
    setActivities(prev => [activity, ...prev].slice(0, maxItems));
  };

  const handleRefresh = () => {
    setActivities([]);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_activity':
        return <PersonIcon />;
      case 'application':
        return <AssignmentIcon />;
      case 'document':
        return <DocumentIcon />;
      case 'system':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_activity':
        return theme.palette.primary.main;
      case 'application':
        return theme.palette.info.main;
      case 'document':
        return theme.palette.success.main;
      case 'system':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
      }}
    >
      {showHeader && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              <TimelineIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              <Chip
                label={isConnected ? 'Live' : 'Offline'}
                size="small"
                color={isConnected ? 'success' : 'default'}
                sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
              />
            </Box>
          </Box>
          <Box>
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Collapse in={expanded}>
        <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
          {activities.length > 0 ? (
            <List sx={{ p: 0 }}>
              {activities.map((activity, index) => (
                <Fade key={`${activity.timestamp}-${index}`} in={true} timeout={500}>
                  <ListItem
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      transition: 'all 0.3s ease',
                      backgroundColor: index === 0 ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(activity.color, 0.1),
                          color: activity.color,
                          width: 36,
                          height: 36
                        }}
                      >
                        {activity.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.description}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </Typography>
                      }
                    />
                    {index === 0 && isConnected && (
                      <Chip
                        label="NEW"
                        size="small"
                        color="primary"
                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </ListItem>
                </Fade>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {isConnected ? 'Waiting for activities...' : 'Connect to see live activities'}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default RealTimeActivityFeed;

