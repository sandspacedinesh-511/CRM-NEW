import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

// Application Edit Form Component
const ApplicationEditForm = ({ application, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    courseName: application.courseName || '',
    courseLevel: application.courseLevel || 'UNDERGRADUATE',
    intakeTerm: application.intakeTerm || '',
    applicationStatus: application.applicationStatus || 'PENDING',
    applicationFee: application.applicationFee || '',
    priority: application.priority || 1,
    isPrimaryChoice: application.isPrimaryChoice || false,
    isBackupChoice: application.isBackupChoice || false,
    notes: application.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Course Name"
            value={formData.courseName}
            onChange={(e) => handleChange('courseName', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Course Level</InputLabel>
            <Select
              value={formData.courseLevel}
              onChange={(e) => handleChange('courseLevel', e.target.value)}
              label="Course Level"
            >
              <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
              <MenuItem value="POSTGRADUATE">Postgraduate</MenuItem>
              <MenuItem value="PHD">PhD</MenuItem>
              <MenuItem value="DIPLOMA">Diploma</MenuItem>
              <MenuItem value="CERTIFICATE">Certificate</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Intake Term"
            value={formData.intakeTerm}
            onChange={(e) => handleChange('intakeTerm', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.applicationStatus}
              onChange={(e) => handleChange('applicationStatus', e.target.value)}
              label="Status"
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="SUBMITTED">Submitted</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="DEFERRED">Deferred</MenuItem>
              <MenuItem value="WAITLISTED">Waitlisted</MenuItem>
              <MenuItem value="CONDITIONAL_OFFER">Conditional Offer</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Application Fee ($)"
            value={formData.applicationFee}
            onChange={(e) => handleChange('applicationFee', e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Priority"
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            inputProps={{ min: 1, max: 10 }}
            helperText="1 = Highest priority"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes about this application..."
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

const MultiCountryDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadStudentsWithMultipleCountries();
    }
  }, [user, authLoading]);

  const loadStudentsWithMultipleCountries = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/applications/multiple-countries');
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students with multiple country applications');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      case 'SUBMITTED': return 'info';
      case 'UNDER_REVIEW': return 'primary';
      default: return 'default';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircleIcon />;
      case 'REJECTED': return <WarningIcon />;
      case 'PENDING': return <InfoIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getCountryFlag = (country) => {
    const flagMap = {
      'United Kingdom': '🇬🇧',
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪'
    };
    return flagMap[country] || '🏳️';
  };

  const handleViewStudentDetails = (student) => {
    navigate(`/counselor/students/${student.id}`);
  };

  const handleEditApplication = (application) => {
    setSelectedApplication(application);
    setEditDialogOpen(true);
  };

  const handleSaveApplication = async (updatedData) => {
    try {
      await axiosInstance.put(`/counselor/applications/${selectedApplication.id}`, updatedData);
      // Reload the data
      await loadStudentsWithMultipleCountries();
      setEditDialogOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application:', error);
      setError('Failed to update application');
    }
  };

  const handleDeleteApplication = (application) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteApplication = async () => {
    try {
      await axiosInstance.delete(`/counselor/applications/${selectedApplication.id}`);
      // Reload the data
      await loadStudentsWithMultipleCountries();
      setDeleteDialogOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      setError('Failed to delete application');
    }
  };

  const renderStudentCard = (student) => {
    const totalApplications = student.applications?.length || 0;
    const countries = [...new Set(student.applications?.map(app => app.university?.country).filter(Boolean))];
    const acceptedApplications = student.applications?.filter(app => app.applicationStatus === 'ACCEPTED').length || 0;
    const pendingApplications = student.applications?.filter(app => ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.applicationStatus)).length || 0;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {student.firstName} {student.lastName}
            </Typography>
            <Chip 
              label={`${countries.length} countries`} 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="textSecondary">
                Total Applications
              </Typography>
              <Typography variant="h6">{totalApplications}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="textSecondary">
                Countries Applied
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {countries.map(country => (
                  <Chip
                    key={country}
                    label={country}
                    size="small"
                    icon={<span>{getCountryFlag(country)}</span>}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="textSecondary">
                Accepted
              </Typography>
              <Typography variant="h6" color="success.main">
                {acceptedApplications}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="textSecondary">
                Pending
              </Typography>
              <Typography variant="h6" color="warning.main">
                {pendingApplications}
              </Typography>
            </Grid>
          </Grid>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                <SchoolIcon sx={{ mr: 1, fontSize: 20 }} />
                Application Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell>University</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {student.applications?.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '8px' }}>
                              {getCountryFlag(app.university?.country)}
                            </span>
                            {app.university?.country}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {app.university?.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {app.courseName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {app.courseLevel}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getApplicationStatusIcon(app.applicationStatus)}
                            label={app.applicationStatus}
                            color={getApplicationStatusColor(app.applicationStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.priority}
                            color={app.isPrimaryChoice ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewStudentDetails(student)}
                              title="View Details"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="secondary"
                              onClick={() => handleEditApplication(app)}
                              title="Edit Application"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteApplication(app)}
                              title="Delete Application"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  const renderStatistics = () => {
    const totalStudents = students.length;
    const totalApplications = students.reduce((sum, student) => sum + (student.applications?.length || 0), 0);
    const totalCountries = new Set(students.flatMap(student => 
      student.applications?.map(app => app.university?.country).filter(Boolean) || []
    )).size;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {totalStudents}
              </Typography>
              <Typography variant="subtitle1">
                Students with Multiple Countries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="secondary">
                {totalApplications}
              </Typography>
              <Typography variant="subtitle1">
                Total Applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success">
                {totalCountries}
              </Typography>
              <Typography variant="subtitle1">
                Countries Covered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Please log in to view multi-country application data.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Country Applications Dashboard
      </Typography>
      
      {renderStatistics()}

      <Typography variant="h6" gutterBottom>
        Students with Multiple Country Applications
      </Typography>

      {students.length === 0 ? (
        <Alert severity="info">
          No students with multiple country applications found.
        </Alert>
      ) : (
        students.map(student => renderStudentCard(student))
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the application for{' '}
            <strong>{selectedApplication?.university?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteApplication} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Application</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <ApplicationEditForm 
              application={selectedApplication}
              onSave={handleSaveApplication}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MultiCountryDashboard;
