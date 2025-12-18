import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  Stack,
  Avatar,
  Divider,
  LinearProgress,
  Skeleton,
  CardActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Collapse,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PieChart as ChartIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Verified as VerifiedIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Tune as TuneIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  GridView as GridViewIcon,
  List as ListIcon,
  Apps as AppsIcon,
  ViewColumn as ViewColumnIcon,
  ViewHeadline as ViewHeadlineIcon,
  ViewStream as ViewStreamIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewAgenda as ViewAgendaIcon,
  ViewCarousel as ViewCarouselIcon,
  ViewQuilt as ViewQuiltIcon,
  ViewSidebar as ViewSidebarIcon,
  ViewTimeline as ViewTimelineIcon,
  ViewComfyAlt as ViewComfyAltIcon,
  ViewCompact as ViewCompactIcon,
  ViewCompactAlt as ViewCompactAltIcon,
  ViewCozy as ViewCozyIcon,
  ViewInAr as ViewInArIcon,
  ViewKanban as ViewKanbanIcon,
  ViewListAlt as ViewListAltIcon,
  ViewModuleAlt as ViewModuleAltIcon,
  ViewQuiltAlt as ViewQuiltAltIcon,
  ViewSidebarAlt as ViewSidebarAltIcon,
  ViewTimelineAlt as ViewTimelineAltIcon,
  ViewWeekAlt as ViewWeekAltIcon,
  ViewDayAlt as ViewDayAltIcon,
  ViewAgendaAlt as ViewAgendaAltIcon,
  ViewCarouselAlt as ViewCarouselAltIcon,
  ViewComfyAlt2 as ViewComfyAlt2Icon,
  ViewCompactAlt2 as ViewCompactAlt2Icon,
  ViewCozyAlt as ViewCozyAltIcon,
  ViewInArAlt as ViewInArAltIcon,
  ViewKanbanAlt as ViewKanbanAltIcon,
  ViewListAlt2 as ViewListAlt2Icon,
  ViewModuleAlt2 as ViewModuleAlt2Icon,
  ViewQuiltAlt2 as ViewQuiltAlt2Icon,
  ViewSidebarAlt2 as ViewSidebarAlt2Icon,
  ViewTimelineAlt2 as ViewTimelineAlt2Icon,
  ViewWeekAlt2 as ViewWeekAlt2Icon,
  ViewDayAlt2 as ViewDayAlt2Icon,
  ViewAgendaAlt2 as ViewAgendaAlt2Icon,
  ViewCarouselAlt2 as ViewCarouselAlt2Icon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  InsertChart as InsertChartIcon,
  BubbleChart as BubbleChartIcon,
  ScatterPlot as ScatterPlotIcon,
  MultilineChart as MultilineChartIcon,
  ShowChartOutlined as ShowChartOutlinedIcon,
  InsertChartOutlined as InsertChartOutlinedIcon,
  BubbleChartOutlined as BubbleChartOutlinedIcon,
  ScatterPlotOutlined as ScatterPlotOutlinedIcon,
  MultilineChartOutlined as MultilineChartOutlinedIcon,
  PieChartOutlined as PieChartOutlinedIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  TimelineOutlined as TimelineOutlinedIcon,
  AssessmentOutlined as AssessmentOutlinedIcon,
  SchoolOutlined as SchoolOutlinedIcon,
  DownloadOutlined as DownloadOutlinedIcon,
  RefreshOutlined as RefreshOutlinedIcon,
  PieChartAlt as PieChartAltIcon,
  TimelineAlt as TimelineAltIcon,
  AssessmentAlt as AssessmentAltIcon,
  SchoolAlt as SchoolAltIcon,
  DownloadAlt as DownloadAltIcon,
  RefreshAlt as RefreshAltIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axiosInstance from '../../utils/axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Reports() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState('monthly');
  const [exportType, setExportType] = useState('students'); // New state for export type
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState({
    studentStats: [],
    applicationStats: [],
    counselorPerformance: [],
    universityStats: []
  });
  const [filters, setFilters] = useState({
    counselor: 'all',
    university: 'all',
    status: 'all',
    phase: 'all'
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching report data with params:', {
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await axiosInstance.get('/admin/reports', {
        params: {
          type: reportType,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      console.log('Report data response:', response.data);
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Failed to load report data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const handleExportReport = async (format = 'csv') => {
    try {
      console.log('Exporting report with params:', {
        type: exportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        format
      });
      
      const response = await axiosInstance.get('/admin/reports/export', {
        params: {
          type: exportType, // Use exportType instead of reportType
          startDate: dateRange.start,
          endDate: dateRange.end,
          format
        },
        responseType: 'blob'
      });
      
      console.log('Export response received:', response.status, response.headers);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_report_${format}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      let errorMessage = 'Failed to export report. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid report type or parameters.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Export endpoint not found.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while generating report.';
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 56,
                height: 56
              }}
            >
              <AssessmentIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Reports & Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Comprehensive reports and insights for data-driven decision making
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <TextField
              select
              label="Export Report Type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="students">Students</MenuItem>
              <MenuItem value="applications">Applications</MenuItem>
              <MenuItem value="counselors">Counselors</MenuItem>
              <MenuItem value="documents">Documents</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReportData}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('csv')}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('json')}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
              }}
            >
              Export JSON
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': { fontSize: '1.5rem' }
            }}
            action={
              <Button color="inherit" size="small" onClick={() => setError(null)}>
                Dismiss
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Report Controls */}
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Report Configuration
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                size="small"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<SearchIcon />}
                onClick={fetchReportData}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  py: 1.5
                }}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 64
              }
            }}
          >
            <Tab 
              icon={<AssessmentIcon />} 
              label="Overview" 
              iconPosition="start"
            />
            <Tab 
              icon={<PeopleIcon />} 
              label="Students" 
              iconPosition="start"
            />
            <Tab 
              icon={<SchoolIcon />} 
              label="Universities" 
              iconPosition="start"
            />
            <Tab 
              icon={<PsychologyIcon />} 
              label="Counselors" 
              iconPosition="start"
            />
            <Tab 
              icon={<TimelineIcon />} 
              label="Applications" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Student Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Student Statistics"
                avatar={<ChartIcon color="primary" />}
                action={
                  <IconButton onClick={fetchReportData}>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.studentStats?.map(stat => ({
                          name: stat.currentPhase,
                          value: stat.count
                        })) || []}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {(reportData.studentStats || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Application Statistics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Application Statistics"
                avatar={<TimelineIcon color="primary" />}
                action={
                  <IconButton onClick={fetchReportData}>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.applicationStats?.map(stat => ({
                      name: stat.applicationStatus,
                      value: stat.count
                    })) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Counselor Performance */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Counselor Performance"
                avatar={<AssessmentIcon color="primary" />}
              />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Counselor</TableCell>
                        <TableCell align="right">Total Students</TableCell>
                        <TableCell align="right">Active Applications</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Avg. Response Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(reportData.counselorPerformance || []).map((counselor) => (
                        <TableRow key={counselor.id}>
                          <TableCell>{counselor.name}</TableCell>
                          <TableCell align="right">{counselor.totalStudents || 0}</TableCell>
                          <TableCell align="right">{counselor.activeApplications || 0}</TableCell>
                          <TableCell align="right">{counselor.successRate || 0}%</TableCell>
                          <TableCell align="right">{counselor.avgResponseTime || 0} hours</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* University Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="University Statistics"
                avatar={<SchoolIcon color="primary" />}
              />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.universityStats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Total Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              {/* Student Phase Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Student Phase Distribution"
                    avatar={<PeopleIcon color="primary" />}
                  />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.studentStats?.map(stat => ({
                              name: stat.currentPhase?.replace(/_/g, ' ') || 'Unknown',
                              value: stat.count
                            })) || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(reportData.studentStats || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Student Statistics Table */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Student Statistics"
                    avatar={<AssessmentIcon color="primary" />}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Phase</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.studentStats || []).map((stat) => {
                            const total = (reportData.studentStats || []).reduce((sum, s) => sum + s.count, 0);
                            const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : 0;
                            return (
                              <TableRow key={stat.currentPhase}>
                                <TableCell>{stat.currentPhase?.replace(/_/g, ' ') || 'Unknown'}</TableCell>
                                <TableCell align="right">{stat.count}</TableCell>
                                <TableCell align="right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              {/* University Distribution Chart */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader
                    title="University Application Distribution"
                    avatar={<SchoolIcon color="primary" />}
                  />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.universityStats || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <ChartTooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#8884d8" name="Applications" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* University Statistics */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader
                    title="University Summary"
                    avatar={<AssessmentIcon color="primary" />}
                  />
                  <CardContent>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {(reportData.universityStats || []).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Universities with Applications
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Top Universities
                      </Typography>
                      {(reportData.universityStats || []).slice(0, 5).map((uni, index) => (
                        <Box key={uni.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{index + 1}. {uni.name}</Typography>
                          <Typography variant="body2" color="primary">{uni.count}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              {/* Counselor Performance Table */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Counselor Performance Overview"
                    avatar={<PsychologyIcon color="primary" />}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Counselor</TableCell>
                            <TableCell align="right">Total Students</TableCell>
                            <TableCell align="right">Active Applications</TableCell>
                            <TableCell align="right">Success Rate</TableCell>
                            <TableCell align="right">Performance Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.counselorPerformance || []).map((counselor) => (
                            <TableRow key={counselor.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                    {counselor.name?.charAt(0) || 'C'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {counselor.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {counselor.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{counselor.totalStudents || 0}</TableCell>
                              <TableCell align="right">{counselor.activeApplications || 0}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${counselor.successRate || 0}%`}
                                  color={counselor.successRate >= 80 ? 'success' : counselor.successRate >= 60 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <LinearProgress 
                                  variant="determinate" 
                                  value={counselor.successRate || 0}
                                  sx={{ width: 60, height: 8, borderRadius: 4 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 4 && (
            <Grid container spacing={3}>
              {/* Application Status Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Application Status Distribution"
                    avatar={<TimelineIcon color="primary" />}
                  />
                  <CardContent>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.applicationStats?.map(stat => ({
                              name: stat.applicationStatus?.replace(/_/g, ' ') || 'Unknown',
                              value: stat.count
                            })) || []}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {(reportData.applicationStats || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Application Statistics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Application Statistics"
                    avatar={<AssessmentIcon color="primary" />}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.applicationStats || []).map((stat) => {
                            const total = (reportData.applicationStats || []).reduce((sum, s) => sum + s.count, 0);
                            const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : 0;
                            return (
                              <TableRow key={stat.applicationStatus}>
                                <TableCell>{stat.applicationStatus?.replace(/_/g, ' ') || 'Unknown'}</TableCell>
                                <TableCell align="right">{stat.count}</TableCell>
                                <TableCell align="right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default Reports; 