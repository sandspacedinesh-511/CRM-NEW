import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  NotificationImportant as NotificationImportantIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';

import { fetchTelecallerDashboard } from '../../services/telecallerService';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

const ActivityLog = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, joinRoom, onEvent } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTelecallerDashboard();
      setDashboardData(response?.data ?? response);
    } catch (apiError) {
      console.error('Failed to load activity log:', apiError);
      setError('Unable to load activity right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Join telecaller room for realtime updates
  useEffect(() => {
    if (isConnected && user?.role === 'telecaller') {
      joinRoom(`telecaller:${user.id}`);
    }
  }, [isConnected, joinRoom, user]);

  // Refresh activity log whenever telecaller tasks are updated
  useEffect(() => {
    if (!isConnected) return undefined;
    const cleanup = onEvent('telecaller_task_updated', () => loadData());
    return () => cleanup?.();
  }, [isConnected, onEvent, loadData]);

  const activityFeed = dashboardData?.activityFeed ?? [];
  const engagementAlerts = dashboardData?.engagementAlerts ?? [];
  const callVolume = dashboardData?.callVolume ?? [];

  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <RefreshIcon className="spin" />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>


        <Card>
          <CardHeader
            title="Recent Call Activity"
            subheader="Latest calls and interactions recorded"
          />
          <CardContent>
            {activityFeed.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No activity recorded yet. Your calls will appear here once completed.
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 480, overflow: 'auto', px: 0 }}>
                {activityFeed.map((activity) => {
                  const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
                  return (
                    <Box key={activity.id}>
                      <ListItem sx={{ alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.15),
                              color: theme.palette.primary.main
                            }}
                          >
                            <TimelineIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {activity.student?.name ? `${activity.student.name} · ` : ''}
                              {timestamp ? format(timestamp, 'PPpp') : 'Just now'}
                              {timestamp && ` (${formatDistanceToNow(timestamp, { addSuffix: true })})`}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </Box>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="7-Day Call Volume"
            subheader="Trend of all attempts you logged in the last week"
          />
          <CardContent>
            {callVolume.length === 0 ? (
              <Typography color="text.secondary">No call volume recorded yet.</Typography>
            ) : (
              <List sx={{ px: 0 }}>
                {callVolume.map((item) => (
                  <ListItem key={item.date}>
                    <ListItemText
                      primary={item.date}
                      secondary={`${item.total} call${item.total === 1 ? '' : 's'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default ActivityLog;

