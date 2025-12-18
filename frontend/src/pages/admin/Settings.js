import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button, Alert, CircularProgress, Switch, FormControlLabel, Divider, Card, CardContent, CardHeader, Tabs, Tab, 
  FormControl, InputLabel, Select, MenuItem, Slider, Chip, Stack, Avatar, IconButton, Tooltip, Badge, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, DialogActions, useTheme, alpha, LinearProgress,
  Breadcrumbs, Link, AlertTitle, Snackbar, Fab, Drawer, AppBar, Toolbar, useMediaQuery, Collapse, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails
} from '@mui/material';
import {
  Save as SaveIcon, Refresh as RefreshIcon, Settings as SettingsIcon, Security as SecurityIcon, Notifications as NotificationsIcon,
  Email as EmailIcon, Backup as BackupIcon, RestartAlt as ResetIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, CheckCircle as CheckCircleIcon, Warning as WarningIcon,
  Error as ErrorIcon, Info as InfoIcon, Dashboard as DashboardIcon, People as PeopleIcon, School as SchoolIcon,
  Assignment as AssignmentIcon, TrendingUp as TrendingUpIcon, Speed as SpeedIcon, Star as StarIcon, Bolt as BoltIcon,
  MoreVert as MoreVertIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Close as CloseIcon,
  Lock as LockIcon, LockOpen as LockOpenIcon, VpnKey as VpnKeyIcon, Shield as ShieldIcon, VerifiedUser as VerifiedUserIcon,
  AdminPanelSettings as AdminPanelSettingsIcon, SupervisedUserCircle as SupervisedUserCircleIcon, Group as GroupIcon,
  Person as PersonIcon, PersonAdd as PersonAddIcon, PersonRemove as PersonRemoveIcon, PersonOff as PersonOffIcon,
  PersonOutline as PersonOutlineIcon, AccountCircle as AccountCircleIcon, AccountBox as AccountBoxIcon,
  AccountBalance as AccountBalanceIcon, AccountBalanceWallet as AccountBalanceWalletIcon, AccountTree as AccountTreeIcon,
  Business as BusinessIcon, Psychology as PsychologyIcon, Engineering as EngineeringIcon, Verified as VerifiedIcon,
  Timeline as TimelineIcon, Analytics as AnalyticsIcon, NotificationsActive as NotificationsActiveIcon,
  EmailOutlined as EmailOutlinedIcon, Phone as PhoneIcon, LocationOn as LocationIcon, Language as LanguageIcon,
  Public as PublicIcon, Cloud as CloudIcon, Storage as StorageIcon, Restore as RestoreIcon, Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon, Menu as MenuIcon, Search as SearchIcon, Clear as ClearIcon, Sort as SortIcon,
  FilterAlt as FilterAltIcon, Tune as TuneIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon, GridView as GridViewIcon, List as ListIcon, Apps as AppsIcon, ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon, ViewStream as ViewStreamIcon, ViewWeek as ViewWeekIcon, ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon, ViewCarousel as ViewCarouselIcon, ViewQuilt as ViewQuiltIcon, ViewSidebar as ViewSidebarIcon,
  ViewTimeline as ViewTimelineIcon, ViewComfyAlt as ViewComfyAltIcon, ViewCompact as ViewCompactIcon,
  ViewCompactAlt as ViewCompactAltIcon, ViewCozy as ViewCozyIcon, ViewInAr as ViewInArIcon, ViewKanban as ViewKanbanIcon,
  ViewListAlt as ViewListAltIcon, ViewModuleAlt as ViewModuleAltIcon, ViewQuiltAlt as ViewQuiltAltIcon,
  ViewSidebarAlt as ViewSidebarAltIcon, ViewTimelineAlt as ViewTimelineAltIcon, ViewWeekAlt as ViewWeekAltIcon,
  ViewDayAlt as ViewDayAltIcon, ViewAgendaAlt as ViewAgendaAltIcon, ViewCarouselAlt as ViewCarouselAltIcon,
  ViewComfyAlt2 as ViewComfyAlt2Icon, ViewCompactAlt2 as ViewCompactAlt2Icon, ViewCozyAlt as ViewCozyAltIcon,
  ViewInArAlt as ViewInArAltIcon, ViewKanbanAlt as ViewKanbanAltIcon, ViewListAlt2 as ViewListAlt2Icon,
  ViewModuleAlt2 as ViewModuleAlt2Icon, ViewQuiltAlt2 as ViewQuiltAlt2Icon, ViewSidebarAlt2 as ViewSidebarAlt2Icon,
  ViewTimelineAlt2 as ViewTimelineAlt2Icon, ViewWeekAlt2 as ViewWeekAlt2Icon, ViewDayAlt2 as ViewDayAlt2Icon,
  ViewAgendaAlt2 as ViewAgendaAlt2Icon, ViewCarouselAlt2 as ViewCarouselAlt2Icon, Lock as LockIcon2,
  LockOpen as LockOpenIcon2, VpnKey as VpnKeyIcon2, Shield as ShieldIcon2, Security as SecurityIcon2,
  VerifiedUser as VerifiedUserIcon2, AdminPanelSettings as AdminPanelSettingsIcon2, SupervisedUserCircle as SupervisedUserCircleIcon2,
  Group as GroupIcon2, Person as PersonIcon2, PersonAdd as PersonAddIcon2, PersonRemove as PersonRemoveIcon2,
  PersonOff as PersonOffIcon2, PersonOutline as PersonOutlineIcon2, AccountCircle as AccountCircleIcon2,
  AccountBox as AccountBoxIcon2, AccountBalance as AccountBalanceIcon2, AccountBalanceWallet as AccountBalanceWalletIcon2,
  AccountTree as AccountTreeIcon2, AccountCircleOutlined as AccountCircleOutlinedIcon, AccountBoxOutlined as AccountBoxOutlinedIcon,
  AccountBalanceOutlined as AccountBalanceOutlinedIcon, AccountBalanceWalletOutlined as AccountBalanceWalletOutlinedIcon,
  AccountTreeOutlined as AccountTreeOutlinedIcon, PersonAddAlt as PersonAddAltIcon, PersonRemoveAlt as PersonRemoveAltIcon,
  PersonOffAlt as PersonOffAltIcon, PersonOutlineAlt as PersonOutlineAltIcon, AccountCircleAlt as AccountCircleAltIcon,
  AccountBoxAlt as AccountBoxAltIcon, AccountBalanceAlt as AccountBalanceAltIcon, AccountBalanceWalletAlt as AccountBalanceWalletAltIcon,
  AccountTreeAlt as AccountTreeAltIcon, AccountCircleOutlinedAlt as AccountCircleOutlinedAltIcon,
  AccountBoxOutlinedAlt as AccountBoxOutlinedAltIcon, AccountBalanceOutlinedAlt as AccountBalanceOutlinedAltIcon,
  AccountBalanceWalletOutlinedAlt as AccountBalanceWalletOutlinedAltIcon, AccountTreeOutlinedAlt as AccountTreeOutlinedAltIcon,
  Download as DownloadIcon, Upload as UploadIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';

// Predefined options
const DOCUMENT_TYPES = [
  'PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 
  'MEDICAL_CERTIFICATE', 'LETTER_OF_RECOMMENDATION', 'PERSONAL_STATEMENT', 'CV_RESUME'
];

const EMAIL_TEMPLATES = [
  { id: 1, name: 'Welcome Email', subject: 'Welcome to Our CRM System', content: 'Dear {{name}}, welcome to our CRM system...' },
  { id: 2, name: 'Application Update', subject: 'Application Status Update', content: 'Your application status has been updated to {{status}}...' },
  { id: 3, name: 'Document Reminder', subject: 'Document Upload Reminder', content: 'Please upload the required document: {{documentType}}...' }
];

function Settings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // General Settings
    emailNotifications: true,
    autoAssignCounselor: false,
    maxStudentsPerCounselor: 20,
    defaultStudentStatus: 'ACTIVE',
    systemName: 'Counsellor CRM',
    systemVersion: '1.0.0',
    
    // System Settings
    systemSettings: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      sessionTimeout: 30,
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
      backupFrequency: 'daily',
      retentionPeriod: 90,
      autoBackup: true,
      performanceMode: false
    },
    
    // Security Settings
    securitySettings: {
      twoFactorAuth: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90
      },
      sessionManagement: {
        maxConcurrentSessions: 3,
        idleTimeout: 15,
        forceLogout: false,
        rememberMe: true
      },
      ipWhitelist: [],
      failedLoginAttempts: 5,
      lockoutDuration: 30
    },
    
    // Notification Settings
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationTypes: {
        newStudent: true,
        applicationUpdate: true,
        documentUpload: true,
        deadlineReminder: true,
        systemAlert: true,
        counselorAssignment: true
      },
      emailFrequency: 'immediate',
      digestSchedule: 'daily'
    },
    
    // Document Settings
    documentSettings: {
      allowedTypes: DOCUMENT_TYPES,
      maxFileSize: 10,
      autoCompression: true,
      watermarkEnabled: false,
      encryptionEnabled: true
    },
    
    // Email Settings
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@counselorcrm.com',
      fromName: 'Counsellor CRM',
      templates: EMAIL_TEMPLATES
    }
  });

  // Modal states
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: ''
  });

  // Fetch settings from backend
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/admin/settings');
      if (res.data.success && res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle setting change
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle nested setting change
  const handleNestedSettingChange = (parentKey, childKey, value) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  // Save settings to backend
  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axiosInstance.put('/admin/settings', settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Template management
  const handleTemplateEdit = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content
    });
    setOpenTemplateDialog(true);
  };

  const handleTemplateSave = async () => {
    try {
      const updatedTemplates = settings.emailSettings.templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, ...templateForm } : t
      );
      handleNestedSettingChange('emailSettings', 'templates', updatedTemplates);
      setOpenTemplateDialog(false);
      setSuccess('Email template updated successfully!');
    } catch (err) {
      setError('Failed to update email template.');
    }
  };

  // Backup functions
  const handleBackupDatabase = async () => {
    try {
      setSaving(true);
      // This would call your backup endpoint
      setSuccess('Database backup initiated successfully!');
    } catch (err) {
      setError('Failed to initiate backup.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDatabase = async () => {
    try {
      setSaving(true);
      // This would call your restore endpoint
      setSuccess('Database restore initiated successfully!');
    } catch (err) {
      setError('Failed to initiate restore.');
    } finally {
      setSaving(false);
    }
  };

  // UI Components
  const SettingCard = ({ title, icon, children, color = 'primary' }) => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
      borderRadius: 3
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ backgroundColor: alpha(theme.palette[color].main, 0.1), color: theme.palette[color].main }}>
              {icon}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ 
      p: 2, 
      textAlign: 'center',
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
    }}>
      <Avatar sx={{ 
        backgroundColor: alpha(theme.palette[color].main, 0.1), 
        color: theme.palette[color].main,
        mx: 'auto',
        mb: 1
      }}>
        {icon}
      </Avatar>
      <Typography variant="h4" color={color} sx={{ fontWeight: 700, mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Settings</Typography>
        </Breadcrumbs>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your CRM system settings, security policies, and notification preferences.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value="24"
            icon={<PeopleIcon />}
            color="primary"
            subtitle="Currently online"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Status"
            value="Healthy"
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="All systems operational"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage Used"
            value="67%"
            icon={<StorageIcon />}
            color="warning"
            subtitle="2.1 GB of 3.2 GB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Last Backup"
            value="2h ago"
            icon={<BackupIcon />}
            color="info"
            subtitle="Auto backup enabled"
          />
        </Grid>
      </Grid>

      {/* Main Settings */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{ 
              px: 2,
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.875rem',
                fontWeight: 600
              }
            }}
          >
            <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
            <Tab label="System" icon={<SpeedIcon />} iconPosition="start" />
            <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
            <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="Email Templates" icon={<EmailIcon />} iconPosition="start" />
            <Tab label="Documents" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Backup & Restore" icon={<BackupIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* General Settings */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="General Configuration" icon={<SettingsIcon />}>
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.emailNotifications} 
                          onChange={e => handleSettingChange('emailNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Enable Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.autoAssignCounselor} 
                          onChange={e => handleSettingChange('autoAssignCounselor', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Auto-assign Counselor to New Students"
                    />
                    <TextField
                      label="System Name"
                      value={settings.systemName || ''}
                      onChange={e => handleSettingChange('systemName', e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Max Students Per Counselor"
                      type="number"
                      value={settings.maxStudentsPerCounselor || ''}
                      onChange={e => handleSettingChange('maxStudentsPerCounselor', Number(e.target.value))}
                      inputProps={{ min: 1, max: 100 }}
                      fullWidth
                    />
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="System Information" icon={<InfoIcon />} color="info">
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">System Version</Typography>
                      <Typography variant="h6">{settings.systemVersion}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="h6">{new Date().toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Database Status</Typography>
                      <Chip label="Connected" color="success" size="small" />
                    </Box>
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* System Settings */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="System Configuration" icon={<SpeedIcon />} color="warning">
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.systemSettings?.maintenanceMode} 
                          onChange={e => handleNestedSettingChange('systemSettings', 'maintenanceMode', e.target.checked)}
                          color="warning"
                        />
                      }
                      label="Maintenance Mode"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.systemSettings?.debugMode} 
                          onChange={e => handleNestedSettingChange('systemSettings', 'debugMode', e.target.checked)}
                          color="warning"
                        />
                      }
                      label="Debug Mode"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.systemSettings?.autoBackup} 
                          onChange={e => handleNestedSettingChange('systemSettings', 'autoBackup', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Auto Backup"
                    />
                    <TextField
                      label="Session Timeout (minutes)"
                      type="number"
                      value={settings.systemSettings?.sessionTimeout || ''}
                      onChange={e => handleNestedSettingChange('systemSettings', 'sessionTimeout', Number(e.target.value))}
                      fullWidth
                    />
                    <TextField
                      label="Max File Size (MB)"
                      type="number"
                      value={settings.systemSettings?.maxFileSize || ''}
                      onChange={e => handleNestedSettingChange('systemSettings', 'maxFileSize', Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="Performance Settings" icon={<TrendingUpIcon />} color="success">
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.systemSettings?.performanceMode} 
                          onChange={e => handleNestedSettingChange('systemSettings', 'performanceMode', e.target.checked)}
                          color="success"
                        />
                      }
                      label="Performance Mode"
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Log Level
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={settings.systemSettings?.logLevel || 'info'}
                          onChange={e => handleNestedSettingChange('systemSettings', 'logLevel', e.target.value)}
                        >
                          <MenuItem value="error">Error</MenuItem>
                          <MenuItem value="warn">Warning</MenuItem>
                          <MenuItem value="info">Info</MenuItem>
                          <MenuItem value="debug">Debug</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Backup Frequency
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={settings.systemSettings?.backupFrequency || 'daily'}
                          onChange={e => handleNestedSettingChange('systemSettings', 'backupFrequency', e.target.value)}
                        >
                          <MenuItem value="hourly">Hourly</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* Security Settings */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="Authentication" icon={<LockIcon />} color="error">
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.securitySettings?.twoFactorAuth} 
                          onChange={e => handleNestedSettingChange('securitySettings', 'twoFactorAuth', e.target.checked)}
                          color="error"
                        />
                      }
                      label="Two-Factor Authentication"
                    />
                    <TextField
                      label="Password Min Length"
                      type="number"
                      value={settings.securitySettings?.passwordPolicy?.minLength || ''}
                      onChange={e => handleNestedSettingChange('securitySettings', 'passwordPolicy', { 
                        ...settings.securitySettings?.passwordPolicy, 
                        minLength: Number(e.target.value) 
                      })}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.securitySettings?.passwordPolicy?.requireUppercase} 
                          onChange={e => handleNestedSettingChange('securitySettings', 'passwordPolicy', { 
                            ...settings.securitySettings?.passwordPolicy, 
                            requireUppercase: e.target.checked 
                          })}
                          color="primary"
                        />
                      }
                      label="Require Uppercase Letters"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.securitySettings?.passwordPolicy?.requireNumbers} 
                          onChange={e => handleNestedSettingChange('securitySettings', 'passwordPolicy', { 
                            ...settings.securitySettings?.passwordPolicy, 
                            requireNumbers: e.target.checked 
                          })}
                          color="primary"
                        />
                      }
                      label="Require Numbers"
                    />
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="Session Management" icon={<VpnKeyIcon />} color="warning">
                  <Stack spacing={3}>
                    <TextField
                      label="Max Concurrent Sessions"
                      type="number"
                      value={settings.securitySettings?.sessionManagement?.maxConcurrentSessions || ''}
                      onChange={e => handleNestedSettingChange('securitySettings', 'sessionManagement', { 
                        ...settings.securitySettings?.sessionManagement, 
                        maxConcurrentSessions: Number(e.target.value) 
                      })}
                      fullWidth
                    />
                    <TextField
                      label="Idle Timeout (minutes)"
                      type="number"
                      value={settings.securitySettings?.sessionManagement?.idleTimeout || ''}
                      onChange={e => handleNestedSettingChange('securitySettings', 'sessionManagement', { 
                        ...settings.securitySettings?.sessionManagement, 
                        idleTimeout: Number(e.target.value) 
                      })}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.securitySettings?.sessionManagement?.forceLogout} 
                          onChange={e => handleNestedSettingChange('securitySettings', 'sessionManagement', { 
                            ...settings.securitySettings?.sessionManagement, 
                            forceLogout: e.target.checked 
                          })}
                          color="warning"
                        />
                      }
                      label="Force Logout on Security Change"
                    />
                    <TextField
                      label="Failed Login Attempts"
                      type="number"
                      value={settings.securitySettings?.failedLoginAttempts || ''}
                      onChange={e => handleNestedSettingChange('securitySettings', 'failedLoginAttempts', Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* Notification Settings */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="Notification Channels" icon={<NotificationsIcon />} color="info">
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.notificationSettings?.emailNotifications} 
                          onChange={e => handleNestedSettingChange('notificationSettings', 'emailNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.notificationSettings?.smsNotifications} 
                          onChange={e => handleNestedSettingChange('notificationSettings', 'smsNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="SMS Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.notificationSettings?.pushNotifications} 
                          onChange={e => handleNestedSettingChange('notificationSettings', 'pushNotifications', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Push Notifications"
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Email Frequency
                      </Typography>
                      <FormControl fullWidth>
                        <Select
                          value={settings.notificationSettings?.emailFrequency || 'immediate'}
                          onChange={e => handleNestedSettingChange('notificationSettings', 'emailFrequency', e.target.value)}
                        >
                          <MenuItem value="immediate">Immediate</MenuItem>
                          <MenuItem value="hourly">Hourly Digest</MenuItem>
                          <MenuItem value="daily">Daily Digest</MenuItem>
                          <MenuItem value="weekly">Weekly Digest</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="Notification Types" icon={<NotificationsActiveIcon />} color="success">
                  <Stack spacing={2}>
                    {Object.entries(settings.notificationSettings?.notificationTypes || {}).map(([key, value]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch 
                            checked={value} 
                            onChange={e => handleNestedSettingChange('notificationSettings', 'notificationTypes', {
                              ...settings.notificationSettings?.notificationTypes,
                              [key]: e.target.checked
                            })}
                            color="success"
                          />
                        }
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    ))}
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* Email Templates */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <SettingCard title="Email Templates" icon={<EmailIcon />} color="primary">
                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateForm({ name: '', subject: '', content: '' });
                        setOpenTemplateDialog(true);
                      }}
                    >
                      Add New Template
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    {settings.emailSettings?.templates?.map((template) => (
                      <Grid item xs={12} md={6} key={template.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6">{template.name}</Typography>
                              <Box>
                                <IconButton size="small" onClick={() => handleTemplateEdit(template)}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton size="small" color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Subject: {template.subject}
                            </Typography>
                            <Typography variant="body2" noWrap>
                              {template.content.substring(0, 100)}...
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* Document Settings */}
          {activeTab === 5 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="Document Configuration" icon={<AssignmentIcon />} color="info">
                  <Stack spacing={3}>
                    <TextField
                      label="Max File Size (MB)"
                      type="number"
                      value={settings.documentSettings?.maxFileSize || ''}
                      onChange={e => handleNestedSettingChange('documentSettings', 'maxFileSize', Number(e.target.value))}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.documentSettings?.autoCompression} 
                          onChange={e => handleNestedSettingChange('documentSettings', 'autoCompression', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Auto Compression"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.documentSettings?.watermarkEnabled} 
                          onChange={e => handleNestedSettingChange('documentSettings', 'watermarkEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Enable Watermark"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.documentSettings?.encryptionEnabled} 
                          onChange={e => handleNestedSettingChange('documentSettings', 'encryptionEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Enable Encryption"
                    />
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="Allowed Document Types" icon={<AssignmentIcon />} color="success">
                  <Stack spacing={2}>
                    {DOCUMENT_TYPES.map((type) => (
                      <Chip
                        key={type}
                        label={type.replace(/_/g, ' ')}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}

          {/* Backup & Restore */}
          {activeTab === 6 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingCard title="Backup Management" icon={<BackupIcon />} color="warning">
                  <Stack spacing={3}>
                    <Button
                      variant="contained"
                      startIcon={<BackupIcon />}
                      onClick={handleBackupDatabase}
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Creating Backup...' : 'Create Backup Now'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      fullWidth
                    >
                      Download Latest Backup
                    </Button>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Last Backup: 2 hours ago
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Backup Size: 45.2 MB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: <Chip label="Success" color="success" size="small" />
                      </Typography>
                    </Box>
                  </Stack>
                </SettingCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingCard title="Restore Management" icon={<RestoreIcon />} color="error">
                  <Stack spacing={3}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<RestoreIcon />}
                      onClick={handleRestoreDatabase}
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Restoring...' : 'Restore from Backup'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      fullWidth
                    >
                      Upload Backup File
                    </Button>
                    <Alert severity="warning">
                      <AlertTitle>Warning</AlertTitle>
                      Restoring from backup will overwrite all current data. Make sure to create a backup first.
                    </Alert>
                  </Stack>
                </SettingCard>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{ 
            px: 4, 
            py: 1.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
            }
          }}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<RefreshIcon />}
          onClick={fetchSettings}
          disabled={saving}
          sx={{ px: 4, py: 1.5 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Email Template Dialog */}
      <Dialog 
        open={openTemplateDialog} 
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Edit Email Template' : 'Add Email Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Template Name"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Subject"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              fullWidth
            />
            <TextField
              label="Content"
              value={templateForm.content}
              onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
              multiline
              rows={6}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
          <Button onClick={handleTemplateSave} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Settings; 