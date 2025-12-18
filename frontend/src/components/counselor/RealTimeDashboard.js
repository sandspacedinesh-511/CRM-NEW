import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';

const RealTimeDashboard = () => {
  const { user } = useAuth();
  const {
    isConnected,
    connectionError,
    onEvent,
    sendUserActivity
  } = useWebSocket();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      activeApplications: 0,
      pendingDocuments: 0,
      upcomingDeadlines: 0
    },
    recentStudents: [],
    upcomingTasks: [],
    phaseDistribution: [],
    universityDistribution: [],
    notifications: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Load initial dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/counselor/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
      
      // Send user activity
      sendUserActivity('dashboard_viewed', { timestamp: new Date().toISOString() });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [sendUserActivity]);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Listen for real-time updates
    const cleanupNotifications = onEvent('notification', (notification) => {
      setDashboardData(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications.slice(0, 9)] // Keep last 10
      }));
      
      setNotificationMessage(notification.message);
      setShowNotification(true);
    });

    // Listen for application status changes
    const cleanupApplicationUpdates = onEvent('application_status_changed', (data) => {
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          activeApplications: data.status === 'ACCEPTED' 
            ? prev.stats.activeApplications + 1 
            : prev.stats.activeApplications
        }
      }));
      
      setNotificationMessage(`Application status updated: ${data.status}`);
      setShowNotification(true);
    });

    // Listen for document uploads
    const cleanupDocumentUploads = onEvent('document_uploaded', (data) => {
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          pendingDocuments: Math.max(0, prev.stats.pendingDocuments - 1)
        }
      }));
      
      setNotificationMessage(`Document uploaded: ${data.fileName}`);
      setShowNotification(true);
    });

    // Listen for dashboard updates
    const cleanupDashboardUpdates = onEvent('dashboard_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        ...data
      }));
      setLastUpdate(new Date());
    });

    return () => {
      cleanupNotifications?.();
      cleanupApplicationUpdates?.();
      cleanupDocumentUploads?.();
      cleanupDashboardUpdates?.();
    };
  }, [isConnected, onEvent]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes (fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        loadDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getPhaseColor = (phase) => {
    const phaseColors = {
      'DOCUMENT_COLLECTION': 'warning',
      'UNIVERSITY_SHORTLISTING': 'info',
      'APPLICATION_SUBMISSION': 'primary',
      'OFFER_RECEIVED': 'success',
      'INITIAL_PAYMENT': 'secondary',
      'INTERVIEW': 'info',
      'FINANCIAL_TB_TEST': 'warning',
      'CAS_VISA': 'primary',
      'VISA_APPLICATION': 'secondary',
      'ENROLLMENT': 'success'
    };
    return phaseColors[phase] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Connection Status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Real-Time Dashboard
        </Typography>
        
        <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
          <IconButton size="small">
            {isConnected ? (
              <WifiIcon color="success" />
            ) : (
              <WifiOffIcon color="error" />
            )}
          </IconButton>
        </Tooltip>
        
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
        
        <Typography variant="caption" color="textSecondary">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Connection Error */}
      {connectionError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          WebSocket connection error: {connectionError}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.totalStudents}
                  </Typography>
                </Box>
                <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Applications
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.activeApplications}
                  </Typography>
                </Box>
                <AssignmentIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Documents
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.pendingDocuments}
                  </Typography>
                </Box>
                <Badge badgeContent={dashboardData.stats.pendingDocuments} color="error">
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Upcoming Deadlines
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.upcomingDeadlines}
                  </Typography>
                </Box>
                <ScheduleIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Students */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Students
              </Typography>
              {dashboardData.recentStudents.map((student) => (
                <Box key={student.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {student.email}
                      </Typography>
                    </Box>
                    <Chip 
                      label={student.currentPhase.replace(/_/g, ' ')} 
                      color={getPhaseColor(student.currentPhase)}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Tasks
              </Typography>
              {dashboardData.upcomingTasks.map((task) => (
                <Box key={task.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {task.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={task.type} 
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleNotificationClose} severity="info" sx={{ width: '100%' }}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RealTimeDashboard;
