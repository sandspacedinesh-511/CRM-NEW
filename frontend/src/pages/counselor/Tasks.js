import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Divider,
  Grid,
  useTheme,
  Fade,
  Grow,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  InputAdornment,
  Switch,
  FormControlLabel,
  Snackbar,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  Assignment as TaskIcon,
  Flag as PriorityIcon,
  Schedule as DeadlineIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import axiosInstance from '../../utils/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'success' },
  { value: 'MEDIUM', label: 'Medium', color: 'info' },
  { value: 'HIGH', label: 'High', color: 'warning' },
  { value: 'URGENT', label: 'Urgent', color: 'error' }
];

const TASK_TYPES = [
  { value: 'DOCUMENT_COLLECTION', label: 'Document Collection', color: 'primary' },
  { value: 'APPLICATION_DEADLINE', label: 'Application Deadline', color: 'secondary' },
  { value: 'INTERVIEW_PREPARATION', label: 'Interview Preparation', color: 'success' },
  { value: 'VISA_PROCESS', label: 'Visa Process', color: 'warning' },
  { value: 'GENERAL', label: 'General', color: 'default' }
];


const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'OVERDUE', label: 'Overdue' }
];

const SORT_OPTIONS = [
  { value: 'dueDate_asc', label: 'Due Date (Earliest)' },
  { value: 'dueDate_desc', label: 'Due Date (Latest)' },
  { value: 'priority_desc', label: 'Priority (High to Low)' },
  { value: 'priority_asc', label: 'Priority (Low to High)' },
  { value: 'created_asc', label: 'Created (Oldest)' },
  { value: 'created_desc', label: 'Created (Newest)' }
];

// Utility functions
const getPriorityColor = (priority) => {
  const priorityObj = PRIORITY_LEVELS.find(p => p.value === priority);
  return priorityObj ? priorityObj.color : 'default';
};

const getTypeColor = (type) => {
  const typeObj = TASK_TYPES.find(t => t.value === type);
  return typeObj ? typeObj.color : 'default';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'info';
    case 'PENDING': return 'warning';
    case 'OVERDUE': return 'error';
    default: return 'default';
  }
};

const isOverdue = (dueDate) => {
  return isBefore(new Date(dueDate), new Date()) && !isAfter(new Date(dueDate), new Date());
};

const isDueSoon = (dueDate) => {
  const daysUntilDue = differenceInDays(new Date(dueDate), new Date());
  return daysUntilDue <= 3 && daysUntilDue >= 0;
};

