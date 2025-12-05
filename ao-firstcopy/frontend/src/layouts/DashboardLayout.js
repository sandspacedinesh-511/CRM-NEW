import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Fade,
  Slide,
  Chip,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Button,
  Collapse,
  Alert,
  ListItemAvatar,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Description as DocumentIcon,
  Assignment as ApplicationIcon,
  AccountCircle as ProfileIcon,
  Task as TaskIcon,
  Business as UniversityIcon,
  PhoneInTalk as PhoneInTalkIcon,
  Campaign as CampaignIcon,
  Call as CallIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  NotificationsActive as NotificationsActiveIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  KeyboardArrowRight as ArrowRightIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  Security as SecurityIcon,
  NotificationsNone as NotificationsNoneIcon,
  NotificationsOff as NotificationsOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import axiosInstance from '../utils/axios';

const drawerWidth = 280;

function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // WebSocket integration
  const { isConnected, onEvent } = useWebSocket();

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get('/notifications');
        if (response.data.success) {
          setNotifications(response.data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = onEvent('notification', (notification) => {
      // Add new notification to the list
      setNotifications(prev => [notification, ...prev].slice(0, 50));

      // Show snackbar notification
      setSnackbarMessage(notification.message || notification.title);
      setSnackbarSeverity(
        notification.priority === 'high' ? 'error' :
          notification.priority === 'medium' ? 'warning' : 'info'
      );
      setSnackbarOpen(true);

      // Play notification sound if browser supports it
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => { });
      } catch (e) {
        // Ignore audio errors
      }
    });

    return cleanup;
  }, [isConnected, onEvent]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    if (user?.role === 'admin') {
      navigate('/admin/profile');
    } else if (user?.role === 'counselor') {
      navigate('/counselor/profile');
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label,
        path: currentPath,
        icon: null
      });
    });

    return breadcrumbs;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/counselor-monitoring')) return 'Counselor Monitoring';
    if (path.includes('/admin/counselors')) return 'Counselor Management';
    if (path.includes('/admin/telecallers')) return 'Telecaller Team';
    if (path.includes('/admin/marketing-team')) return 'Marketing Team';
    if (path.includes('/admin/b2b-marketing-team')) return 'B2B Marketing Team';
    if (path.includes('/admin/students')) return 'Student Management';
    if (path.includes('/admin/universities')) return 'University Management';
    if (path.includes('/admin/analytics')) return 'Analytics';
    if (path.includes('/admin/reports')) return 'Reports';
    if (path.includes('/admin/settings')) return 'Settings';
    if (path.includes('/counselor/students')) return 'My Students';
    if (path.includes('/counselor/documents')) return 'Documents';
    if (path.includes('/counselor/applications')) return 'Applications';
    if (path.includes('/counselor/universities')) return 'Universities';
    if (path.includes('/counselor/tasks')) return 'Tasks';
    if (path.includes('/counselor/notifications')) return 'Notifications';
    if (path.includes('/counselor/profile')) return 'Profile';
    if (path.includes('/telecaller/tasks')) return 'Tasks';
    if (path.includes('/telecaller/follow-ups')) return 'Follow-ups';
    if (path.includes('/telecaller/activity')) return 'Activity Log';
    if (path.includes('/telecaller/exports')) return 'Exports';
    if (path.includes('/telecaller')) return 'Telecalling Dashboard';
    if (path.includes('/b2b-marketing/leads')) return 'B2B Marketing Leads';
    if (path.includes('/b2b-marketing/activities')) return 'B2B Marketing Activities';
    if (path.includes('/b2b-marketing/reports')) return 'B2B Marketing Reports';
    if (path.includes('/b2b-marketing/communication')) return 'B2B Marketing Communication';
    if (path.includes('/b2b-marketing/notifications')) return 'B2B Marketing Notifications';
    if (path.includes('/b2b-marketing/dashboard')) return 'B2B Marketing Dashboard';
    if (path.includes('/marketing/leads')) return 'Marketing Leads';
    if (path.includes('/marketing/activities')) return 'Marketing Activities';
    if (path.includes('/marketing/reports')) return 'Marketing Reports';
    if (path.includes('/marketing/communication')) return 'Marketing Communication';
    if (path.includes('/marketing/notifications')) return 'Marketing Notifications';
    if (path.includes('/marketing/dashboard')) return 'Marketing Dashboard';
    return 'Dashboard';
  };

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Counselors', icon: <PeopleIcon />, path: '/admin/counselors' },
    { text: 'Telecaller Team', icon: <PhoneInTalkIcon />, path: '/admin/telecallers' },
    { text: 'Marketing Team', icon: <CampaignIcon />, path: '/admin/marketing-team' },
    { text: 'B2B Marketing Team', icon: <CampaignIcon />, path: '/admin/b2b-marketing-team' },
    { text: 'Counselor Monitoring', icon: <AnalyticsIcon />, path: '/admin/counselor-monitoring' },
    { text: 'Students', icon: <SchoolIcon />, path: '/admin/students' },
    { text: 'Universities', icon: <UniversityIcon />, path: '/admin/universities' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: 'Reports', icon: <DocumentIcon />, path: '/admin/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' }
  ];

  const counselorMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/counselor/dashboard' },
    { text: 'Students', icon: <SchoolIcon />, path: '/counselor/students' },
    { text: 'Documents', icon: <DocumentIcon />, path: '/counselor/documents' },
    { text: 'Applications', icon: <ApplicationIcon />, path: '/counselor/applications' },
    { text: 'Universities', icon: <UniversityIcon />, path: '/counselor/universities' },
    { text: 'Tasks', icon: <TaskIcon />, path: '/counselor/tasks' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/counselor/notifications' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/counselor/profile' }
  ];

  const telecallerMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/telecaller/dashboard' },
    { text: 'Tasks', icon: <TaskIcon />, path: '/telecaller/tasks' },
    { text: 'Follow-ups', icon: <CallIcon />, path: '/telecaller/follow-ups' },
    { text: 'Activity Log', icon: <TimelineIcon />, path: '/telecaller/activity' },
    { text: 'Exports', icon: <DownloadIcon />, path: '/telecaller/exports' }
  ];

  const marketingMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/marketing/dashboard' },
    { text: 'Leads', icon: <PeopleIcon />, path: '/marketing/leads' },
    { text: 'Activities', icon: <TimelineIcon />, path: '/marketing/activities' },
    { text: 'Reports', icon: <AnalyticsIcon />, path: '/marketing/reports' },
    { text: 'Communication', icon: <PhoneInTalkIcon />, path: '/marketing/communication' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/marketing/notifications' }
  ];

  const b2bMarketingMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/b2b-marketing/dashboard' },
    { text: 'Leads', icon: <PeopleIcon />, path: '/b2b-marketing/leads' },
    { text: 'Activities', icon: <TimelineIcon />, path: '/b2b-marketing/activities' },
    { text: 'Reports', icon: <AnalyticsIcon />, path: '/b2b-marketing/reports' },
    { text: 'Communication', icon: <PhoneInTalkIcon />, path: '/b2b-marketing/communication' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/b2b-marketing/notifications' }
  ];

  const userRole = user?.role?.toLowerCase?.() || user?.role || '';

  const menuItems = (() => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'counselor':
        return counselorMenuItems;
      case 'telecaller':
        return telecallerMenuItems;
      case 'marketing':
        return marketingMenuItems;
      case 'b2b_marketing':
        return b2bMarketingMenuItems;
      default:
        return [];
    }
  })();

  const roleSubtitleMap = {
    admin: 'Admin Panel',
    counselor: 'Counselor Portal',
    telecaller: 'Telecalling Desk',
    marketing: 'Marketing Command Center',
    b2b_marketing: 'B2B Marketing Command Center'
  };

  const roleChipLabelMap = {
    admin: 'Administrator',
    counselor: 'Counselor',
    telecaller: 'Telecaller',
    marketing: 'Marketing',
    b2b_marketing: 'B2B Marketing'
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Counsellor CRM
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {roleSubtitleMap[userRole] || 'User Workspace'}
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: 'white', position: 'relative', zIndex: 1 }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    mx: 2,
                    borderRadius: 2,
                    minHeight: 48,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isActive
                        ? theme.palette.primary.dark
                        : theme.palette.primary[50],
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 40,
                    color: isActive ? 'white' : theme.palette.text.secondary
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.grey[50],
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme.palette.grey[100],
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }
        }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 40,
              height: 40,
              mr: 2,
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={roleChipLabelMap[userRole] || 'User'}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            zIndex: theme.zIndex.drawer + 1
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            zIndex: theme.zIndex.drawer
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Top App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            marginLeft: { md: `${drawerWidth}px` },
            backgroundColor: 'white',
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(8px)',
            zIndex: theme.zIndex.appBar
          }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Breadcrumbs */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, flexGrow: 1 }}>
              <Breadcrumbs
                separator={<ArrowRightIcon fontSize="small" />}
                sx={{
                  '& .MuiBreadcrumbs-separator': {
                    color: theme.palette.text.secondary
                  }
                }}
              >
                {getBreadcrumbs().map((breadcrumb, index) => (
                  <Link
                    key={index}
                    color={index === getBreadcrumbs().length - 1 ? 'text.primary' : 'inherit'}
                    href={breadcrumb.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(breadcrumb.path);
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {breadcrumb.icon}
                    <Typography variant="body2" sx={{ ml: breadcrumb.icon ? 0.5 : 0 }}>
                      {breadcrumb.label}
                    </Typography>
                  </Link>
                ))}
              </Breadcrumbs>
            </Box>

            {/* Page Title for Mobile */}
            <Typography
              variant="h6"
              sx={{
                display: { xs: 'block', sm: 'none' },
                flexGrow: 1,
                fontWeight: 600
              }}
            >
              {getPageTitle()}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

              {/* Search */}
              <Collapse in={searchOpen} orientation="horizontal">
                <TextField
                  size="small"
                  placeholder="Search..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Collapse>

              {/* Search Toggle */}
              <Tooltip title="Search">
                <IconButton
                  color="inherit"
                  onClick={() => setSearchOpen(!searchOpen)}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100]
                    }
                  }}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
                <IconButton
                  color="inherit"
                  onClick={handleFullscreen}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100]
                    }
                  }}
                >
                  {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title={`${notifications.filter(n => !n.read).length} new notifications ${isConnected ? '(Real-time)' : '(Offline)'}`}>
                <IconButton
                  color="inherit"
                  onClick={handleNotificationMenuOpen}
                  sx={{
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100]
                    }
                  }}
                >
                  <Badge
                    badgeContent={notifications.filter(n => !n.read).length}
                    color="error"
                    overlap="circular"
                  >
                    <Badge
                      badgeContent=""
                      color={isConnected ? 'success' : 'warning'}
                      sx={{
                        '& .MuiBadge-badge': {
                          width: 8,
                          height: 8,
                          right: 2,
                          top: 2
                        }
                      }}
                    >
                      {isConnected ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                    </Badge>
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Profile Menu */}
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{
                    p: 0.5,
                    border: `2px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 36,
                      height: 36,
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>

            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1,
                  minWidth: 350,
                  maxHeight: 400,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showNotifications}
                        onChange={(e) => setShowNotifications(e.target.checked)}
                        size="small"
                      />
                    }
                    label=""
                  />
                </Box>
              </Box>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {showNotifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <MenuItem
                      key={notification.id}
                      sx={{
                        py: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: notification.type === 'application' ? 'success.main' :
                              notification.type === 'document' ? 'info.main' : 'warning.main',
                            width: 32,
                            height: 32
                          }}
                        >
                          {notification.type === 'application' && <ApplicationIcon fontSize="small" />}
                          {notification.type === 'document' && <DocumentIcon fontSize="small" />}
                          {notification.type === 'system' && <SettingsIcon fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.time}
                        </Typography>
                      </Box>
                      {!notification.read && (
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main'
                        }} />
                      )}
                    </MenuItem>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No notifications
                    </Typography>
                  </Box>
                )}
              </Box>
            </Menu>

            {/* Profile Menu Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              TransitionComponent={Fade}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Settings</Typography>
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <SecurityIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Security</Typography>
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <HelpIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Help & Support</Typography>
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FeedbackIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Feedback</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: theme.palette.error.main }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
          pt: '64px' // Add top padding to account for fixed AppBar
        }}>
          <Slide direction="up" in={true} mountOnEnter unmountOnExit>
            <Box>
              <Outlet />
            </Box>
          </Slide>
        </Box>

        {/* WebSocket Connection Status */}
        <Tooltip title={isConnected ? 'Real-time connected' : 'Connecting to real-time updates...'}>
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: 20,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 2,
              backgroundColor: isConnected ? 'success.main' : 'warning.main',
              color: 'white',
              boxShadow: theme.shadows[8]
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'white',
                animation: isConnected ? 'none' : 'pulse 2s infinite'
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 600, pr: 1 }}>
              {isConnected ? 'Live' : 'Connecting...'}
            </Typography>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </Box>
        </Tooltip>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default DashboardLayout;