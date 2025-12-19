import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  NotificationsActive as NotificationsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDateTime, formatDateForInput, formatTimeForInput } from '../../utils/dateUtils';
import axiosInstance from '../../utils/axios';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const TASK_TYPES = ['DOCUMENT', 'APPLICATION', 'INTERVIEW', 'FOLLOW_UP', 'OTHER'];

function TaskManager({ studentId }) {
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'DOCUMENT',
    priority: 'MEDIUM',
    dueDate: formatDateForInput(new Date().toISOString()),
    dueTime: formatTimeForInput(new Date().toISOString()),
    completed: false,
    reminder: false
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/counselor/students/${studentId}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [studentId]);

  const handleOpenDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        type: task.type,
        priority: task.priority,
        dueDate: formatDateForInput(task.dueDate),
        dueTime: formatTimeForInput(task.dueDate),
        completed: task.completed,
        reminder: task.reminder
      });
    } else {
      setSelectedTask(null);
      const defaultFormData = {
        title: '',
        description: '',
        type: 'DOCUMENT',
        priority: 'MEDIUM',
        dueDate: formatDateForInput(new Date().toISOString()),
        dueTime: formatTimeForInput(new Date().toISOString()),
        completed: false,
        reminder: false
      };
      setFormData(defaultFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
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
    
    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.dueDate || !formData.dueTime) {
      setError('Due date and time are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const taskData = {
        ...formData,
        dueDate: new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString()
      };
      delete taskData.dueTime;

      let response;
      if (selectedTask) {
        response = await axiosInstance.put(`/counselor/students/${studentId}/tasks/${selectedTask.id}`, taskData);
        showSuccessMessage('Task updated successfully!');
      } else {
        response = await axiosInstance.post(`/counselor/students/${studentId}/tasks`, taskData);
        showSuccessMessage('Task created successfully!');
      }
      
      fetchTasks();
      handleCloseDialog();
      
    } catch (error) {
      console.error('Error saving task:', error);
      
      let errorMsg;
      if (error.response?.status === 401) {
        errorMsg = 'Authentication failed. Please log in again.';
        setError(errorMsg);
        showErrorMessage(errorMsg);
      } else if (error.response?.status === 403) {
        errorMsg = 'You do not have permission to perform this action.';
        setError(errorMsg);
        showErrorMessage(errorMsg);
      } else if (error.response?.status === 404) {
        errorMsg = 'Student not found or access denied.';
        setError(errorMsg);
        showErrorMessage(errorMsg);
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
        setError(errorMsg);
        showErrorMessage(errorMsg);
      } else {
        errorMsg = 'Failed to save task. Please try again.';
        setError(errorMsg);
        showErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };


  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/counselor/students/${studentId}/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      await axiosInstance.put(`/counselor/students/${studentId}/tasks/${task.id}`, {
        ...task,
        completed: !task.completed
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Tasks & Reminders</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Task
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {tasks.map((task) => (
              <ListItem
                key={task.id}
                divider
                sx={{
                  bgcolor: task.completed ? 'action.hover' : 'inherit',
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}
              >
                <ListItemIcon>
                  <IconButton
                    edge="start"
                    onClick={() => handleToggleComplete(task)}
                    color={task.completed ? 'success' : 'default'}
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        color={task.completed ? 'text.secondary' : 'text.primary'}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                      {task.reminder && (
                        <NotificationsIcon fontSize="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {task.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {formatDateTime(task.dueDate)}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleOpenDialog(task)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(task.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          aria-labelledby="task-dialog-title"
          aria-describedby="task-dialog-description"
          disableEnforceFocus={true}
        >
          <DialogTitle id="task-dialog-title">
            {selectedTask ? 'Edit Task' : 'New Task'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent id="task-dialog-description">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      label="Type"
                    >
                      {TASK_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      value={formData.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                      label="Priority"
                    >
                      {PRIORITIES.map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          {priority}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={(e) => handleFormChange('dueDate', e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Due Time"
                    value={formData.dueTime}
                    onChange={(e) => handleFormChange('dueTime', e.target.value)}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.reminder}
                        onChange={(e) => handleFormChange('reminder', e.target.checked)}
                      />
                    }
                    label="Set Reminder"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : (selectedTask ? 'Save' : 'Add')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnackbar}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}

export default TaskManager; 