function Tasks() {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedTask, setSelectedTask] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('dueDate_asc');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    type: 'GENERAL',
    studentId: '',
    status: 'PENDING',
    reminder: false,
    reminderDate: ''
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/tasks', {
        params: {
          search: searchQuery,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          type: typeFilter === 'ALL' ? undefined : typeFilter,
          sort: sortBy,
          includeCompleted: showCompleted
        }
      });
      
      if (response.data.success) {
        setTasks(response.data.data?.tasks || []);
      } else {
        setTasks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again later.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await axiosInstance.get('/counselor/students');
      if (response.data.success) {
        setStudents(response.data.data?.students || []);
      } else {
        setStudents(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStudents();
  }, [searchQuery, statusFilter, priorityFilter, typeFilter, sortBy, showCompleted]);

  // Debug openDialog state changes
  useEffect(() => {
    console.log('openDialog state changed to:', openDialog);
  }, [openDialog]);

  const handleOpenDialog = (mode, task = null) => {
    console.log('handleOpenDialog called with mode:', mode, 'task:', task);
    setDialogMode(mode);
    setSelectedTask(task);
    if (task) {
      const editFormData = {
        title: task.title,
        description: task.description,
        dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
        priority: task.priority,
        type: task.type,
        studentId: task.studentId || '',
        status: task.status,
        reminder: task.reminder || false,
        reminderDate: task.reminderDate ? format(new Date(task.reminderDate), 'yyyy-MM-dd') : ''
      };
      console.log('Setting edit form data:', editFormData);
      setFormData(editFormData);
    } else {
      const defaultFormData = {
        title: '',
        description: '',
        dueDate: '',
        priority: 'MEDIUM',
        type: 'GENERAL',
        studentId: '',
        status: 'PENDING',
        reminder: false,
        reminderDate: ''
      };
      console.log('Setting default form data:', defaultFormData);
      setFormData(defaultFormData);
    }
    console.log('Setting openDialog to true');
    setOpenDialog(true);
    console.log('openDialog state should now be true');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'MEDIUM',
      type: 'GENERAL',
      studentId: '',
      status: 'PENDING',
      reminder: false,
      reminderDate: ''
    });
  };

  const showSuccessMessage = (message) => {
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });
  };

  const showErrorMessage = (message) => {
    setSnackbar({
      open: true,
      message: message,
      severity: 'error'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    try {
      if (dialogMode === 'add') {
        console.log('Creating new task...');
        const response = await axiosInstance.post('/counselor/tasks', formData);
        console.log('Task created successfully:', response.data);
        showSuccessMessage('Task created successfully!');
      } else {
        console.log('Updating task...');
        const response = await axiosInstance.put(`/counselor/tasks/${selectedTask.id}`, formData);
        console.log('Task updated successfully:', response.data);
        showSuccessMessage('Task updated successfully!');
      }
      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = `Failed to save task: ${error.response?.data?.message || error.message}`;
      setError(errorMsg);
      showErrorMessage(errorMsg);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/counselor/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await axiosInstance.patch(`/counselor/tasks/${taskId}`, {
        status: 'COMPLETED'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task. Please try again.');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTasks.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await axiosInstance.delete('/counselor/tasks/bulk', {
          data: { taskIds: selectedTasks }
        });
      } else if (bulkAction === 'complete') {
        await axiosInstance.patch('/counselor/tasks/bulk-complete', {
          taskIds: selectedTasks
        });
      }
      
      setSelectedTasks([]);
      setBulkActionDialog(false);
      setBulkAction('');
      fetchTasks();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action. Please try again.');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('dueDate_asc');
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate)).length;
    const dueSoon = tasks.filter(t => isDueSoon(t.dueDate) && t.status !== 'COMPLETED').length;
    
    return { total, pending, completed, overdue, dueSoon };
  };

  const stats = getTaskStats();

  const groupedTasks = {
    overdue: tasks.filter(task => isOverdue(task.dueDate) && task.status !== 'COMPLETED'),
    dueSoon: tasks.filter(task => isDueSoon(task.dueDate) && task.status !== 'COMPLETED'),
    pending: tasks.filter(task => task.status === 'PENDING' && !isOverdue(task.dueDate) && !isDueSoon(task.dueDate)),
    inProgress: tasks.filter(task => task.status === 'IN_PROGRESS'),
    completed: tasks.filter(task => task.status === 'COMPLETED')
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );

  if (loading && tasks.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LoadingSkeleton />
        </Box>
      </Container>
    );
  }

  return (
    <>
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 4,
            p: 4,
            mb: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              flexWrap: 'wrap',
              gap: 3
            }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    lineHeight: 1.2
                  }}
                >
                  Task Management
                </Typography>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 3, opacity: 0.8, fontWeight: 400 }}>
                  Organize and track your tasks and deadlines efficiently
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<TaskIcon />} 
                    label={`${stats.total} Total Tasks`} 
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontWeight: 600,
                      height: 32
                    }}
                  />
                  {stats.overdue > 0 && (
                    <Chip 
                      label={`${stats.overdue} Overdue`}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchTasks}
                  sx={{ 
                    borderRadius: 3, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('add')}
                  sx={{
                    borderRadius: 3, 
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Add Task
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Fade in={true} timeout={800}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.primary.main,
                    mb: 1
                  }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Total Tasks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                boxShadow: `0 2px 12px ${alpha(theme.palette.warning.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.15)}`,
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.warning.main,
                    mb: 1
                  }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                boxShadow: `0 2px 12px ${alpha(theme.palette.error.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.error.main, 0.15)}`,
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.error.main,
                    mb: 1
                  }}>
                    {stats.overdue}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                boxShadow: `0 2px 12px ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.15)}`,
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.info.main,
                    mb: 1
                  }}>
                    {stats.dueSoon}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Due Soon
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                boxShadow: `0 2px 12px ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.15)}`,
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.success.main,
                    mb: 1
                  }}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Filters */}
        <Fade in={true} timeout={1000}>
          <Paper sx={{ 
            elevation: 0,
            p: 4,
            mb: 4,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.grey[200], 0.5)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.3)} 0%, ${alpha(theme.palette.common.white, 0.9)} 100%)`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: '4px 4px 0 0'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FilterIcon />
                Filters & Search
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: theme.palette.primary.main,
                          '& + .MuiSwitch-track': {
                            backgroundColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                  }
                  label="Show Completed"
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontWeight: 500,
                      color: theme.palette.text.primary
                    } 
                  }}
                />
                <Button
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? "contained" : "outlined"}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    ...(showFilters ? {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    } : {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      }
                    })
                  }}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    borderColor: alpha(theme.palette.grey[400], 0.5),
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      borderColor: theme.palette.grey[400],
                      backgroundColor: alpha(theme.palette.grey[400], 0.05),
                    }
                  }}
                >
                  Clear All
                </Button>
              </Box>
              </Box>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: theme.palette.primary.main }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.common.white, 0.8),
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                          boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
                        }
                      }
                    }}
                  />
                </Grid>
                
                {showFilters && (
                  <>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Status"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value)}
                          label="Priority"
                        >
                          <MenuItem value="ALL">All Priorities</MenuItem>
                          {PRIORITY_LEVELS.map((priority) => (
                            <MenuItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          label="Type"
                        >
                          <MenuItem value="ALL">All Types</MenuItem>
                          {TASK_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          label="Sort By"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
          </Paper>
        </Fade>

        {/* Bulk Actions */}
        {selectedTasks.length > 0 && (
          <Fade in={true} timeout={800}>
            <Card sx={{ mb: 3, backgroundColor: theme.palette.primary[50] }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {selectedTasks.length} task(s) selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setBulkActionDialog(true)}
                    >
                      Bulk Actions
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedTasks([])}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Tasks Tabs */}
        <Grow in={true} timeout={1200}>
          <Box>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ 
                mb: 4,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    color: theme.palette.primary.main,
                  }
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>All Tasks</span>
                    <Badge badgeContent={stats.total} color="primary" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Overdue</span>
                    <Badge badgeContent={stats.overdue} color="error" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Due Soon</span>
                    <Badge badgeContent={stats.dueSoon} color="warning" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Completed</span>
                    <Badge badgeContent={stats.completed} color="success" />
                  </Box>
                } 
              />
            </Tabs>

            {/* Task Lists */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                {groupedTasks.overdue.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      border: `2px solid ${theme.palette.error.main}`, 
                      mb: 3,
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.02)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                      }
                    }}>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 3,
                          p: 2,
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          borderRadius: 3,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                        }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.error.main,
                            color: 'white'
                          }}>
                            <WarningIcon />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.error.main, 
                              fontWeight: 700,
                              mb: 0.5
                            }}>
                              Overdue Tasks ({groupedTasks.overdue.length})
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              These tasks require immediate attention
                            </Typography>
                          </Box>
                        </Box>
                        <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                          {groupedTasks.overdue.map((task) => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              students={students}
                              onEdit={() => handleOpenDialog('edit', task)}
                              onDelete={() => handleDelete(task.id)}
                              onComplete={() => handleComplete(task.id)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={() => handleSelectTask(task.id)}
                              isOverdue={true}
                            />
                          ))}
                        </List>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {groupedTasks.dueSoon.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      border: `2px solid ${theme.palette.warning.main}`, 
                      mb: 3,
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.02)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                      }
                    }}>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 3,
                          p: 2,
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          borderRadius: 3,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                        }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.warning.main,
                            color: 'white'
                          }}>
                            <DeadlineIcon />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.warning.main, 
                              fontWeight: 700,
                              mb: 0.5
                            }}>
                              Due Soon ({groupedTasks.dueSoon.length})
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Tasks approaching their deadline
                            </Typography>
                          </Box>
                        </Box>
                        <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                          {groupedTasks.dueSoon.map((task) => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              students={students}
                              onEdit={() => handleOpenDialog('edit', task)}
                              onDelete={() => handleDelete(task.id)}
                              onComplete={() => handleComplete(task.id)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={() => handleSelectTask(task.id)}
                              isDueSoon={true}
                            />
                          ))}
                        </List>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {groupedTasks.pending.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ 
                      mb: 3,
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.grey[200], 0.5)}`,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.3)} 0%, ${alpha(theme.palette.common.white, 0.9)} 100%)`,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ p: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          mb: 3,
                          p: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          borderRadius: 3,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.primary.main,
                            color: 'white'
                          }}>
                            <PendingIcon />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ 
                              color: theme.palette.primary.main, 
                              fontWeight: 700,
                              mb: 0.5
                            }}>
                              Pending Tasks ({groupedTasks.pending.length})
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Tasks waiting to be started
                            </Typography>
                          </Box>
                        </Box>
                        <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                          {groupedTasks.pending.map((task) => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              students={students}
                              onEdit={() => handleOpenDialog('edit', task)}
                              onDelete={() => handleDelete(task.id)}
                              onComplete={() => handleComplete(task.id)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={() => handleSelectTask(task.id)}
                            />
                          ))}
                        </List>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {groupedTasks.inProgress.length > 0 && (
                  <Grid item xs={12}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            In Progress ({groupedTasks.inProgress.length})
                        </Typography>
                        <List>
                          {groupedTasks.inProgress.map((task) => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              students={students}
                              onEdit={() => handleOpenDialog('edit', task)}
                              onDelete={() => handleDelete(task.id)}
                              onComplete={() => handleComplete(task.id)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={() => handleSelectTask(task.id)}
                            />
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {showCompleted && groupedTasks.completed.length > 0 && (
                  <Grid item xs={12}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Completed ({groupedTasks.completed.length})
                        </Typography>
                        <List>
                          {groupedTasks.completed.map((task) => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              students={students}
                              onEdit={() => handleOpenDialog('edit', task)}
                              onDelete={() => handleDelete(task.id)}
                              onComplete={() => handleComplete(task.id)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={() => handleSelectTask(task.id)}
                              isCompleted={true}
                            />
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}

            {tabValue === 1 && (
              <Card>
                <CardContent>
                  <List>
                    {groupedTasks.overdue.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        students={students}
                        onEdit={() => handleOpenDialog('edit', task)}
                        onDelete={() => handleDelete(task.id)}
                        onComplete={() => handleComplete(task.id)}
                        selected={selectedTasks.includes(task.id)}
                        onSelect={() => handleSelectTask(task.id)}
                        isOverdue={true}
                      />
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {tabValue === 2 && (
              <Card>
                <CardContent>
                  <List>
                    {groupedTasks.dueSoon.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        students={students}
                        onEdit={() => handleOpenDialog('edit', task)}
                        onDelete={() => handleDelete(task.id)}
                        onComplete={() => handleComplete(task.id)}
                        selected={selectedTasks.includes(task.id)}
                        onSelect={() => handleSelectTask(task.id)}
                        isDueSoon={true}
                      />
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {tabValue === 3 && (
              <Card>
                <CardContent>
                  <List>
                    {groupedTasks.completed.map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        students={students}
                        onEdit={() => handleOpenDialog('edit', task)}
                        onDelete={() => handleDelete(task.id)}
                        onComplete={() => handleComplete(task.id)}
                        selected={selectedTasks.includes(task.id)}
                        onSelect={() => handleSelectTask(task.id)}
                        isCompleted={true}
                      />
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {tasks.length === 0 && !loading && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.text.secondary
              }}>
                <TaskIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No tasks found
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by creating your first task'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('add')}
                >
                  Add Task
                </Button>
              </Box>
            )}
          </Box>
        </Grow>
      </Box>
    </Container>

    {/* Add/Edit Task Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {dialogMode === 'add' ? 'Add New Task' : 'Edit Task'}
          </DialogTitle>
          <DialogContent>
            {/* Debug info - remove this after testing */}
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Debug - Current form data: {JSON.stringify(formData, null, 2)}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={formData.priority}
                    onChange={(e) => {
                      console.log('Priority changed to:', e.target.value);
                      setFormData({ ...formData, priority: e.target.value });
                    }}
                    label="Priority"
                  >
                    {PRIORITY_LEVELS.map((priority) => {
                      console.log('Rendering priority option:', priority);
                      return (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="type-label">Type</InputLabel>
                  <Select
                    labelId="type-label"
                    value={formData.type}
                    onChange={(e) => {
                      console.log('Type changed to:', e.target.value);
                      setFormData({ ...formData, type: e.target.value });
                    }}
                    label="Type"
                  >
                    {TASK_TYPES.map((type) => {
                      console.log('Rendering type option:', type);
                      return (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="student-label">Student (Optional)</InputLabel>
                  <Select
                    labelId="student-label"
                    value={formData.studentId}
                    onChange={(e) => {
                      console.log('Student changed to:', e.target.value);
                      setFormData({ ...formData, studentId: e.target.value });
                    }}
                    label="Student (Optional)"
                  >
                    <MenuItem value="">None</MenuItem>
                    {students.map((student) => {
                      console.log('Rendering student option:', student);
                      return (
                        <MenuItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.reminder}
                      onChange={(e) => setFormData({ ...formData, reminder: e.target.checked })}
                    />
                  }
                  label="Set Reminder"
                />
              </Grid>
              {formData.reminder && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reminder Date"
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {dialogMode === 'add' ? 'Add Task' : 'Update Task'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            What would you like to do with {selectedTasks.length} selected task(s)?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="complete">Mark as Completed</MenuItem>
              <MenuItem value="delete">Delete Tasks</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button 
            type="button"
            onClick={handleBulkAction} 
            variant="contained" 
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            disabled={!bulkAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Task Item Component
function TaskItem({ task, students, onEdit, onDelete, onComplete, selected, onSelect, isOverdue, isDueSoon, isCompleted }) {
  const theme = useTheme();
  const student = students.find(s => s.id === task.studentId);
  const daysUntilDue = differenceInDays(new Date(task.dueDate), new Date());

  return (
    <ListItem 
      sx={{ 
        border: '1px solid',
        borderColor: isOverdue ? theme.palette.error.main : 
                    isDueSoon ? theme.palette.warning.main : 
                    isCompleted ? theme.palette.success.main : theme.palette.divider,
        borderRadius: 2,
        mb: 1,
        backgroundColor: isOverdue ? theme.palette.error[50] : 
                        isDueSoon ? theme.palette.warning[50] : 
                        isCompleted ? theme.palette.success[50] : 'transparent'
      }}
    >
      <Checkbox
        checked={selected}
        onChange={onSelect}
        sx={{ mr: 1 }}
      />
      <ListItemIcon>
        <Avatar sx={{ 
          bgcolor: isOverdue ? theme.palette.error.main : 
                   isDueSoon ? theme.palette.warning.main : 
                   isCompleted ? theme.palette.success.main : theme.palette.primary.main 
        }}>
          <TaskIcon />
        </Avatar>
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography 
            variant="body1" 
            component="span"
            sx={{ 
              fontWeight: 600,
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? theme.palette.text.secondary : theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap'
            }}
          >
            {task.title}
            <Chip
              label={PRIORITY_LEVELS.find(p => p.value === task.priority)?.label}
              color={getPriorityColor(task.priority)}
              size="small"
            />
            <Chip
              label={TASK_TYPES.find(t => t.value === task.type)?.label}
              color={getTypeColor(task.type)}
              size="small"
            />
            {isOverdue && (
              <Chip
                label="OVERDUE"
                color="error"
                size="small"
                icon={<WarningIcon />}
              />
            )}
            {isDueSoon && !isOverdue && (
              <Chip
                label={`Due in ${daysUntilDue} days`}
                color="warning"
                size="small"
                icon={<DeadlineIcon />}
              />
            )}
          </Typography>
        }
        secondary={
          <Typography 
            variant="body2" 
            component="span"
            color="textSecondary" 
            sx={{ 
              display: 'block',
              mb: 1
            }}
          >
            {task.description}
            <Typography 
              variant="caption" 
              component="span"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                flexWrap: 'wrap',
                mt: 1
              }}
            >
              <Typography 
                variant="caption" 
                component="span"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <CalendarIcon sx={{ fontSize: '1rem' }} />
                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </Typography>
              {student && (
                <Typography 
                  variant="caption" 
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <PersonIcon sx={{ fontSize: '1rem' }} />
                  {student.firstName} {student.lastName}
                </Typography>
              )}
              {task.reminder && (
                <Typography 
                  variant="caption" 
                  component="span"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <NotificationsIcon sx={{ fontSize: '1rem' }} />
                  Reminder set
                </Typography>
              )}
            </Typography>
          </Typography>
        }
      />
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isCompleted && (
            <Tooltip title="Mark as Complete">
              <IconButton
                onClick={onComplete}
                sx={{ color: theme.palette.success.main }}
              >
                <CompleteIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton onClick={onEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              onClick={onDelete}
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

export default Tasks; 